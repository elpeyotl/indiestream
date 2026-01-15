-- ============================================
-- ARTIST PROFILE APPROVAL SYSTEM
-- Requires admin approval for new artist profiles
-- ============================================

-- Update default status for new bands to 'pending'
-- Existing bands keep their current status (active/suspended/removed)
ALTER TABLE bands ALTER COLUMN status SET DEFAULT 'pending';

-- Add index for pending bands (for admin queue)
CREATE INDEX IF NOT EXISTS idx_bands_status_pending
  ON bands(status) WHERE status = 'pending';

-- Update RLS to hide pending bands from public, but allow owner to see
DROP POLICY IF EXISTS "Bands are viewable by everyone" ON bands;
CREATE POLICY "Bands are viewable by everyone" ON bands
  FOR SELECT USING (
    status = 'active'
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add comment for documentation
COMMENT ON COLUMN bands.status IS 'Band status: pending (awaiting approval), active (approved), suspended, removed';
