-- ============================================
-- ADD UNIQUE CONSTRAINT ON MODERATION_QUEUE.TRACK_ID
-- Ensures only one queue entry per track for upsert operations
-- ============================================

-- First remove any duplicates (keep the most recent one)
DELETE FROM public.moderation_queue a
USING public.moderation_queue b
WHERE a.track_id = b.track_id
  AND a.created_at < b.created_at;

-- Add unique constraint
ALTER TABLE public.moderation_queue
  ADD CONSTRAINT moderation_queue_track_id_key UNIQUE (track_id);
