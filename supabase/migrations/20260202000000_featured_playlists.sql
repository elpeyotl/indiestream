-- Featured Playlists Migration
-- Adds ability for admins to feature curated playlists on the discover page

-- Add featured fields to playlists table
ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS featured_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS cover_key TEXT,
ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT FALSE;

-- Index for efficient featured playlist queries
CREATE INDEX IF NOT EXISTS idx_playlists_is_featured ON public.playlists(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_playlists_is_curated ON public.playlists(is_curated) WHERE is_curated = TRUE;

-- Update RLS policies to allow admins to manage all playlists

-- Admins can view all playlists
CREATE POLICY "Admins can view all playlists"
  ON public.playlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any playlist (for featuring)
CREATE POLICY "Admins can update any playlist"
  ON public.playlists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON COLUMN public.playlists.is_featured IS 'Whether this playlist is featured on the discover page';
COMMENT ON COLUMN public.playlists.featured_at IS 'When this playlist was featured';
COMMENT ON COLUMN public.playlists.featured_by IS 'Admin who featured this playlist';
COMMENT ON COLUMN public.playlists.cover_key IS 'R2 storage key for playlist cover image';
COMMENT ON COLUMN public.playlists.is_curated IS 'Whether this is a platform-curated playlist (created by admins)';
