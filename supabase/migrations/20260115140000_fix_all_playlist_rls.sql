-- Fix ALL playlist RLS policies to avoid infinite recursion
-- Drop and recreate all policies with no circular references

-- Drop ALL existing policies on all three tables
DROP POLICY IF EXISTS "Users can view own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can view collaborated playlists" ON public.playlists;
DROP POLICY IF EXISTS "Anyone can view public playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can create playlists" ON public.playlists;
DROP POLICY IF EXISTS "Owners can update playlists" ON public.playlists;
DROP POLICY IF EXISTS "Owners can delete playlists" ON public.playlists;

DROP POLICY IF EXISTS "Users can view playlist tracks" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Owners and editors can add tracks" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Owners and editors can update tracks" ON public.playlist_tracks;
DROP POLICY IF EXISTS "Owners and editors can delete tracks" ON public.playlist_tracks;

DROP POLICY IF EXISTS "Owners can view collaborators" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Owners can add collaborators" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Owners can update collaborators" ON public.playlist_collaborators;
DROP POLICY IF EXISTS "Owners can remove collaborators" ON public.playlist_collaborators;

-- ============================================
-- PLAYLISTS POLICIES (no collaborator checks)
-- ============================================

-- Users can view their own playlists
CREATE POLICY "playlists_select_owner"
  ON public.playlists FOR SELECT
  USING (auth.uid() = owner_id);

-- Anyone can view public playlists
CREATE POLICY "playlists_select_public"
  ON public.playlists FOR SELECT
  USING (is_public = true);

-- Users can create playlists
CREATE POLICY "playlists_insert"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their playlists
CREATE POLICY "playlists_update"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their playlists
CREATE POLICY "playlists_delete"
  ON public.playlists FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- PLAYLIST_COLLABORATORS POLICIES (simple)
-- ============================================

-- Users can view their own collaborator records
CREATE POLICY "collaborators_select_own"
  ON public.playlist_collaborators FOR SELECT
  USING (user_id = auth.uid());

-- Owners can view all collaborators on their playlists
CREATE POLICY "collaborators_select_owner"
  ON public.playlist_collaborators FOR SELECT
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Only owners can add collaborators
CREATE POLICY "collaborators_insert"
  ON public.playlist_collaborators FOR INSERT
  WITH CHECK (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Only owners can update collaborator roles
CREATE POLICY "collaborators_update"
  ON public.playlist_collaborators FOR UPDATE
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Owners can remove collaborators, users can remove themselves
CREATE POLICY "collaborators_delete"
  ON public.playlist_collaborators FOR DELETE
  USING (
    user_id = auth.uid()
    OR playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- PLAYLIST_TRACKS POLICIES (simple)
-- ============================================

-- Anyone can view tracks of public playlists
CREATE POLICY "tracks_select_public"
  ON public.playlist_tracks FOR SELECT
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE is_public = true
    )
  );

-- Owners can view their playlist tracks
CREATE POLICY "tracks_select_owner"
  ON public.playlist_tracks FOR SELECT
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Collaborators can view playlist tracks
CREATE POLICY "tracks_select_collaborator"
  ON public.playlist_tracks FOR SELECT
  USING (
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators WHERE user_id = auth.uid()
    )
  );

-- Owners can add tracks
CREATE POLICY "tracks_insert_owner"
  ON public.playlist_tracks FOR INSERT
  WITH CHECK (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Editors can add tracks
CREATE POLICY "tracks_insert_editor"
  ON public.playlist_tracks FOR INSERT
  WITH CHECK (
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Owners can update tracks
CREATE POLICY "tracks_update_owner"
  ON public.playlist_tracks FOR UPDATE
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Editors can update tracks
CREATE POLICY "tracks_update_editor"
  ON public.playlist_tracks FOR UPDATE
  USING (
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );

-- Owners can delete tracks
CREATE POLICY "tracks_delete_owner"
  ON public.playlist_tracks FOR DELETE
  USING (
    playlist_id IN (
      SELECT id FROM public.playlists WHERE owner_id = auth.uid()
    )
  );

-- Editors can delete tracks
CREATE POLICY "tracks_delete_editor"
  ON public.playlist_tracks FOR DELETE
  USING (
    playlist_id IN (
      SELECT playlist_id FROM public.playlist_collaborators
      WHERE user_id = auth.uid() AND role = 'editor'
    )
  );
