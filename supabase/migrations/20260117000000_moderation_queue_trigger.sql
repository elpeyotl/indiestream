-- ============================================
-- MODERATION QUEUE AUTO-POPULATION
-- Automatically adds newly uploaded tracks to moderation queue
-- ============================================

-- Function to auto-add tracks to moderation queue on insert
CREATE OR REPLACE FUNCTION public.add_track_to_moderation_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add if status is 'pending' (new uploads)
  IF NEW.moderation_status = 'pending' THEN
    INSERT INTO public.moderation_queue (
      track_id,
      band_id,
      submitted_by,
      priority,
      status
    )
    VALUES (
      NEW.id,
      NEW.band_id,
      (SELECT owner_id FROM public.bands WHERE id = NEW.band_id),
      'normal',
      'pending'
    )
    ON CONFLICT DO NOTHING; -- In case of race conditions
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on track insert
CREATE TRIGGER on_track_insert_add_to_queue
  AFTER INSERT ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.add_track_to_moderation_queue();

-- Add comment
COMMENT ON FUNCTION public.add_track_to_moderation_queue IS 'Automatically adds newly inserted tracks with pending status to the moderation queue';

-- ============================================
-- REQUEST TRACK REVISION FUNCTION
-- Allows admins to request revisions from artists
-- ============================================

CREATE OR REPLACE FUNCTION public.request_track_revision(
  p_track_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check admin access
  SELECT role = 'admin' INTO v_is_admin
  FROM public.profiles WHERE id = auth.uid();

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can request revisions';
  END IF;

  -- Update track status
  UPDATE public.tracks
  SET moderation_status = 'revision_requested',
      moderation_notes = p_notes,
      moderated_at = NOW(),
      moderated_by = auth.uid()
  WHERE id = p_track_id;

  -- Update queue status
  UPDATE public.moderation_queue
  SET status = 'revision_requested',
      notes = p_notes,
      reviewed_by = auth.uid(),
      reviewed_at = NOW()
  WHERE track_id = p_track_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.request_track_revision IS 'Request revision for a track with feedback for the artist';

-- ============================================
-- BACKFILL EXISTING PENDING TRACKS (One-time)
-- Populates queue with any existing pending tracks
-- ============================================

-- Backfill existing pending tracks that aren't in the queue yet
INSERT INTO public.moderation_queue (track_id, band_id, submitted_by, priority, status)
SELECT
  t.id,
  t.band_id,
  b.owner_id,
  'normal',
  t.moderation_status
FROM public.tracks t
JOIN public.bands b ON t.band_id = b.id
WHERE t.moderation_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.moderation_queue WHERE track_id = t.id
  )
ON CONFLICT DO NOTHING;
