-- Enable realtime for admin-relevant tables
-- This allows the admin notification badge to update in real-time

-- Tracks table for moderation
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracks;

-- Bands table for artist approvals
ALTER PUBLICATION supabase_realtime ADD TABLE public.bands;

-- Albums table (deleting album cascades to tracks)
ALTER PUBLICATION supabase_realtime ADD TABLE public.albums;

-- Content reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_reports;

-- DMCA requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.dmca_requests;
