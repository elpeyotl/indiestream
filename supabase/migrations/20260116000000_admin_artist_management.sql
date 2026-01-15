-- Add artist management fields for admin dashboard
-- Allows admins to feature artists, track flags, and manage artist status

-- Add featured artist capability
ALTER TABLE public.bands
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS featured_by UUID REFERENCES public.profiles(id);

-- Add artist status tracking (active, suspended, removed)
ALTER TABLE public.bands
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed'));

-- Add flag/report tracking for analytics
ALTER TABLE public.bands
ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;

-- Add ban/suspension tracking
ALTER TABLE public.bands
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_bands_is_featured ON public.bands(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_bands_status ON public.bands(status);
CREATE INDEX IF NOT EXISTS idx_bands_is_verified ON public.bands(is_verified) WHERE is_verified = true;

-- Update RLS policies to allow admin full access
-- Admins can view all bands (including suspended/removed)
DROP POLICY IF EXISTS "Admins can view all bands" ON public.bands;
CREATE POLICY "Admins can view all bands"
  ON public.bands
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any band
DROP POLICY IF EXISTS "Admins can update any band" ON public.bands;
CREATE POLICY "Admins can update any band"
  ON public.bands
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete any band
DROP POLICY IF EXISTS "Admins can delete any band" ON public.bands;
CREATE POLICY "Admins can delete any band"
  ON public.bands
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comment on new columns
COMMENT ON COLUMN public.bands.is_featured IS 'Whether this artist is featured on the homepage';
COMMENT ON COLUMN public.bands.featured_at IS 'When this artist was featured';
COMMENT ON COLUMN public.bands.featured_by IS 'Admin who featured this artist';
COMMENT ON COLUMN public.bands.status IS 'Artist account status: active, suspended, or removed';
COMMENT ON COLUMN public.bands.flag_count IS 'Number of flags/reports against this artist';
COMMENT ON COLUMN public.bands.suspended_at IS 'When this artist was suspended';
COMMENT ON COLUMN public.bands.suspended_by IS 'Admin who suspended this artist';
COMMENT ON COLUMN public.bands.suspension_reason IS 'Reason for suspension';
