-- Add unique constraint on ISRC codes
-- ISRC (International Standard Recording Code) must be globally unique per recording

-- First, drop the existing index (we'll recreate as unique)
DROP INDEX IF EXISTS idx_tracks_isrc;

-- Add unique constraint on ISRC (allows NULLs - only filled ISRCs must be unique)
CREATE UNIQUE INDEX idx_tracks_isrc_unique ON tracks(isrc) WHERE isrc IS NOT NULL;

-- Add comment explaining the constraint
COMMENT ON COLUMN tracks.isrc IS 'International Standard Recording Code - must be unique when provided. Format: CC-XXX-YY-NNNNN';
