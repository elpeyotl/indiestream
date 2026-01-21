// Listening stats composable for stats/wrapped feature with caching

interface TopArtist {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  streamCount: number
  listeningSeconds: number
  percentageOfTotal: number
  firstListenedAt: string
}

interface TopTrack {
  trackId: string
  trackTitle: string
  artistName: string
  artistSlug: string
  albumTitle: string
  coverKey: string | null
  coverUrl: string | null
  playCount: number
  listeningSeconds: number
  percentageOfTotal: number
}

interface TopAlbum {
  albumId: string
  albumTitle: string
  artistName: string
  artistSlug: string
  coverKey: string | null
  coverUrl: string | null
  streamCount: number
  listeningSeconds: number
  percentageOfTotal: number
}

interface TopGenre {
  genre: string
  streamCount: number
  artistCount: number
  percentageOfTotal: number
}

interface ListeningStats {
  period: string
  periodLabel: string

  // Overview Stats
  totalListeningSeconds: number
  totalStreams: number
  uniqueArtists: number
  uniqueTracks: number
  uniqueAlbums: number

  // Listening Patterns
  averageSessionDuration: number
  totalListeningDays: number
  longestStreak: number
  currentStreak: number

  // Time-based
  mostActiveDay: string
  mostActiveHour: number
  listeningByHour: { hour: number, minutes: number }[]
  listeningByDayOfWeek: { day: string, minutes: number }[]
  listeningByMonth: { month: string, minutes: number }[]

  // Top Content
  topArtists: TopArtist[]
  topTracks: TopTrack[]
  topAlbums: TopAlbum[]
  topGenres: TopGenre[]

  // Discovery
  newArtistsDiscovered: number
  artistDiversity: number
  repeatListenerScore: number

  // Comparisons
  vsLastPeriod?: {
    listeningSecondsChange: number
    streamsChange: number
    newArtistsChange: number
  }

  // Superlatives
  topListeningDay: { date: string, minutes: number }
  favoriteArtist: TopArtist | null
  mostPlayedTrack: TopTrack | null
}

// Module-level cache for period-keyed stats data
const statsCache = new Map<string, { data: ListeningStats; timestamp: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export const useListeningStats = () => {
  const user = useSupabaseUser()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<ListeningStats | null>(null)
  const isRevalidating = ref(false)

  // Fetch stats data from API with image URL resolution
  const fetchFromApi = async (period: 'this-year' | 'last-month' | 'all-time'): Promise<ListeningStats> => {
    const data = await $fetch<ListeningStats>('/api/listener/stats', {
      query: { period },
    })

    // Get presigned URLs for images
    const { getStreamUrl } = useAlbum()

    // Load artist avatars
    for (const artist of data.topArtists) {
      if (artist.avatarKey) {
        try {
          artist.avatarUrl = await getStreamUrl(artist.avatarKey)
        } catch (e) {
          console.error('Failed to load avatar for artist:', artist.bandId, e)
        }
      }
    }

    // Load album/track covers
    for (const track of data.topTracks) {
      if (track.coverKey) {
        try {
          track.coverUrl = await getStreamUrl(track.coverKey)
        } catch (e) {
          console.error('Failed to load cover for track:', track.trackId, e)
        }
      }
    }

    for (const album of data.topAlbums) {
      if (album.coverKey) {
        try {
          album.coverUrl = await getStreamUrl(album.coverKey)
        } catch (e) {
          console.error('Failed to load cover for album:', album.albumId, e)
        }
      }
    }

    return data
  }

  const fetchStats = async (period: 'this-year' | 'last-month' | 'all-time') => {
    const userId = user.value?.id
    if (!userId) {
      loading.value = true
      error.value = null
      try {
        stats.value = await fetchFromApi(period)
      } catch (e: any) {
        console.error('Failed to fetch listening stats:', e)
        error.value = e.message || 'Failed to load stats'
      } finally {
        loading.value = false
      }
      return
    }

    const cacheKey = `listening_stats_${userId}_${period}`
    const cached = statsCache.get(cacheKey)

    // If we have cached data, show it immediately
    if (cached) {
      stats.value = cached.data
      loading.value = false

      // Background revalidation (stale-while-revalidate)
      isRevalidating.value = true
      fetchFromApi(period)
        .then((freshData) => {
          statsCache.set(cacheKey, { data: freshData, timestamp: Date.now() })
          stats.value = freshData
        })
        .catch((e) => console.error('Background revalidation failed:', e))
        .finally(() => {
          isRevalidating.value = false
        })
      return
    }

    // No cache - fetch fresh (blocking)
    loading.value = true
    error.value = null

    try {
      const data = await fetchFromApi(period)
      statsCache.set(cacheKey, { data, timestamp: Date.now() })
      stats.value = data
    } catch (e: any) {
      console.error('Failed to fetch listening stats:', e)
      error.value = e.message || 'Failed to load stats'
    } finally {
      loading.value = false
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
  }

  return {
    loading,
    error,
    stats,
    isRevalidating,
    fetchStats,
    formatTime,
    formatPercentage,
  }
}
