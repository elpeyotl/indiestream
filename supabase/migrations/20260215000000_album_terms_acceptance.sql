-- Add terms acceptance tracking to albums table
-- Used for legal compliance: stores when and which version of terms the artist accepted

ALTER TABLE albums ADD COLUMN IF NOT EXISTS terms_version TEXT;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS ip_address TEXT;
