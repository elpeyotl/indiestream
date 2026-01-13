-- Artists can listen to their own music unlimited (without consuming free plays)
-- This migration adds a helper function to check if a user owns a track's band

-- Function to check if a user owns the band for a given track
CREATE OR REPLACE FUNCTION public.user_owns_track_band(p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_band_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get the track's band_id
    SELECT band_id INTO v_band_id
    FROM public.tracks
    WHERE id = p_track_id;

    IF v_band_id IS NULL THEN
        RETURN false;
    END IF;

    -- Check if user owns this band
    RETURN EXISTS (
        SELECT 1 FROM public.bands
        WHERE id = v_band_id AND owner_id = v_user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_track_band(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.user_owns_track_band IS
'Check if the current user owns the band that a track belongs to. Used to exempt artists from free play limits on their own music.';
