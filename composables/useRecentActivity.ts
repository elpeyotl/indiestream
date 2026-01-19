// Composable for managing recent activity (recently played, recent searches)

export interface RecentlyPlayedTrack {
  id: string
  title: string
  artistName: string
  artistSlug: string
  albumTitle: string
  albumSlug: string
  coverKey: string | null
  coverUrl: string | null
  playedAt: string
}

export interface RecentSearch {
  query: string
  timestamp: number
}

const RECENT_SEARCHES_KEY = 'fairstream_recent_searches'
const MAX_RECENT_SEARCHES = 5

export const useRecentActivity = () => {
  const user = useSupabaseUser()
  const { getStreamUrl } = useAlbum()

  // ===== RECENTLY PLAYED =====

  const recentlyPlayed = ref<RecentlyPlayedTrack[]>([])
  const loadingRecentlyPlayed = ref(false)

  const fetchRecentlyPlayed = async (limit = 10): Promise<RecentlyPlayedTrack[]> => {
    if (!user.value) {
      recentlyPlayed.value = []
      return []
    }

    loadingRecentlyPlayed.value = true
    try {
      const data = await $fetch<RecentlyPlayedTrack[]>('/api/listening-history/recent', {
        query: { limit },
      })

      // Load cover URLs
      for (const track of data) {
        if (track.coverKey && !track.coverUrl) {
          try {
            track.coverUrl = await getStreamUrl(track.coverKey)
          } catch (e) {
            // Skip failed covers
          }
        }
      }

      recentlyPlayed.value = data
      return data
    } catch (e) {
      console.error('Failed to fetch recently played:', e)
      return []
    } finally {
      loadingRecentlyPlayed.value = false
    }
  }

  // ===== RECENT SEARCHES =====

  const recentSearches = ref<RecentSearch[]>([])

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return

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
    recentlyPlayed: readonly(recentlyPlayed),
    loadingRecentlyPlayed: readonly(loadingRecentlyPlayed),
    fetchRecentlyPlayed,

    // Recent searches
    recentSearches: readonly(recentSearches),
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    getRecentSearches,
  }
}
