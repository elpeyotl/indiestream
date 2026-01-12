-- Fix: Free play counting was happening multiple times
-- This updates record_stream to handle free play consumption atomically

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

-- Also run reset_counters.sql after this to start fresh for testing
