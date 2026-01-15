-- ============================================
-- FIX BANDS STATUS CONSTRAINT
-- Add 'pending' to allowed status values
-- ============================================

-- Drop the existing constraint
ALTER TABLE bands DROP CONSTRAINT IF EXISTS bands_status_check;

-- Add the updated constraint with 'pending'
ALTER TABLE bands ADD CONSTRAINT bands_status_check
  CHECK (status IN ('pending', 'active', 'suspended', 'removed'));
