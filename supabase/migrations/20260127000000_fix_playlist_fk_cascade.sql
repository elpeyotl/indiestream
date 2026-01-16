-- Fix playlist_tracks foreign key to cascade on user deletion
-- This prevents FK constraint errors when deleting users

-- Drop the existing constraint
ALTER TABLE public.playlist_tracks
DROP CONSTRAINT IF EXISTS playlist_tracks_added_by_fkey;

-- Re-add with ON DELETE CASCADE
ALTER TABLE public.playlist_tracks
ADD CONSTRAINT playlist_tracks_added_by_fkey
FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE CASCADE;
