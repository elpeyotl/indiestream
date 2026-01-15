-- ============================================
-- UPDATE RLS POLICY FOR PENDING_UPDATE STATUS
-- Allow tracks with pending_update status to remain visible
-- ============================================

-- Update RLS policy to include pending_update tracks (they stay visible)
DROP POLICY IF EXISTS "Approved tracks in published albums are viewable" ON public.tracks;
CREATE POLICY "Approved tracks in published albums are viewable" ON public.tracks
    FOR SELECT USING (
        moderation_status IN ('approved', 'pending_update') AND EXISTS (
            SELECT 1 FROM public.albums WHERE id = tracks.album_id AND is_published = true
        )
    );
