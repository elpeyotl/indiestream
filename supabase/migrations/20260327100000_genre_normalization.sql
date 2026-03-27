-- Genre Normalization Migration
-- Replaces free-text genres with a curated master genre list
-- Absorbs featured_genres into the new genres table

-- ============================================================
-- 1. Create genres table (master list)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_position INTEGER,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genres_slug ON public.genres(slug);
CREATE INDEX IF NOT EXISTS idx_genres_active ON public.genres(is_active);
CREATE INDEX IF NOT EXISTS idx_genres_featured ON public.genres(is_featured) WHERE is_featured = TRUE;

ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active genres"
  ON public.genres FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can insert genres"
  ON public.genres FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update genres"
  ON public.genres FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete genres"
  ON public.genres FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.genres IS 'Master list of curated genres for artist profiles';

-- ============================================================
-- 2. Create band_genres junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.band_genres (
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (band_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_band_genres_genre ON public.band_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_band_genres_band ON public.band_genres(band_id);

ALTER TABLE public.band_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view band genres"
  ON public.band_genres FOR SELECT
  USING (true);

CREATE POLICY "Band owners can insert their band genres"
  ON public.band_genres FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bands WHERE id = band_id AND owner_id = auth.uid())
  );

CREATE POLICY "Band owners can delete their band genres"
  ON public.band_genres FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.bands WHERE id = band_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage band genres"
  ON public.band_genres FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger to enforce max 5 genres per band
CREATE OR REPLACE FUNCTION check_band_genre_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.band_genres WHERE band_id = NEW.band_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 genres per artist';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_band_genre_limit
  BEFORE INSERT ON public.band_genres
  FOR EACH ROW
  EXECUTE FUNCTION check_band_genre_limit();

COMMENT ON TABLE public.band_genres IS 'Many-to-many relationship between bands and genres (max 5 per band)';

-- ============================================================
-- 3. Create genre_suggestions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.genre_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_name TEXT NOT NULL,
  suggested_by UUID NOT NULL REFERENCES public.profiles(id),
  band_id UUID REFERENCES public.bands(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  merged_into_genre_id UUID REFERENCES public.genres(id) ON DELETE SET NULL,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'merged'))
);

CREATE INDEX IF NOT EXISTS idx_genre_suggestions_status ON public.genre_suggestions(status);

ALTER TABLE public.genre_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suggestions"
  ON public.genre_suggestions FOR SELECT
  USING (suggested_by = auth.uid());

CREATE POLICY "Users can insert suggestions"
  ON public.genre_suggestions FOR INSERT
  WITH CHECK (suggested_by = auth.uid());

CREATE POLICY "Admins can view all suggestions"
  ON public.genre_suggestions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update suggestions"
  ON public.genre_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.genre_suggestions IS 'Artist-submitted genre requests pending admin review';

