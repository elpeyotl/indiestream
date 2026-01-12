-- Add country tracking to listening history for PRO reporting and analytics

-- Add country column to listening_history
ALTER TABLE public.listening_history
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);

-- Create index for country-based queries (analytics, PRO reporting)
CREATE INDEX IF NOT EXISTS idx_listening_history_country ON public.listening_history(country_code);

-- Composite index for country + time range queries
CREATE INDEX IF NOT EXISTS idx_listening_history_country_time ON public.listening_history(country_code, listened_at DESC);

-- Drop old 2-parameter version of record_stream to avoid ambiguity
DROP FUNCTION IF EXISTS public.record_stream(UUID, INTEGER);

-- Update the record_stream function to accept country parameter
CREATE OR REPLACE FUNCTION public.record_stream(
    p_track_id UUID,
    p_duration_seconds INTEGER,
    p_country_code VARCHAR(2) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_track RECORD;
    v_completed BOOLEAN;
BEGIN
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

    -- Insert listening history with country
    INSERT INTO public.listening_history (
        user_id,
        track_id,
        band_id,
        album_id,
        duration_seconds,
        completed,
        country_code
    ) VALUES (
        auth.uid(),
        p_track_id,
        v_track.band_id,
        v_track.album_id,
        p_duration_seconds,
        v_completed,
        UPPER(p_country_code) -- Normalize to uppercase
    );

    -- Only increment stream count if completed (30+ seconds)
    IF v_completed THEN
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.record_stream(UUID, INTEGER, VARCHAR) TO authenticated;

-- Helper function to get streams by country for a band (for analytics)
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
      AND lh.listened_at >= NOW() - (p_days || ' days')::INTERVAL
      AND lh.country_code IS NOT NULL
    GROUP BY lh.country_code
    ORDER BY stream_count DESC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_band_streams_by_country TO authenticated;

-- Comment explaining country code source
COMMENT ON COLUMN public.listening_history.country_code IS 'ISO 3166-1 alpha-2 country code from Cloudflare CF-IPCountry or Vercel X-Vercel-IP-Country header';
