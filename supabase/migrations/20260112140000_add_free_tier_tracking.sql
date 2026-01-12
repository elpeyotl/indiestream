-- Add free tier usage tracking for limited full-track access

-- Add columns to profiles for free tier tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_full_plays INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS play_allowance_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Add is_free_play column to listening_history to distinguish free vs paid streams
ALTER TABLE public.listening_history
ADD COLUMN IF NOT EXISTS is_free_play BOOLEAN DEFAULT FALSE;

-- Index for filtering free plays in analytics
CREATE INDEX IF NOT EXISTS idx_listening_history_is_free_play ON public.listening_history(is_free_play);

-- Constants: 5 free full-track plays per month
-- Reset happens on the 1st of each month

-- Function to check and use a free play
-- Returns: 'allowed' if can play, 'limit_reached' if at limit, 'subscribed' if has subscription
CREATE OR REPLACE FUNCTION public.check_free_play_allowance()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_monthly_plays INTEGER;
    v_reset_at TIMESTAMPTZ;
    v_has_subscription BOOLEAN;
    v_month_start TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN 'unauthenticated';
    END IF;

    -- Check if user has an active subscription
    SELECT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = v_user_id
        AND stripe_subscription_id IS NOT NULL
        AND status IN ('active', 'trialing')
    ) INTO v_has_subscription;

    IF v_has_subscription THEN
        RETURN 'subscribed';
    END IF;

    -- Get current play count and reset timestamp
    SELECT monthly_full_plays, play_allowance_reset_at
    INTO v_monthly_plays, v_reset_at
    FROM public.profiles
    WHERE id = v_user_id;

    -- Calculate the start of the current month
    v_month_start := date_trunc('month', NOW());

    -- Reset if we're in a new month
    IF v_reset_at IS NULL OR v_reset_at < v_month_start THEN
        UPDATE public.profiles
        SET monthly_full_plays = 0,
            play_allowance_reset_at = NOW()
        WHERE id = v_user_id;
        v_monthly_plays := 0;
    END IF;

    -- Check if under limit (5 free plays)
    IF COALESCE(v_monthly_plays, 0) < 5 THEN
        RETURN 'allowed';
    ELSE
        RETURN 'limit_reached';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_free_play_allowance TO authenticated;

-- Function to consume a free play (called when recording a free stream)
CREATE OR REPLACE FUNCTION public.use_free_play()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_status TEXT;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Check current allowance status
    v_status := public.check_free_play_allowance();

    IF v_status = 'allowed' THEN
        -- Increment the play count
        UPDATE public.profiles
        SET monthly_full_plays = COALESCE(monthly_full_plays, 0) + 1,
            play_allowance_reset_at = COALESCE(play_allowance_reset_at, NOW())
        WHERE id = v_user_id;
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_free_play TO authenticated;

-- Function to get free tier status for current user
CREATE OR REPLACE FUNCTION public.get_free_tier_status()
RETURNS TABLE(
    plays_used INTEGER,
    plays_remaining INTEGER,
    resets_at TIMESTAMPTZ,
    is_subscribed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_monthly_plays INTEGER;
    v_reset_at TIMESTAMPTZ;
    v_has_subscription BOOLEAN;
    v_month_start TIMESTAMPTZ;
    v_next_month TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Check subscription
    SELECT EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = v_user_id
        AND stripe_subscription_id IS NOT NULL
        AND status IN ('active', 'trialing')
    ) INTO v_has_subscription;

    -- Get current state
    SELECT p.monthly_full_plays, p.play_allowance_reset_at
    INTO v_monthly_plays, v_reset_at
    FROM public.profiles p
    WHERE p.id = v_user_id;

    v_month_start := date_trunc('month', NOW());
    v_next_month := date_trunc('month', NOW() + INTERVAL '1 month');

    -- Reset if new month
    IF v_reset_at IS NULL OR v_reset_at < v_month_start THEN
        v_monthly_plays := 0;
    END IF;

    RETURN QUERY SELECT
        COALESCE(v_monthly_plays, 0),
        GREATEST(0, 5 - COALESCE(v_monthly_plays, 0)),
        v_next_month,
        v_has_subscription;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_free_tier_status TO authenticated;

-- Update record_stream to accept is_free_play parameter
-- This replaces the existing function
DROP FUNCTION IF EXISTS public.record_stream(UUID, INTEGER, VARCHAR);

CREATE OR REPLACE FUNCTION public.record_stream(
    p_track_id UUID,
    p_duration_seconds INTEGER,
    p_country_code VARCHAR(2) DEFAULT NULL,
    p_is_free_play BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_track RECORD;
    v_completed BOOLEAN;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Get track details
    SELECT t.id, t.band_id, t.album_id
    INTO v_track
    FROM public.tracks t
    WHERE t.id = p_track_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- A stream counts if listened for at least 30 seconds
    v_completed := p_duration_seconds >= 30;

    -- If this is a free play and stream is completed, consume one free play
    IF p_is_free_play AND v_completed THEN
        UPDATE public.profiles
        SET monthly_full_plays = COALESCE(monthly_full_plays, 0) + 1,
            play_allowance_reset_at = COALESCE(play_allowance_reset_at, NOW())
        WHERE id = v_user_id;
    END IF;

    -- Insert listening history with free play flag
    INSERT INTO public.listening_history (
        user_id,
        track_id,
        band_id,
        album_id,
        duration_seconds,
        completed,
        country_code,
        is_free_play
    ) VALUES (
        v_user_id,
        p_track_id,
        v_track.band_id,
        v_track.album_id,
        p_duration_seconds,
        v_completed,
        UPPER(p_country_code),
        p_is_free_play
    );

    -- Only increment stream count if completed AND NOT a free play
    -- Free plays don't count toward artist stats or payouts
    IF v_completed AND NOT p_is_free_play THEN
        UPDATE public.tracks
        SET stream_count = COALESCE(stream_count, 0) + 1
        WHERE id = p_track_id;

        -- Also update band's total streams
        UPDATE public.bands
        SET total_streams = COALESCE(total_streams, 0) + 1
        WHERE id = v_track.band_id;
    END IF;

    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_stream(UUID, INTEGER, VARCHAR, BOOLEAN) TO authenticated;

-- Update the analytics function to exclude free plays
CREATE OR REPLACE FUNCTION public.get_band_streams_by_country(
    p_band_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    country_code VARCHAR(2),
    stream_count BIGINT,
    total_duration BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller owns this band
    IF NOT EXISTS (
        SELECT 1 FROM public.bands
        WHERE id = p_band_id AND owner_id = auth.uid()
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        lh.country_code,
        COUNT(*)::BIGINT as stream_count,
        COALESCE(SUM(lh.duration_seconds), 0)::BIGINT as total_duration
    FROM public.listening_history lh
    WHERE lh.band_id = p_band_id
      AND lh.completed = true
      AND lh.is_free_play = false  -- Exclude free plays from artist analytics
      AND lh.listened_at >= NOW() - (p_days || ' days')::INTERVAL
      AND lh.country_code IS NOT NULL
    GROUP BY lh.country_code
    ORDER BY stream_count DESC;
END;
$$;
