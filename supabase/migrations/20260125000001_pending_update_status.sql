-- ============================================
-- ADD PENDING_UPDATE STATUS
-- Tracks that were approved but have edits pending re-review
-- These tracks stay visible to listeners while awaiting review
-- ============================================

-- Add new enum value
-- Note: We commit this change first, then the policy update happens in a separate migration
ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'pending_update';

-- Add comment
COMMENT ON TYPE moderation_status IS 'Track moderation status: pending (new), approved, rejected, revision_requested, pending_update (approved with edits awaiting review)';
