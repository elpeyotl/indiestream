-- =====================================================================
-- Security hardening migration (audit 2026-06-11)
--
-- Fixes:
--   C1  artist_balances: FOR ALL USING(true) -> service_role + owner SELECT
--   C2  payouts:          FOR ALL USING(true) -> service_role + owner SELECT
--   C3  profiles UPDATE:   add WITH CHECK + column guard (no self-admin)
--   H1  profiles SELECT:   stop leaking email / stripe ids to everyone
--   H2  bands UPDATE:      column guard (no self-verify/activate/inflate)
--   H3  ISRC RPCs:         revoke EXECUTE from anon/authenticated
--   M1  tracks SELECT:     respect moderation_status
--   M2  impact_shares:     drop USING(true) public SELECT
--   M3  notifications:     INSERT restricted to service_role
--   M4  content_reports:   bind reporter_id to caller
--   M5  record_stream:     server-side duration clamp + replay dedup
--   M6  SECURITY DEFINER:  pin search_path on every definer function
-- =====================================================================

-- ---------------------------------------------------------------------
-- Transaction-local flag that lets trusted SECURITY DEFINER functions
-- (record_stream) write the columns the guard triggers otherwise pin.
-- ---------------------------------------------------------------------

-- =====================================================================
-- C1 — artist_balances
-- =====================================================================
DROP POLICY IF EXISTS "Service role can manage balances" ON public.artist_balances;
CREATE POLICY "Service role can manage balances" ON public.artist_balances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Band owners can view balance" ON public.artist_balances;
CREATE POLICY "Band owners can view balance" ON public.artist_balances
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bands b
    WHERE b.id = artist_balances.band_id AND b.owner_id = auth.uid()
  ));

-- =====================================================================
-- C2 — payouts
-- =====================================================================
DROP POLICY IF EXISTS "Service role can manage payouts" ON public.payouts;
CREATE POLICY "Service role can manage payouts" ON public.payouts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Band owners can view payouts" ON public.payouts;
CREATE POLICY "Band owners can view payouts" ON public.payouts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bands b
    WHERE b.id = payouts.band_id AND b.owner_id = auth.uid()
  ));

