-- Content Protection Migration
-- Adds fields for AI declaration, content flagging, and reporting system

-- =====================================================
-- PART 1: Add content verification fields to tracks
-- =====================================================

-- AI declaration field - artist confirms content is NOT AI-generated
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS ai_declaration BOOLEAN DEFAULT FALSE;

-- Content flagging fields
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS content_flags JSONB DEFAULT '{}';
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES profiles(id);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- =====================================================
-- PART 2: Add content verification fields to albums
-- =====================================================

-- Original content confirmation
ALTER TABLE albums ADD COLUMN IF NOT EXISTS original_content_confirmed BOOLEAN DEFAULT FALSE;

-- Sample declaration: 'no_samples', 'licensed_samples', 'public_domain'
ALTER TABLE albums ADD COLUMN IF NOT EXISTS sample_declaration TEXT;

-- =====================================================
-- PART 3: Create content_reports table
-- =====================================================

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id),  -- NULL for anonymous reports
  reporter_email TEXT,  -- For anonymous reporters to receive updates
  reason TEXT NOT NULL CHECK (reason IN ('copyright', 'ai_generated', 'inappropriate', 'other')),
  details TEXT,
  evidence_url TEXT,  -- Link to original work or evidence
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_track_id ON content_reports(track_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);

-- =====================================================
-- PART 4: Create dmca_requests table
-- =====================================================

CREATE TABLE IF NOT EXISTS dmca_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Claimant information (required by DMCA)
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_address TEXT NOT NULL,
  claimant_phone TEXT,

  -- Copyrighted work info
  copyrighted_work_description TEXT NOT NULL,
  copyrighted_work_url TEXT,  -- Link to original

  -- Infringing content
  infringing_url TEXT NOT NULL,  -- URL on Fairstream
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,

  -- DMCA required statements
  good_faith_statement BOOLEAN NOT NULL DEFAULT FALSE,
  accuracy_statement BOOLEAN NOT NULL DEFAULT FALSE,
  perjury_statement BOOLEAN NOT NULL DEFAULT FALSE,

  -- Electronic signature
  signature TEXT NOT NULL,
  signature_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Processing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'content_removed', 'counter_notice', 'resolved', 'rejected')),
  admin_notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,

  -- Counter-notice tracking
  counter_notice_received BOOLEAN DEFAULT FALSE,
  counter_notice_date TIMESTAMPTZ,
  counter_notice_details TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_dmca_requests_status ON dmca_requests(status);
CREATE INDEX IF NOT EXISTS idx_dmca_requests_track_id ON dmca_requests(track_id);
CREATE INDEX IF NOT EXISTS idx_dmca_requests_created_at ON dmca_requests(created_at DESC);

-- =====================================================
-- PART 5: RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmca_requests ENABLE ROW LEVEL SECURITY;

-- Content Reports Policies
-- Anyone can create a report
CREATE POLICY "Anyone can create content reports" ON content_reports
  FOR INSERT WITH CHECK (true);

-- Reporters can view their own reports
CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Admins can view and manage all reports
CREATE POLICY "Admins can view all reports" ON content_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DMCA Requests Policies
-- Anyone can submit a DMCA request
CREATE POLICY "Anyone can submit DMCA requests" ON dmca_requests
  FOR INSERT WITH CHECK (true);

-- Claimants can view their own requests (by email match - not perfect but practical)
CREATE POLICY "Claimants can view own requests" ON dmca_requests
  FOR SELECT USING (
    claimant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can view and manage all DMCA requests
CREATE POLICY "Admins can view all DMCA requests" ON dmca_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update DMCA requests" ON dmca_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- PART 6: Comments
-- =====================================================

COMMENT ON TABLE content_reports IS 'User-submitted reports for copyright violations, AI content, or inappropriate material';
COMMENT ON TABLE dmca_requests IS 'Formal DMCA takedown requests with legally required information';
COMMENT ON COLUMN tracks.ai_declaration IS 'Artist confirmed this content is NOT AI-generated';
COMMENT ON COLUMN tracks.content_flags IS 'JSON object for various content flags and metadata';
COMMENT ON COLUMN albums.sample_declaration IS 'Declaration about samples: no_samples, licensed_samples, public_domain';
