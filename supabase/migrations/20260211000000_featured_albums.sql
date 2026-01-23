-- Featured Albums Migration
-- Admin-curated albums for homepage display

CREATE TABLE IF NOT EXISTS public.featured_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  featured_at TIMESTAMPTZ DEFAULT NOW(),
  featured_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(album_id)
);

-- Index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_featured_albums_position ON public.featured_albums(position);

-- Enable RLS
ALTER TABLE public.featured_albums ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can view featured albums)
CREATE POLICY "Anyone can view featured albums"
  ON public.featured_albums FOR SELECT
  USING (true);

-- Admin insert
CREATE POLICY "Admins can insert featured albums"
  ON public.featured_albums FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin update
CREATE POLICY "Admins can update featured albums"
  ON public.featured_albums FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin delete
CREATE POLICY "Admins can delete featured albums"
  ON public.featured_albums FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
