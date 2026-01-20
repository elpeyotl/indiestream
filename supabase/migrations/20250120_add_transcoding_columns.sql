-- Add transcoding support columns to tracks table
-- Stores both original lossless and transcoded streaming versions

-- Add columns for dual-format storage
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS original_audio_key TEXT,
  ADD COLUMN IF NOT EXISTS original_format VARCHAR(10),
  ADD COLUMN IF NOT EXISTS streaming_audio_key TEXT,
  ADD COLUMN IF NOT EXISTS transcoding_status VARCHAR(20) DEFAULT 'pending';

-- Migrate existing audio_key to original_audio_key for tracks that don't have it set
UPDATE public.tracks
SET original_audio_key = audio_key,
    original_format = LOWER(SPLIT_PART(audio_key, '.', -1))
WHERE original_audio_key IS NULL AND audio_key IS NOT NULL;

-- Add index for finding tracks that need transcoding
CREATE INDEX IF NOT EXISTS idx_tracks_transcoding_status ON public.tracks(transcoding_status)
WHERE transcoding_status IN ('pending', 'processing');

-- Add comment explaining the columns
COMMENT ON COLUMN public.tracks.original_audio_key IS 'R2 key for original lossless audio (WAV/FLAC/AIFF) - preserved for hi-res streaming tier';
COMMENT ON COLUMN public.tracks.original_format IS 'Original audio format: wav, flac, aif, aiff';
COMMENT ON COLUMN public.tracks.streaming_audio_key IS 'R2 key for transcoded streaming audio (AAC 256kbps)';
COMMENT ON COLUMN public.tracks.transcoding_status IS 'Status: pending, processing, complete, failed';

-- Create transcoding_queue table for tracking jobs
CREATE TABLE IF NOT EXISTS public.transcoding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT unique_track_in_queue UNIQUE (track_id)
);

-- Index for finding pending jobs
CREATE INDEX IF NOT EXISTS idx_transcoding_queue_status ON public.transcoding_queue(status, created_at)
WHERE status IN ('pending', 'processing');

-- Enable RLS
ALTER TABLE public.transcoding_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access transcoding queue
CREATE POLICY "Service role only" ON public.transcoding_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Function to add track to transcoding queue
CREATE OR REPLACE FUNCTION add_to_transcoding_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add if there's an original audio key and no streaming key yet
  IF NEW.original_audio_key IS NOT NULL AND NEW.streaming_audio_key IS NULL THEN
    INSERT INTO public.transcoding_queue (track_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT (track_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add new tracks to queue
DROP TRIGGER IF EXISTS track_transcoding_trigger ON public.tracks;
CREATE TRIGGER track_transcoding_trigger
  AFTER INSERT OR UPDATE OF original_audio_key ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION add_to_transcoding_queue();
