-- Fix playlist RLS policies to avoid infinite recursion
-- The issue is that playlist_collaborators policies check playlists, which check collaborators

-- Drop existing policies on playlist_collaborators
DROP POLICY IF EXISTS "Users can view collaborators" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Owners can add collaborators" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Owners can update collaborators" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Owners can remove collaborators" ON public.playlist_collaborators;

-- Simplified policies that don't cause recursion

-- Users can view collaborators of playlists they own
CREATE POLICY "Owners can view collaborators"
  ON public.playlist_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );

-- Users can view their own collaborator records
CREATE POLICY "Users can view own collaborations"
  ON public.playlist_collaborators FOR SELECT
  USING (user_id = auth.uid());

-- Only owners can add collaborators (check ownership directly, no nested query)
CREATE POLICY "Owners can add collaborators"
  ON public.playlist_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );

-- Only owners can update collaborator roles
CREATE POLICY "Owners can update collaborators"
  ON public.playlist_collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );

-- Owners can remove collaborators, or users can remove themselves
CREATE POLICY "Owners can remove collaborators"
  ON public.playlist_collaborators FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );
