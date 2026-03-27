-- Fix transcoding_queue RLS violation
-- The add_to_transcoding_queue() trigger function runs as the authenticated user,
-- but the RLS policy only allows service_role. Adding SECURITY DEFINER makes the
-- function execute with the privileges of the function owner (postgres), bypassing RLS.

CREATE OR REPLACE FUNCTION add_to_transcoding_queue()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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
