-- Enable realtime for albums table
-- Needed because deleting an album cascades to tracks
ALTER PUBLICATION supabase_realtime ADD TABLE public.albums;
