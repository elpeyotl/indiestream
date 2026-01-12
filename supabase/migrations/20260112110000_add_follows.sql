-- Add follows table for artist following functionality

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure a user can only follow a band once
    UNIQUE(user_id, band_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_follows_user_id ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_band_id ON public.follows(band_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at DESC);

-- Add follower_count to bands table for denormalized count
ALTER TABLE public.bands
ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can see all follows (for follower counts)
CREATE POLICY "Anyone can view follows"
    ON public.follows FOR SELECT
    USING (true);

-- Users can only insert their own follows
CREATE POLICY "Users can follow bands"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own follows
CREATE POLICY "Users can unfollow bands"
    ON public.follows FOR DELETE
    USING (auth.uid() = user_id);

-- Function to follow a band
CREATE OR REPLACE FUNCTION public.follow_band(p_band_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if band exists
    IF NOT EXISTS (SELECT 1 FROM public.bands WHERE id = p_band_id) THEN
        RETURN false;
    END IF;

    -- Insert follow (will fail silently if already following due to unique constraint)
    INSERT INTO public.follows (user_id, band_id)
    VALUES (auth.uid(), p_band_id)
    ON CONFLICT (user_id, band_id) DO NOTHING;

    -- Update follower count
    UPDATE public.bands
    SET follower_count = (
        SELECT COUNT(*) FROM public.follows WHERE band_id = p_band_id
    )
    WHERE id = p_band_id;

    RETURN true;
END;
$$;

-- Function to unfollow a band
CREATE OR REPLACE FUNCTION public.unfollow_band(p_band_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete the follow
    DELETE FROM public.follows
    WHERE user_id = auth.uid() AND band_id = p_band_id;

    -- Update follower count
    UPDATE public.bands
    SET follower_count = (
        SELECT COUNT(*) FROM public.follows WHERE band_id = p_band_id
    )
    WHERE id = p_band_id;

    RETURN true;
END;
$$;

-- Function to check if user is following a band
CREATE OR REPLACE FUNCTION public.is_following_band(p_band_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.follows
        WHERE user_id = auth.uid() AND band_id = p_band_id
    );
END;
$$;

-- Function to get user's followed bands
CREATE OR REPLACE FUNCTION public.get_followed_bands()
RETURNS TABLE(
    band_id UUID,
    band_name TEXT,
    band_slug TEXT,
    followed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id as band_id,
        b.name as band_name,
        b.slug as band_slug,
        f.created_at as followed_at
    FROM public.follows f
    JOIN public.bands b ON b.id = f.band_id
    WHERE f.user_id = auth.uid()
    ORDER BY f.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.follow_band TO authenticated;
GRANT EXECUTE ON FUNCTION public.unfollow_band TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_following_band TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_followed_bands TO authenticated;

-- Comments
COMMENT ON TABLE public.follows IS 'Tracks which users follow which artists/bands';
COMMENT ON COLUMN public.bands.follower_count IS 'Denormalized count of followers for display';
