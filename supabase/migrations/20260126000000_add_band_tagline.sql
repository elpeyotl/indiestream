-- Add tagline field to bands for short description shown in hero
-- Full bio stays in About tab

ALTER TABLE bands ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bands.tagline IS 'Short tagline/description shown in artist hero section. Full bio shown in About tab.';
