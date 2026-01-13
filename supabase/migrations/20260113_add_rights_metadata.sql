-- ============================================
-- ADD RIGHTS METADATA FOR PRO REPORTING
-- Run this in Supabase SQL Editor
-- ============================================

-- Track metadata for royalties
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS isrc VARCHAR(12);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS iswc VARCHAR(15);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS spotify_track_id VARCHAR(50);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS musicbrainz_work_id UUID;

-- Album metadata
ALTER TABLE albums ADD COLUMN IF NOT EXISTS upc VARCHAR(12);
ALTER TABLE albums ADD COLUMN IF NOT EXISTS label_name VARCHAR(255);
ALTER TABLE albums ADD COLUMN IF NOT EXISTS p_line VARCHAR(255); -- ℗ 2026 Label Name
ALTER TABLE albums ADD COLUMN IF NOT EXISTS c_line VARCHAR(255); -- © 2026 Publisher

-- Rights confirmation on publish
ALTER TABLE albums ADD COLUMN IF NOT EXISTS rights_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS rights_confirmed_at TIMESTAMPTZ;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS rights_confirmed_by UUID REFERENCES profiles(id);

-- Track credits (composer/songwriter splits)
CREATE TABLE IF NOT EXISTS track_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'composer', 'lyricist', 'performer', 'producer', 'arranger'
  name VARCHAR(255) NOT NULL,
  ipi_number VARCHAR(20), -- PRO identifier (optional)
  share_percentage DECIMAL(5,2) DEFAULT 100, -- Publishing split
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_track_credits_track_id ON track_credits(track_id);
CREATE INDEX IF NOT EXISTS idx_tracks_isrc ON tracks(isrc);

-- RLS for track_credits
ALTER TABLE track_credits ENABLE ROW LEVEL SECURITY;

-- Public can view track credits (for album pages)
DROP POLICY IF EXISTS "Public can view track credits" ON track_credits;
CREATE POLICY "Public can view track credits"
  ON track_credits FOR SELECT
  USING (true);

-- Band owners can insert track credits
DROP POLICY IF EXISTS "Band owners can insert track credits" ON track_credits;
CREATE POLICY "Band owners can insert track credits"
  ON track_credits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN bands b ON t.band_id = b.id
      WHERE t.id = track_credits.track_id
      AND b.owner_id = auth.uid()
    )
  );

-- Band owners can update their track credits
DROP POLICY IF EXISTS "Band owners can update track credits" ON track_credits;
CREATE POLICY "Band owners can update track credits"
  ON track_credits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN bands b ON t.band_id = b.id
      WHERE t.id = track_credits.track_id
      AND b.owner_id = auth.uid()
    )
  );

-- Band owners can delete their track credits
DROP POLICY IF EXISTS "Band owners can delete track credits" ON track_credits;
CREATE POLICY "Band owners can delete track credits"
  ON track_credits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN bands b ON t.band_id = b.id
      WHERE t.id = track_credits.track_id
      AND b.owner_id = auth.uid()
    )
  );

-- Verification query
SELECT
  'tracks' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'tracks'
AND column_name IN ('isrc', 'iswc', 'is_cover', 'spotify_track_id', 'musicbrainz_work_id')
UNION ALL
SELECT
  'albums' as table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'albums'
AND column_name IN ('upc', 'label_name', 'p_line', 'c_line', 'rights_confirmed');
