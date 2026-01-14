-- Playlists Migration
-- Adds collaborative playlists with owner/editor/viewer roles

-- Playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  track_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist tracks (ordered)
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

-- Playlist collaborators
CREATE TABLE IF NOT EXISTS public.playlist_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON public.playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlists_share_token ON public.playlists(share_token);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON public.playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_playlist ON public.playlist_collaborators(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_user ON public.playlist_collaborators(user_id);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists

-- Users can view their own playlists
CREATE POLICY "Users can view own playlists"
  ON public.playlists FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can view playlists they collaborate on
CREATE POLICY "Users can view collaborated playlists"
  ON public.playlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlist_collaborators
      WHERE playlist_id = id AND user_id = auth.uid()
    )
  );

-- Anyone can view public playlists
CREATE POLICY "Anyone can view public playlists"
  ON public.playlists FOR SELECT
  USING (is_public = true);

-- Users can create playlists
CREATE POLICY "Users can create playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their playlists
CREATE POLICY "Owners can update playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their playlists
CREATE POLICY "Owners can delete playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for playlist_tracks

-- Users can view tracks of playlists they have access to
CREATE POLICY "Users can view playlist tracks"
  ON public.playlist_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND (
        p.owner_id = auth.uid()
        OR p.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid()
        )
      )
    )
  );

-- Owners and editors can add tracks
CREATE POLICY "Owners and editors can add tracks"
  ON public.playlist_tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
        )
      )
    )
  );

-- Owners and editors can update track positions
CREATE POLICY "Owners and editors can update tracks"
  ON public.playlist_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
        )
      )
    )
  );

-- Owners and editors can remove tracks
CREATE POLICY "Owners and editors can delete tracks"
  ON public.playlist_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND (
        p.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
        )
      )
    )
  );

-- RLS Policies for playlist_collaborators

-- Users can view collaborators of playlists they have access to
CREATE POLICY "Users can view collaborators"
  ON public.playlist_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND (
        p.owner_id = auth.uid()
        OR p.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.playlist_collaborators pc
          WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid()
        )
      )
    )
  );

-- Only owners can add collaborators
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

-- Only owners can remove collaborators
CREATE POLICY "Owners can remove collaborators"
  ON public.playlist_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists p
      WHERE p.id = playlist_id AND p.owner_id = auth.uid()
    )
  );

-- Function to update track_count on playlist
CREATE OR REPLACE FUNCTION update_playlist_track_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists
    SET track_count = track_count + 1, updated_at = NOW()
    WHERE id = NEW.playlist_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists
    SET track_count = track_count - 1, updated_at = NOW()
    WHERE id = OLD.playlist_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER playlist_track_count_trigger
  AFTER INSERT OR DELETE ON public.playlist_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_track_count();

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_playlist_share_token(p_playlist_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_owner_id UUID;
BEGIN
  -- Check ownership
  SELECT owner_id INTO v_owner_id FROM public.playlists WHERE id = p_playlist_id;
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the playlist owner can generate share links';
  END IF;

  -- Generate unique token
  v_token := encode(gen_random_bytes(12), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  -- Update playlist with token
  UPDATE public.playlists
  SET share_token = v_token, is_public = true, updated_at = NOW()
  WHERE id = p_playlist_id;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_playlist_share_token TO authenticated;

-- Function to add track to playlist
CREATE OR REPLACE FUNCTION add_track_to_playlist(p_playlist_id UUID, p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position INTEGER;
  v_can_edit BOOLEAN;
BEGIN
  -- Check if user can edit
  SELECT EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = p_playlist_id AND (
      p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.playlist_collaborators pc
        WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
      )
    )
  ) INTO v_can_edit;

  IF NOT v_can_edit THEN
    RETURN false;
  END IF;

  -- Get next position
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id;

  -- Insert track
  INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_by)
  VALUES (p_playlist_id, p_track_id, v_position, auth.uid())
  ON CONFLICT (playlist_id, track_id) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION add_track_to_playlist TO authenticated;

-- Function to remove track from playlist
CREATE OR REPLACE FUNCTION remove_track_from_playlist(p_playlist_id UUID, p_track_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_edit BOOLEAN;
  v_deleted_position INTEGER;
BEGIN
  -- Check if user can edit
  SELECT EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = p_playlist_id AND (
      p.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.playlist_collaborators pc
        WHERE pc.playlist_id = p.id AND pc.user_id = auth.uid() AND pc.role = 'editor'
      )
    )
  ) INTO v_can_edit;

  IF NOT v_can_edit THEN
    RETURN false;
  END IF;

  -- Get position of track to delete
  SELECT position INTO v_deleted_position
  FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id AND track_id = p_track_id;

  IF v_deleted_position IS NULL THEN
    RETURN false;
  END IF;

  -- Delete track
  DELETE FROM public.playlist_tracks
  WHERE playlist_id = p_playlist_id AND track_id = p_track_id;

  -- Reorder remaining tracks
  UPDATE public.playlist_tracks
  SET position = position - 1
  WHERE playlist_id = p_playlist_id AND position > v_deleted_position;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_track_from_playlist TO authenticated;
