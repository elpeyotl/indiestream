-- Featured Genres Migration
-- Allows admins to curate and order featured genres on the /genres page

CREATE TABLE IF NOT EXISTS public.featured_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_slug TEXT NOT NULL UNIQUE,
  genre_name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  featured_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_featured_genres_position ON public.featured_genres(position);

-- Enable RLS
ALTER TABLE public.featured_genres ENABLE ROW LEVEL SECURITY;

-- Anyone can read featured genres (public data)
CREATE POLICY "Anyone can view featured genres"
  ON public.featured_genres FOR SELECT
  USING (true);

-- Only admins can insert featured genres
CREATE POLICY "Admins can insert featured genres"
  ON public.featured_genres FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update featured genres
CREATE POLICY "Admins can update featured genres"
  ON public.featured_genres FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete featured genres
CREATE POLICY "Admins can delete featured genres"
  ON public.featured_genres FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.featured_genres IS 'Admin-curated list of featured genres displayed on /genres page';
COMMENT ON COLUMN public.featured_genres.genre_slug IS 'Normalized slug matching the genre URL (e.g., "indie-rock")';
COMMENT ON COLUMN public.featured_genres.genre_name IS 'Display name for the genre (e.g., "Indie Rock")';
COMMENT ON COLUMN public.featured_genres.position IS 'Display order (lower = first)';
