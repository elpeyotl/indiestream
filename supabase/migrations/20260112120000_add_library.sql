-- Add library tables for saved albums and liked tracks

-- Saved albums table
CREATE TABLE IF NOT EXISTS public.saved_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, album_id)
);

-- Liked tracks table
CREATE TABLE IF NOT EXISTS public.liked_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, track_id)
);

-- Indexes for saved_albums
CREATE INDEX IF NOT EXISTS idx_saved_albums_user_id ON public.saved_albums(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_albums_album_id ON public.saved_albums(album_id);
CREATE INDEX IF NOT EXISTS idx_saved_albums_created_at ON public.saved_albums(created_at DESC);

-- Indexes for liked_tracks
CREATE INDEX IF NOT EXISTS idx_liked_tracks_user_id ON public.liked_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_tracks_track_id ON public.liked_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_liked_tracks_created_at ON public.liked_tracks(created_at DESC);

-- Enable RLS
ALTER TABLE public.saved_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_albums
CREATE POLICY "Users can view their saved albums"
    ON public.saved_albums FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save albums"
    ON public.saved_albums FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave albums"
    ON public.saved_albums FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for liked_tracks
CREATE POLICY "Users can view their liked tracks"
    ON public.liked_tracks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can like tracks"
    ON public.liked_tracks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tracks"
    ON public.liked_tracks FOR DELETE
    USING (auth.uid() = user_id);

-- Function to save an album
CREATE OR REPLACE FUNCTION public.save_album(p_album_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.albums WHERE id = p_album_id) THEN
        RETURN false;
    END IF;

    INSERT INTO public.saved_albums (user_id, album_id)
    VALUES (auth.uid(), p_album_id)
    ON CONFLICT (user_id, album_id) DO NOTHING;

    RETURN true;
END;
$$;

-- Function to unsave an album
CREATE OR REPLACE FUNCTION public.unsave_album(p_album_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.saved_albums
    WHERE user_id = auth.uid() AND album_id = p_album_id;

    RETURN true;
END;
$$;

-- Function to check if album is saved
CREATE OR REPLACE FUNCTION public.is_album_saved(p_album_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.saved_albums
        WHERE user_id = auth.uid() AND album_id = p_album_id
    );
END;
$$;

-- Function to like a track
CREATE OR REPLACE FUNCTION public.like_track(p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.tracks WHERE id = p_track_id) THEN
        RETURN false;
    END IF;

    INSERT INTO public.liked_tracks (user_id, track_id)
    VALUES (auth.uid(), p_track_id)
    ON CONFLICT (user_id, track_id) DO NOTHING;

    RETURN true;
END;
$$;

-- Function to unlike a track
CREATE OR REPLACE FUNCTION public.unlike_track(p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.liked_tracks
    WHERE user_id = auth.uid() AND track_id = p_track_id;

    RETURN true;
END;
$$;

-- Function to check if track is liked
CREATE OR REPLACE FUNCTION public.is_track_liked(p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.liked_tracks
        WHERE user_id = auth.uid() AND track_id = p_track_id
    );
END;
$$;

-- Function to check multiple tracks at once (for efficiency)
CREATE OR REPLACE FUNCTION public.get_liked_track_ids(p_track_ids UUID[])
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN ARRAY(
        SELECT track_id FROM public.liked_tracks
        WHERE user_id = auth.uid() AND track_id = ANY(p_track_ids)
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.save_album TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsave_album TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_album_saved TO authenticated;
GRANT EXECUTE ON FUNCTION public.like_track TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_track TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_track_liked TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_liked_track_ids TO authenticated;

-- Comments
COMMENT ON TABLE public.saved_albums IS 'Albums saved to user library';
COMMENT ON TABLE public.liked_tracks IS 'Tracks liked/hearted by users';
