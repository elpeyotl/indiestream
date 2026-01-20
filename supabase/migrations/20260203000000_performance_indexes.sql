-- Performance indexes for common queries
-- These partial indexes are more efficient for frequently filtered data

-- Pending tracks index (faster than scanning all tracks)
CREATE INDEX IF NOT EXISTS idx_tracks_pending
  ON public.tracks(moderation_status, created_at DESC)
  WHERE moderation_status = 'pending';

-- Pending artists index
CREATE INDEX IF NOT EXISTS idx_bands_pending
  ON public.bands(status, created_at DESC)
  WHERE status = 'pending';

-- Pending content reports index
CREATE INDEX IF NOT EXISTS idx_content_reports_pending
  ON public.content_reports(status, created_at DESC)
  WHERE status = 'pending';

-- Pending DMCA requests index
CREATE INDEX IF NOT EXISTS idx_dmca_requests_pending
  ON public.dmca_requests(status, created_at DESC)
  WHERE status = 'pending';

-- Approved tracks (most common query for public views)
CREATE INDEX IF NOT EXISTS idx_tracks_approved
  ON public.tracks(album_id, track_number)
  WHERE moderation_status = 'approved';

-- Active bands with albums (for discovery/search)
CREATE INDEX IF NOT EXISTS idx_bands_active
  ON public.bands(name, created_at DESC)
  WHERE status = 'active';

-- Published albums (most common public query)
CREATE INDEX IF NOT EXISTS idx_albums_published_band
  ON public.albums(band_id, release_date DESC)
  WHERE is_published = true;

-- Composite index for album page queries (band slug + album slug)
CREATE INDEX IF NOT EXISTS idx_albums_slug_band
  ON public.albums(slug, band_id);

-- Stream counts for trending/charts (frequently aggregated)
CREATE INDEX IF NOT EXISTS idx_tracks_stream_count
  ON public.tracks(stream_count DESC)
  WHERE moderation_status = 'approved';

-- Recent stream events for analytics (time-based queries)
CREATE INDEX IF NOT EXISTS idx_stream_events_recent
  ON public.stream_events(created_at DESC, track_id, band_id);

-- Artists page: name search with trigram (for ILIKE queries)
-- Note: Requires pg_trgm extension to be enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_bands_name_trgm
  ON public.bands USING gin(name gin_trgm_ops);

-- Artists page: genre filter (GIN index for array contains)
CREATE INDEX IF NOT EXISTS idx_bands_genres
  ON public.bands USING gin(genres);

-- Artists page: sorting by streams (popular artists)
CREATE INDEX IF NOT EXISTS idx_bands_total_streams
  ON public.bands(total_streams DESC)
  WHERE status = 'active';

-- Artists page: sorting by name
CREATE INDEX IF NOT EXISTS idx_bands_name_sort
  ON public.bands(name ASC)
  WHERE status = 'active';

-- Artists page: sorting by newest
CREATE INDEX IF NOT EXISTS idx_bands_created_at
  ON public.bands(created_at DESC)
  WHERE status = 'active';

-- Library: liked tracks by user (composite for user + order)
CREATE INDEX IF NOT EXISTS idx_liked_tracks_user_created
  ON public.liked_tracks(user_id, created_at DESC);

-- Library: saved albums by user (composite for user + order)
CREATE INDEX IF NOT EXISTS idx_saved_albums_user_created
  ON public.saved_albums(user_id, created_at DESC);

-- Library: listening history for user's recent plays
CREATE INDEX IF NOT EXISTS idx_listening_history_user_recent
  ON public.listening_history(user_id, listened_at DESC);

-- Follows: user's followed artists
CREATE INDEX IF NOT EXISTS idx_follows_user_created
  ON public.follows(user_id, created_at DESC);

-- Playlist tracks: ordering within playlist
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_order
  ON public.playlist_tracks(playlist_id, position ASC);
