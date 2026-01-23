-- Admin Audit Logs Migration
-- Tracks all administrative actions on the platform

-- =====================================================
-- Create admin_audit_logs table
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  admin_id UUID NOT NULL REFERENCES profiles(id),

  -- Timestamp of the action
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Action details
  action TEXT NOT NULL,           -- e.g., 'track.approve', 'band.suspend', 'album.delete'
  entity_type TEXT NOT NULL,      -- 'band', 'album', 'track', 'user', 'report', 'dmca', 'settings', 'featured_genre'
  entity_id UUID,                 -- The ID of the affected entity (nullable for bulk operations)

  -- Human-readable summary
  entity_name TEXT,               -- Store the name/title at time of action
  summary TEXT NOT NULL,          -- e.g., "Approved track 'My Song' from band 'Rock Stars'"

  -- Before and after state (JSONB for flexibility)
  old_value JSONB,                -- State before the change (null for creates)
  new_value JSONB,                -- State after the change (null for deletes)

  -- Additional context
  metadata JSONB                  -- Additional context like notes, reason, related IDs, etc.
);

-- =====================================================
-- Create indexes for efficient querying
-- =====================================================

-- Index for listing recent actions
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Index for filtering by admin
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);

-- Index for filtering by entity type
CREATE INDEX idx_audit_logs_entity_type ON admin_audit_logs(entity_type);

-- Index for finding all actions on a specific entity
CREATE INDEX idx_audit_logs_entity_lookup ON admin_audit_logs(entity_type, entity_id);

-- Index for filtering by action
CREATE INDEX idx_audit_logs_action ON admin_audit_logs(action);

-- Composite index for common query patterns
CREATE INDEX idx_audit_logs_type_created ON admin_audit_logs(entity_type, created_at DESC);

-- =====================================================
-- RLS Policies (admin read-only, service role insert)
-- =====================================================

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Only service role can insert (from server-side)
-- Audit logs are immutable - no updates or deletes allowed

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE admin_audit_logs IS 'Immutable audit trail of all admin actions on the platform';
COMMENT ON COLUMN admin_audit_logs.action IS 'Action identifier in format entity.action (e.g., track.approve, band.suspend)';
COMMENT ON COLUMN admin_audit_logs.old_value IS 'JSON snapshot of entity state before the action';
COMMENT ON COLUMN admin_audit_logs.new_value IS 'JSON snapshot of entity state after the action';
COMMENT ON COLUMN admin_audit_logs.metadata IS 'Additional context like notes, reason, related IDs';
