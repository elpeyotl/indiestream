// Discover page data composable with caching
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

// Cache configuration
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Module-level cache using plain objects (not reactive - avoids hydration issues)
let featuredArtistsCache: CacheEntry<Band[]> | null = null
let newReleasesCache: CacheEntry<{ albums: Album[]; covers: Record<string, string> }> | null = null
let allArtistsCache: CacheEntry<{ artists: Band[]; hasMore: boolean }> | null = null

const isCacheValid = <T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> => {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL_MS
}

export const useDiscover = () => {
  const client = useSupabaseClient()
  const { getCachedCoverUrl } = useAlbum()
  const { moderationEnabled, loadModerationSetting } = useModerationFilter()

  const pageSize = 12

  // Load featured artists (verified with most streams)
  const getFeaturedArtists = async (forceRefresh = false): Promise<Band[]> => {
    if (!forceRefresh && isCacheValid(featuredArtistsCache)) {
      return featuredArtistsCache.data
    }

    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, is_verified, avatar_key, avatar_url')
      .eq('is_verified', true)
      .order('total_streams', { ascending: false })
      .limit(6)

    if (error) throw error

    // Load avatar URLs from keys (using cache)
    const artists = (data || []) as any[]
    for (const artist of artists) {
      if (artist.avatar_key) {
        const url = await getCachedCoverUrl(artist.avatar_key)
        if (url) artist.avatar_url = url
      }
    }

    const result = artists as Band[]
    featuredArtistsCache = { data: result, timestamp: Date.now() }
    return result
  }

  // Load new releases
  const getNewReleases = async (forceRefresh = false): Promise<{ albums: Album[]; covers: Record<string, string> }> => {
    if (!forceRefresh && isCacheValid(newReleasesCache)) {
      return newReleasesCache.data
    }

    await loadModerationSetting()

    const { data, error } = await client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        release_type,
        release_date,
        cover_key,
        cover_url,
        band:bands!inner (
          id,
          name,
          slug
        ),
        tracks (
          id,
          moderation_status
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Map and filter albums
    let albums = (data || []).map(album => ({
      ...album,
      band: Array.isArray(album.band) ? album.band[0] : album.band
    }))

    // Filter out albums with no approved tracks when moderation is enabled
    if (moderationEnabled.value) {
      albums = albums.filter(album => {
        if (!album.tracks || album.tracks.length === 0) return false
        return album.tracks.some((track: any) => track.moderation_status === 'approved')
      })
    }

    const releasesResult = albums.slice(0, 10) as Album[]
    const covers: Record<string, string> = {}

    // Load cover URLs (using cache)
    for (const album of releasesResult) {
      if (album.cover_key) {
        const url = await getCachedCoverUrl(album.cover_key)
        if (url) covers[album.id] = url
      } else if (album.cover_url) {
        covers[album.id] = album.cover_url
      }
    }

    const result = { albums: releasesResult, covers }
    newReleasesCache = { data: result, timestamp: Date.now() }
    return result
  }

  // Load all artists (first page only for caching)
  const getAllArtists = async (forceRefresh = false): Promise<{ artists: Band[]; hasMore: boolean }> => {
    if (!forceRefresh && isCacheValid(allArtistsCache)) {
      return allArtistsCache.data
    }

    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, avatar_key, avatar_url')
      .order('total_streams', { ascending: false })
      .range(0, pageSize - 1)

    if (error) throw error

    // Load avatar URLs from keys (using cache)
    const artists = (data || []) as any[]
    for (const artist of artists) {
      if (artist.avatar_key) {
        const url = await getCachedCoverUrl(artist.avatar_key)
        if (url) artist.avatar_url = url
      }
    }

    const result = {
      artists: artists as Band[],
      hasMore: artists.length === pageSize
    }
    allArtistsCache = { data: result, timestamp: Date.now() }
    return result
  }

  // Load more artists (not cached - for pagination)
  const loadMoreArtists = async (page: number): Promise<{ artists: Band[]; hasMore: boolean }> => {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, avatar_key, avatar_url')
      .order('total_streams', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error

    // Load avatar URLs from keys (using cache)
    const artists = (data || []) as any[]
    for (const artist of artists) {
      if (artist.avatar_key) {
        const url = await getCachedCoverUrl(artist.avatar_key)
        if (url) artist.avatar_url = url
      }
    }

    return {
      artists: artists as Band[],
      hasMore: artists.length === pageSize
    }
  }

  // Invalidate all discover caches
  const invalidateDiscoverCache = () => {
    featuredArtistsCache = null
    newReleasesCache = null
    allArtistsCache = null
  }

  return {
    getFeaturedArtists,
    getNewReleases,
    getAllArtists,
    loadMoreArtists,
    invalidateDiscoverCache,
    pageSize,
  }
}
