// Recent activity store using plain Pinia

// Types
export interface RecentlyPlayedTrack {
  id: string
  title: string
  artistName: string
  artistSlug: string
  albumTitle: string
  albumSlug: string
  coverKey: string | null
  coverUrl: string | null
  audioKey: string | null
  duration: number
  playedAt: string
}

export interface RecentSearch {
  query: string
  timestamp: number
}

// Constants
const RECENT_SEARCHES_KEY = 'fairstream_recent_searches'
const MAX_RECENT_SEARCHES = 5

// Cache TTL: 1 minute (data changes frequently)
const CACHE_TTL = 60 * 1000

export const useRecentActivityStore = defineStore('recentActivity', () => {
  const user = useSupabaseUser()
  // Lazy access to avoid cross-request pollution on SSR
  const getAlbumStore = () => useAlbumStore()

  // Computed user ID
  const userId = computed(() => user.value?.id || null)

  // Cache timestamp
  let recentlyPlayedFetchedAt = 0

  // Check if cache is stale
  const isRecentlyPlayedStale = () => Date.now() - recentlyPlayedFetchedAt > CACHE_TTL

  // ===== RECENTLY PLAYED =====
  // Use useState for SSR-safe shared state
  const recentlyPlayed = useState<RecentlyPlayedTrack[]>('recentlyPlayed', () => [])
  const loadingRecentlyPlayed = useState<boolean>('loadingRecentlyPlayed', () => false)

  // Clear state when user logs out
  watch(
    userId,
    (newUserId) => {
      if (!newUserId) {
        recentlyPlayed.value = []
        recentlyPlayedFetchedAt = 0
      }
    }
  )

  // Fetch recently played
  const fetchRecentlyPlayed = async (limit = 10, forceRefresh = false): Promise<RecentlyPlayedTrack[]> => {
    if (import.meta.server) return []
    if (!user.value) {
      recentlyPlayed.value = []
      return []
    }

    // Check cache (only for default limit)
    if (limit === 10 && !forceRefresh && !isRecentlyPlayedStale() && recentlyPlayed.value.length > 0) {
      return recentlyPlayed.value
    }

    loadingRecentlyPlayed.value = true
    try {
      const data = await $fetch<RecentlyPlayedTrack[]>('/api/listening-history/recent', {
        query: { limit },
      })

      // Load cover URLs (using cache from album store)
      const { getCachedCoverUrl } = getAlbumStore()
      for (const track of data) {
        if (track.coverKey && !track.coverUrl) {
          const url = await getCachedCoverUrl(track.coverKey)
          if (url) track.coverUrl = url
        }
      }

      recentlyPlayed.value = data
      if (limit === 10) {
        recentlyPlayedFetchedAt = Date.now()
      }
      return data
    } catch (e) {
      console.error('Failed to fetch recently played:', e)
      return recentlyPlayed.value
    } finally {
      loadingRecentlyPlayed.value = false
    }
  }

  // ===== RECENT SEARCHES =====
  // Use useState for SSR-safe shared state
  const recentSearches = useState<RecentSearch[]>('recentSearches', () => [])

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    if (!import.meta.client) return

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        recentSearches.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load recent searches:', e)
      recentSearches.value = []
    }
  }

  // Save recent searches to localStorage
  const saveRecentSearches = () => {
    if (!import.meta.client) return

    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches.value))
    } catch (e) {
      console.error('Failed to save recent searches:', e)
    }
  }

  // Add a search query to recent searches
  const addRecentSearch = (query: string) => {
    if (!query.trim()) return

    const trimmedQuery = query.trim()

    // Remove duplicate if exists
    recentSearches.value = recentSearches.value.filter(
      s => s.query.toLowerCase() !== trimmedQuery.toLowerCase()
    )

    // Add to beginning
    recentSearches.value.unshift({
      query: trimmedQuery,
      timestamp: Date.now(),
    })

    // Keep only the most recent
    if (recentSearches.value.length > MAX_RECENT_SEARCHES) {
      recentSearches.value = recentSearches.value.slice(0, MAX_RECENT_SEARCHES)
    }

    saveRecentSearches()
  }

  // Remove a specific search from recent searches
  const removeRecentSearch = (query: string) => {
    recentSearches.value = recentSearches.value.filter(
      s => s.query.toLowerCase() !== query.toLowerCase()
    )
    saveRecentSearches()
  }

  // Clear all recent searches
  const clearRecentSearches = () => {
    recentSearches.value = []
    saveRecentSearches()
  }

  // Get recent searches (sorted by most recent)
  const getRecentSearches = (): RecentSearch[] => {
    return [...recentSearches.value].sort((a, b) => b.timestamp - a.timestamp)
  }

  // Initialize on client side
  if (import.meta.client) {
    loadRecentSearches()
  }

  return {
    // Recently played
    recentlyPlayed,
    loadingRecentlyPlayed,
    fetchRecentlyPlayed,

    // Recent searches
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    getRecentSearches,
  }
})
