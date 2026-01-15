-- ============================================
-- PLATFORM SETTINGS TABLE
-- Stores runtime configuration for the platform
-- ============================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update platform settings" ON public.platform_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert platform settings" ON public.platform_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('require_track_moderation', 'false', 'When enabled, only approved tracks are visible to users'),
  ('moderation_auto_approve_verified', 'false', 'Auto-approve tracks from verified artists')
ON CONFLICT (key) DO NOTHING;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);
