// Discover page data composable with caching + localStorage persistence
import type { Database } from '~/types/database'
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const CACHE_VERSION = 1

interface CacheEntry<T> {
  data: T
  timestamp: number
  version?: number
}

// Module-level cache using plain objects (not reactive - avoids hydration issues)
let featuredArtistsCache: CacheEntry<Band[]> | null = null
let newReleasesCache: CacheEntry<{ albums: Album[]; covers: Record<string, string> }> | null = null
let allArtistsCache: CacheEntry<{ artists: Band[]; hasMore: boolean }> | null = null

// localStorage helpers
const readFromStorage = <T>(key: string): CacheEntry<T> | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(`fairstream_cache_${key}`)
    if (stored) {
      const entry = JSON.parse(stored)
      if (entry.version === CACHE_VERSION) return entry
    }
  } catch (e) {
    console.error(`Failed to read cache ${key}:`, e)
  }
  return null
}

const writeToStorage = <T>(key: string, entry: CacheEntry<T>) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`fairstream_cache_${key}`, JSON.stringify({ ...entry, version: CACHE_VERSION }))
  } catch (e) {
    console.error(`Failed to write cache ${key}:`, e)
  }
}

const isCacheValid = <T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> => {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL_MS
}

export const useDiscover = () => {
  const client = useSupabaseClient<Database>()
  const { getCachedCoverUrl } = useAlbum()
  const { moderationEnabled, loadModerationSetting } = useModerationFilter()

  const pageSize = 12

  // Load featured artists (verified with most streams)
  const getFeaturedArtists = async (forceRefresh = false): Promise<Band[]> => {
    const cacheKey = 'discover_featured_artists'

    // Check memory cache first
    if (featuredArtistsCache) {
      // Always return cached data immediately, revalidate in background
      if (!forceRefresh) {
        fetchFeaturedArtistsFromApi().then(result => {
          featuredArtistsCache = { data: result, timestamp: Date.now() }
          writeToStorage(cacheKey, featuredArtistsCache)
        })
        return featuredArtistsCache.data
      }
    }

    // Check localStorage
    const storedCache = readFromStorage<Band[]>(cacheKey)
    if (storedCache && !forceRefresh) {
      featuredArtistsCache = storedCache
      // Revalidate in background
      fetchFeaturedArtistsFromApi().then(result => {
        featuredArtistsCache = { data: result, timestamp: Date.now() }
        writeToStorage(cacheKey, featuredArtistsCache)
      })
      return storedCache.data
    }

    // No cache - fetch fresh
    const result = await fetchFeaturedArtistsFromApi()
    featuredArtistsCache = { data: result, timestamp: Date.now() }
    writeToStorage(cacheKey, featuredArtistsCache)
    return result
  }

  const fetchFeaturedArtistsFromApi = async (): Promise<Band[]> => {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, is_verified, avatar_key, avatar_url')
      .eq('status', 'active')
      .eq('is_verified', true)
      .order('total_streams', { ascending: false })
      .limit(6)

    if (error) throw error

    const artists = (data || []) as any[]
    await Promise.all(
      artists.map(async (artist) => {
        if (artist.avatar_key) {
          const url = await getCachedCoverUrl(artist.avatar_key)
          if (url) artist.avatar_url = url
        }
      })
    )

    return artists as Band[]
  }

  // Load new releases
  const getNewReleases = async (forceRefresh = false): Promise<{ albums: Album[]; covers: Record<string, string> }> => {
    const cacheKey = 'discover_new_releases'

    // Check memory cache first
    if (newReleasesCache) {
      if (!forceRefresh) {
        fetchNewReleasesFromApi().then(result => {
          newReleasesCache = { data: result, timestamp: Date.now() }
          writeToStorage(cacheKey, newReleasesCache)
        })
        return newReleasesCache.data
      }
    }

    // Check localStorage
    const storedCache = readFromStorage<{ albums: Album[]; covers: Record<string, string> }>(cacheKey)
    if (storedCache && !forceRefresh) {
      newReleasesCache = storedCache
      fetchNewReleasesFromApi().then(result => {
        newReleasesCache = { data: result, timestamp: Date.now() }
        writeToStorage(cacheKey, newReleasesCache)
      })
      return storedCache.data
    }

    // No cache - fetch fresh
    const result = await fetchNewReleasesFromApi()
    newReleasesCache = { data: result, timestamp: Date.now() }
    writeToStorage(cacheKey, newReleasesCache)
    return result
  }

  const fetchNewReleasesFromApi = async (): Promise<{ albums: Album[]; covers: Record<string, string> }> => {
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

    let albums = (data || []).map(album => ({
      ...album,
      band: Array.isArray(album.band) ? album.band[0] : album.band
    }))

    if (moderationEnabled.value) {
      albums = albums.filter(album => {
        if (!album.tracks || album.tracks.length === 0) return false
        return album.tracks.some((track: any) => track.moderation_status === 'approved')
      })
    }

    const releasesResult = albums.slice(0, 10) as Album[]
    const covers: Record<string, string> = {}

    await Promise.all(
      releasesResult.map(async (album) => {
        if (album.cover_key) {
          const url = await getCachedCoverUrl(album.cover_key)
          if (url) covers[album.id] = url
        } else if (album.cover_url) {
          covers[album.id] = album.cover_url
        }
      })
    )

    return { albums: releasesResult, covers }
  }

  // Load all artists (first page only for caching)
  const getAllArtists = async (forceRefresh = false): Promise<{ artists: Band[]; hasMore: boolean }> => {
    const cacheKey = 'discover_all_artists'

    // Check memory cache first
    if (allArtistsCache) {
      if (!forceRefresh) {
        fetchAllArtistsFromApi().then(result => {
          allArtistsCache = { data: result, timestamp: Date.now() }
          writeToStorage(cacheKey, allArtistsCache)
        })
        return allArtistsCache.data
      }
    }

    // Check localStorage
    const storedCache = readFromStorage<{ artists: Band[]; hasMore: boolean }>(cacheKey)
    if (storedCache && !forceRefresh) {
      allArtistsCache = storedCache
      fetchAllArtistsFromApi().then(result => {
        allArtistsCache = { data: result, timestamp: Date.now() }
        writeToStorage(cacheKey, allArtistsCache)
      })
      return storedCache.data
    }

    // No cache - fetch fresh
    const result = await fetchAllArtistsFromApi()
    allArtistsCache = { data: result, timestamp: Date.now() }
    writeToStorage(cacheKey, allArtistsCache)
    return result
  }

  const fetchAllArtistsFromApi = async (): Promise<{ artists: Band[]; hasMore: boolean }> => {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, avatar_key, avatar_url')
      .eq('status', 'active')
      .order('total_streams', { ascending: false })
      .range(0, pageSize - 1)

    if (error) throw error

    const artists = (data || []) as any[]
    await Promise.all(
      artists.map(async (artist) => {
        if (artist.avatar_key) {
          const url = await getCachedCoverUrl(artist.avatar_key)
          if (url) artist.avatar_url = url
        }
      })
    )

    return {
      artists: artists as Band[],
      hasMore: artists.length === pageSize
    }
  }

  // Load more artists (not cached - for pagination)
  const loadMoreArtists = async (page: number): Promise<{ artists: Band[]; hasMore: boolean }> => {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, avatar_key, avatar_url')
      .eq('status', 'active') // Only show approved artists
      .order('total_streams', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error

    // Load avatar URLs from keys (using cache) - parallel fetch
    const artists = (data || []) as any[]
    await Promise.all(
      artists.map(async (artist) => {
        if (artist.avatar_key) {
          const url = await getCachedCoverUrl(artist.avatar_key)
          if (url) artist.avatar_url = url
        }
      })
    )

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
