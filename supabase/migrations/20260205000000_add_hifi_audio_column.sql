-- Add hi-fi audio key column for FLAC 16-bit/44.1kHz streaming tier
-- This enables dual-format streaming: AAC 256kbps (standard) + FLAC (hi-fi)

-- Add column for hi-fi FLAC version
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS hifi_audio_key TEXT;

-- Add column for archive path (original files moved after transcoding)
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS archive_audio_key TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN public.tracks.hifi_audio_key IS 'R2 key for hi-fi streaming audio (FLAC 16-bit/44.1kHz) in hifi/ bucket';
COMMENT ON COLUMN public.tracks.archive_audio_key IS 'R2 key for archived original audio after transcoding (archive/ bucket)';

-- Update the original comment for clarity on the full audio pipeline
COMMENT ON COLUMN public.tracks.original_audio_key IS 'R2 key for original lossless audio (WAV/FLAC/AIFF) - moved to archive after transcoding';
COMMENT ON COLUMN public.tracks.streaming_audio_key IS 'R2 key for standard streaming audio (AAC 256kbps) in streaming/ bucket';
