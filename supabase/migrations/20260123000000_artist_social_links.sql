-- ============================================
-- ARTIST SOCIAL LINKS
-- Add social media links for better verification
-- ============================================

-- Add social media link columns to bands table
ALTER TABLE bands ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS spotify TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS soundcloud TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS bandcamp TEXT;
ALTER TABLE bands ADD COLUMN IF NOT EXISTS tiktok TEXT;

-- Add comments for documentation
COMMENT ON COLUMN bands.instagram IS 'Instagram username or profile URL';
COMMENT ON COLUMN bands.twitter IS 'Twitter/X username or profile URL';
COMMENT ON COLUMN bands.facebook IS 'Facebook page URL';
COMMENT ON COLUMN bands.youtube IS 'YouTube channel URL';
COMMENT ON COLUMN bands.spotify IS 'Spotify artist URL';
COMMENT ON COLUMN bands.soundcloud IS 'SoundCloud profile URL';
COMMENT ON COLUMN bands.bandcamp IS 'Bandcamp page URL';
COMMENT ON COLUMN bands.tiktok IS 'TikTok username or profile URL';
