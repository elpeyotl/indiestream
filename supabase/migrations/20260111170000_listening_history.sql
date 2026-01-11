-- Listening history table for tracking user streams
CREATE TABLE IF NOT EXISTS public.listening_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    listened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER NOT NULL DEFAULT 0, -- How long they actually listened
    completed BOOLEAN NOT NULL DEFAULT false -- Did they listen to at least 30 seconds?
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_listening_history_user ON public.listening_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_track ON public.listening_history(track_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_band ON public.listening_history(band_id);
CREATE INDEX IF NOT EXISTS idx_listening_history_listened_at ON public.listening_history(listened_at DESC);

-- RLS policies
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own listening history
CREATE POLICY "Users can view own listening history" ON public.listening_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own listening history
CREATE POLICY "Users can insert own listening history" ON public.listening_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Band owners can see streams for their tracks (for analytics)
CREATE POLICY "Band owners can view streams for their tracks" ON public.listening_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bands b
            WHERE b.id = listening_history.band_id AND b.owner_id = auth.uid()
        )
    );

-- Function to record a stream and increment track count
CREATE OR REPLACE FUNCTION public.record_stream(
    p_track_id UUID,
    p_duration_seconds INTEGER
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

    -- Insert listening history
    INSERT INTO public.listening_history (
        user_id,
        track_id,
        band_id,
        album_id,
        duration_seconds,
        completed
    ) VALUES (
        auth.uid(),
        p_track_id,
        v_track.band_id,
        v_track.album_id,
        p_duration_seconds,
        v_completed
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
GRANT EXECUTE ON FUNCTION public.record_stream TO authenticated;