-- ============================================================
-- 4. Seed standard genres
-- ============================================================
INSERT INTO public.genres (name, slug, position) VALUES
  -- Rock & related
  ('Rock', 'rock', 1),
  ('Alternative Rock', 'alternative-rock', 2),
  ('Indie Rock', 'indie-rock', 3),
  ('Punk', 'punk', 4),
  ('Post-Punk', 'post-punk', 5),
  ('Hardcore', 'hardcore', 6),
  ('Metal', 'metal', 7),
  ('Grunge', 'grunge', 8),
  ('Garage Rock', 'garage-rock', 9),
  ('Psychedelic Rock', 'psychedelic-rock', 10),
  ('Progressive Rock', 'progressive-rock', 11),
  ('Emo', 'emo', 12),
  ('Noise Rock', 'noise-rock', 13),
  ('Stoner Rock', 'stoner-rock', 14),
  ('Math Rock', 'math-rock', 15),

  -- Pop & related
  ('Pop', 'pop', 16),
  ('Indie Pop', 'indie-pop', 17),
  ('Synth Pop', 'synth-pop', 18),
  ('Dream Pop', 'dream-pop', 19),
  ('Art Pop', 'art-pop', 20),
  ('Chamber Pop', 'chamber-pop', 21),
  ('Power Pop', 'power-pop', 22),

  -- Electronic & related
  ('Electronic', 'electronic', 23),
  ('Ambient', 'ambient', 24),
  ('Techno', 'techno', 25),
  ('House', 'house', 26),
  ('IDM', 'idm', 27),
  ('Drum & Bass', 'drum-and-bass', 28),
  ('Downtempo', 'downtempo', 29),
  ('Synthwave', 'synthwave', 30),
  ('Vaporwave', 'vaporwave', 31),
  ('Glitch', 'glitch', 32),
  ('Electronica', 'electronica', 33),
  ('Chillwave', 'chillwave', 34),
  ('Industrial', 'industrial', 35),
  ('EBM', 'ebm', 36),
  ('Breakbeat', 'breakbeat', 37),

  -- Hip-Hop & related
  ('Hip-Hop', 'hip-hop', 38),
  ('Rap', 'rap', 39),
  ('Boom Bap', 'boom-bap', 40),
  ('Lo-Fi Hip-Hop', 'lo-fi-hip-hop', 41),
  ('Trap', 'trap', 42),
  ('Abstract Hip-Hop', 'abstract-hip-hop', 43),

  -- R&B / Soul / Funk
  ('R&B', 'rnb', 44),
  ('Soul', 'soul', 45),
  ('Funk', 'funk', 46),
  ('Neo-Soul', 'neo-soul', 47),

  -- Jazz & related
  ('Jazz', 'jazz', 48),
  ('Free Jazz', 'free-jazz', 49),
  ('Jazz Fusion', 'jazz-fusion', 50),
  ('Acid Jazz', 'acid-jazz', 51),

  -- Folk / Country / Acoustic
  ('Folk', 'folk', 52),
  ('Indie Folk', 'indie-folk', 53),
  ('Country', 'country', 54),
  ('Americana', 'americana', 55),
  ('Bluegrass', 'bluegrass', 56),
  ('Singer-Songwriter', 'singer-songwriter', 57),
  ('Acoustic', 'acoustic', 58),

  -- Classical & Orchestral
  ('Classical', 'classical', 59),
  ('Contemporary Classical', 'contemporary-classical', 60),
  ('Orchestral', 'orchestral', 61),
  ('Chamber Music', 'chamber-music', 62),
  ('Minimalism', 'minimalism', 63),

  -- World & Global
  ('World', 'world', 64),
  ('Latin', 'latin', 65),
  ('Afrobeat', 'afrobeat', 66),
  ('Reggae', 'reggae', 67),
  ('Dub', 'dub', 68),
  ('Ska', 'ska', 69),
  ('Bossa Nova', 'bossa-nova', 70),

  -- Blues & Roots
  ('Blues', 'blues', 71),
  ('Delta Blues', 'delta-blues', 72),

  -- Experimental & Avant-Garde
  ('Experimental', 'experimental', 73),
  ('Avant-Garde', 'avant-garde', 74),
  ('Noise', 'noise', 75),
  ('Drone', 'drone', 76),
  ('Sound Art', 'sound-art', 77),
  ('Musique Concrète', 'musique-concrete', 78),

  -- Shoegaze & Post-Rock
  ('Shoegaze', 'shoegaze', 79),
  ('Post-Rock', 'post-rock', 80),
  ('Slowcore', 'slowcore', 81),

  -- Dancehall & Bass
  ('Dancehall', 'dancehall', 82),
  ('Dubstep', 'dubstep', 83),
  ('Grime', 'grime', 84),

  -- Soundtrack & Scores
  ('Soundtrack', 'soundtrack', 85),
  ('Film Score', 'film-score', 86),
  ('Video Game Music', 'video-game-music', 87),

  -- Other
  ('Spoken Word', 'spoken-word', 88),
  ('Podcast', 'podcast', 89),
  ('Comedy', 'comedy', 90),
  ('Lo-Fi', 'lo-fi', 91),
  ('New Wave', 'new-wave', 92),
  ('Darkwave', 'darkwave', 93),
  ('Goth', 'goth', 94),
  ('Surf Rock', 'surf-rock', 95),
  ('Disco', 'disco', 96),
  ('Gospel', 'gospel', 97)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. Migrate featured_genres into genres table
-- ============================================================
-- Insert any featured genres not already in the seed list
INSERT INTO public.genres (name, slug, is_featured, featured_position, position)
SELECT
  fg.genre_name,
  fg.genre_slug,
  TRUE,
  fg.position,
  1000 + fg.position  -- high position so they sort after seeded genres in picker
FROM public.featured_genres fg
ON CONFLICT (slug) DO UPDATE SET
  is_featured = TRUE,
  featured_position = EXCLUDED.featured_position;

-- ============================================================
-- 6. Migrate existing band genres into band_genres table
-- ============================================================
-- For each band's genre array, find the matching genre in the genres table
-- and create the junction record
INSERT INTO public.band_genres (band_id, genre_id)
SELECT DISTINCT b.id, g.id
FROM public.bands b,
  LATERAL unnest(b.genres) AS genre_name
JOIN public.genres g ON g.slug = lower(regexp_replace(regexp_replace(trim(genre_name), '\s+', '-', 'g'), '[^a-z0-9-]', '', 'g'))
WHERE b.genres IS NOT NULL
ON CONFLICT DO NOTHING;

-- For genres that don't match any existing genre, insert them as new genres first
-- then create the junction records
WITH unmatched_genres AS (
  SELECT DISTINCT trim(genre_name) AS name,
    lower(regexp_replace(regexp_replace(trim(genre_name), '\s+', '-', 'g'), '[^a-z0-9-]', '', 'g')) AS slug
  FROM public.bands b,
    LATERAL unnest(b.genres) AS genre_name
  WHERE b.genres IS NOT NULL
    AND lower(regexp_replace(regexp_replace(trim(genre_name), '\s+', '-', 'g'), '[^a-z0-9-]', '', 'g')) NOT IN (
      SELECT g.slug FROM public.genres g
    )
    AND trim(genre_name) != ''
)
INSERT INTO public.genres (name, slug, position)
SELECT name, slug, 2000  -- high position, admin can reorder later
FROM unmatched_genres
WHERE slug != ''
ON CONFLICT (slug) DO NOTHING;

-- Now insert the previously unmatched band-genre relationships
INSERT INTO public.band_genres (band_id, genre_id)
SELECT DISTINCT b.id, g.id
FROM public.bands b,
  LATERAL unnest(b.genres) AS genre_name
JOIN public.genres g ON g.slug = lower(regexp_replace(regexp_replace(trim(genre_name), '\s+', '-', 'g'), '[^a-z0-9-]', '', 'g'))
WHERE b.genres IS NOT NULL
ON CONFLICT DO NOTHING;