-- artist_earnings is read by the earnings endpoints via the RLS client.
-- Add an owner SELECT policy only if the table exists in this database.
DO $$
BEGIN
  IF to_regclass('public.artist_earnings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.artist_earnings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage earnings" ON public.artist_earnings';
    EXECUTE 'CREATE POLICY "Service role can manage earnings" ON public.artist_earnings
               FOR ALL TO service_role USING (true) WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Band owners can view earnings" ON public.artist_earnings';
    EXECUTE 'CREATE POLICY "Band owners can view earnings" ON public.artist_earnings
               FOR SELECT TO authenticated
               USING (EXISTS (SELECT 1 FROM public.bands b
                              WHERE b.id = artist_earnings.band_id AND b.owner_id = auth.uid()))';
  END IF;
END $$;

-- =====================================================================
-- C3 — profiles: WITH CHECK + column guard (prevents self-admin etc.)
-- =====================================================================
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- service_role (server-side admin / sync) may change anything. For every
  -- other caller, pin the privileged columns to their previous values so a
  -- user cannot escalate their own role or hijack Stripe payout identifiers.
  -- (monthly_full_plays / play_allowance_reset_at are intentionally NOT pinned
  -- here: they are maintained by the SECURITY DEFINER free-play functions which
  -- run in the authenticated caller's context.)
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    NEW.role := OLD.role;
    NEW.email := OLD.email;
    NEW.stripe_account_id := OLD.stripe_account_id;
    NEW.stripe_account_status := OLD.stripe_account_status;
    NEW.stripe_onboarding_complete := OLD.stripe_onboarding_complete;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_cols ON public.profiles;
CREATE TRIGGER guard_profile_privileged_cols
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_cols();

-- =====================================================================
-- H1 — profiles: stop email / stripe ids leaking via the data API.
-- The row-level SELECT policy stays permissive (display_name/avatar/bio
-- must remain visible across users), but the sensitive columns are
-- removed from the data API for anon + authenticated via column-level
-- privileges. service_role (server-side own-row reads) is unaffected.
-- =====================================================================
REVOKE SELECT (email, stripe_account_id, stripe_account_status, stripe_onboarding_complete)
  ON public.profiles FROM anon, authenticated;

-- =====================================================================
-- H2 — bands: column guard (status/verified/featured/stats/stripe)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.guard_band_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND current_setting('app.allow_internal_writes', true) IS DISTINCT FROM 'on' THEN
    NEW.status := OLD.status;
    NEW.is_verified := OLD.is_verified;
    NEW.is_featured := OLD.is_featured;
    NEW.featured_by := OLD.featured_by;
    NEW.total_streams := OLD.total_streams;
    NEW.total_earnings_cents := OLD.total_earnings_cents;
    NEW.flag_count := OLD.flag_count;
    NEW.suspended_at := OLD.suspended_at;
    NEW.suspended_by := OLD.suspended_by;
    NEW.stripe_account_id := OLD.stripe_account_id;
    NEW.stripe_onboarding_complete := OLD.stripe_onboarding_complete;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_band_privileged_cols ON public.bands;
CREATE TRIGGER guard_band_privileged_cols
  BEFORE UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.guard_band_privileged_cols();

-- =====================================================================
-- H3 — ISRC RPCs: only the server (service_role) may call them.
-- All three are invoked exclusively from server endpoints that already
-- verify band ownership / admin before calling.
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.allocate_platform_isrc(UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_platform_isrc(UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_platform_isrc_to_track(UUID, TEXT) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.allocate_platform_isrc(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_platform_isrc(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_platform_isrc_to_track(UUID, TEXT) TO service_role;

-- =====================================================================
-- M1 — tracks: public SELECT must respect moderation_status
-- =====================================================================
DROP POLICY IF EXISTS "Tracks in published albums are viewable" ON public.tracks;
CREATE POLICY "Tracks in published albums are viewable" ON public.tracks
  FOR SELECT USING (
    (
      moderation_status IN ('approved', 'pending_update')
      AND EXISTS (
        SELECT 1 FROM public.albums a
        WHERE a.id = tracks.album_id AND a.is_published
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.bands b
      WHERE b.id = tracks.band_id AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================================
-- M2 — impact_shares: remove the blanket public SELECT.
-- Public share pages are resolved server-side (service_role) by token.
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can view shares by token" ON public.impact_shares;

-- =====================================================================
-- M3 — notifications: only service_role may create them
-- =====================================================================
-- The existing "Service role can insert notifications" policy is misnamed: it
-- is `FOR INSERT WITH CHECK (true)` with no role restriction, so any role can
-- insert. Drop and recreate it scoped to service_role.
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT TO service_role WITH CHECK (true);

-- =====================================================================
-- M4 — content_reports: reporter_id must be the caller (or anonymous)
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can create content reports" ON public.content_reports;
DROP POLICY IF EXISTS "Anyone can create reports" ON public.content_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.content_reports;
CREATE POLICY "Users can create reports" ON public.content_reports
  FOR INSERT
  WITH CHECK (reporter_id IS NULL OR reporter_id = auth.uid());

-- =====================================================================
-- M5 — record_stream: clamp duration server-side, dedup replays,
-- and only mutate accounting columns through the guarded flag.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.record_stream(
    p_track_id UUID,
    p_duration_seconds INTEGER,
    p_country_code VARCHAR(2) DEFAULT NULL,
    p_is_free_play BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_track RECORD;
    v_completed BOOLEAN;
    v_user_id UUID;
    v_duration INTEGER;
    v_recent_completed BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get track details (incl. real duration for clamping)
    SELECT t.id, t.band_id, t.album_id, t.duration_seconds
    INTO v_track
    FROM public.tracks t
    WHERE t.id = p_track_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Never trust the client-reported duration: clamp to [0, track length].
    v_duration := GREATEST(0, LEAST(COALESCE(p_duration_seconds, 0), COALESCE(v_track.duration_seconds, p_duration_seconds)));

    -- A stream counts if listened for at least 30 seconds (or the whole track).
    v_completed := v_duration >= LEAST(30, COALESCE(v_track.duration_seconds, 30));

    -- Replay protection: ignore a repeat completed play of the same track by
    -- the same user within the last hour (does not count, does not bill a play).
    v_recent_completed := EXISTS (
        SELECT 1 FROM public.listening_history lh
        WHERE lh.user_id = v_user_id
          AND lh.track_id = p_track_id
          AND lh.completed
          AND lh.listened_at > NOW() - INTERVAL '1 hour'
    );

    -- Allow this function (and only this function) to touch the guarded
    -- accounting columns on profiles / bands.
    PERFORM set_config('app.allow_internal_writes', 'on', true);

    -- Consume a free play only on the first completed play in the window.
    IF p_is_free_play AND v_completed AND NOT v_recent_completed THEN
        UPDATE public.profiles
        SET monthly_full_plays = COALESCE(monthly_full_plays, 0) + 1,
            play_allowance_reset_at = COALESCE(play_allowance_reset_at, NOW())
        WHERE id = v_user_id;
    END IF;

    INSERT INTO public.listening_history (
        user_id, track_id, band_id, album_id,
        duration_seconds, completed, country_code, is_free_play
    ) VALUES (
        v_user_id, p_track_id, v_track.band_id, v_track.album_id,
        v_duration, v_completed, UPPER(p_country_code), p_is_free_play
    );

    -- Count toward artist stats / payouts only for a non-free, non-replayed,
    -- completed stream.
    IF v_completed AND NOT p_is_free_play AND NOT v_recent_completed THEN
        UPDATE public.tracks
        SET stream_count = COALESCE(stream_count, 0) + 1
        WHERE id = p_track_id;

        UPDATE public.bands
        SET total_streams = COALESCE(total_streams, 0) + 1
        WHERE id = v_track.band_id;
    END IF;

    PERFORM set_config('app.allow_internal_writes', 'off', true);
    RETURN true;
END;
$$;

-- =====================================================================
-- P3 — Stripe webhook idempotency ledger.
-- Each webhook records event.id here before processing; a duplicate insert
-- (unique-violation) means the event was already handled and is skipped.
-- RLS on with no policies -> service_role only.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- M6 — pin search_path on every SECURITY DEFINER function in public.
-- =====================================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp', r.proname, r.args);
  END LOOP;
END $$;
