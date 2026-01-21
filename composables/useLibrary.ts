// Library composable for managing saved albums, liked tracks, and followed artists

export interface SavedAlbum {
  created_at: string
  album: {
    id: string
    title: string
    slug: string
    cover_url: string | null
    cover_key: string | null
    release_type: string
    release_date: string | null
    band: {
      id: string
      name: string
      slug: string
    }
  }
}

export interface LikedTrack {
  created_at: string
  track: {
    id: string
    title: string
    duration_seconds: number
    track_number: number
    audio_key: string | null
    album: {
      id: string
      title: string
      slug: string
      cover_url: string | null
      cover_key: string | null
      band: {
        id: string
        name: string
        slug: string
      }
    }
  }
}

export interface FollowedArtist {
  created_at: string
  band: {
    id: string
    name: string
    slug: string
    avatar_url: string | null
    avatar_key: string | null
    location: string | null
    genres: string[]
    total_streams: number
    follower_count: number
  }
}

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Module-level cache for library data (persists across navigation)
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const followedArtistsCache = new Map<string, CacheEntry<FollowedArtist[]>>()
const savedAlbumsCache = new Map<string, CacheEntry<SavedAlbum[]>>()
const likedTracksCache = new Map<string, CacheEntry<LikedTrack[]>>()

const isCacheValid = <T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> => {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL_MS
}

// Global state for liked track IDs (for efficient UI updates)
const likedTrackIds = ref<Set<string>>(new Set())
const savedAlbumIds = ref<Set<string>>(new Set())
const followedBandIds = ref<Set<string>>(new Set())

export const useLibrary = () => {
  const user = useSupabaseUser()
  const toast = useToast()

  // ===== TRACKS =====

  const isTrackLiked = (trackId: string): boolean => {
    return likedTrackIds.value.has(trackId)
  }

  const likeTrack = async (trackId: string): Promise<boolean> => {
    if (!user.value) {
      toast.add({
        title: 'Sign in required',
        description: 'Create an account to like tracks',
        color: 'yellow',
      })
      navigateTo('/login')
      return false
    }

    try {
      await $fetch('/api/library/tracks/like', {
        method: 'POST',
        body: { trackId },
      })
      likedTrackIds.value.add(trackId)
      // Invalidate cache
      if (user.value) likedTracksCache.delete(user.value.id)
      return true
    } catch (e) {
      console.error('Failed to like track:', e)
      toast.add({
        title: 'Error',
        description: 'Failed to like track',
        color: 'red',
      })
      return false
    }
  }

  const unlikeTrack = async (trackId: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      await $fetch('/api/library/tracks/unlike', {
        method: 'POST',
        body: { trackId },
      })
      likedTrackIds.value.delete(trackId)
      // Invalidate cache
      likedTracksCache.delete(user.value.id)
      return true
    } catch (e) {
      console.error('Failed to unlike track:', e)
      toast.add({
        title: 'Error',
        description: 'Failed to unlike track',
        color: 'red',
      })
      return false
    }
  }

  const toggleTrackLike = async (trackId: string): Promise<boolean> => {
    if (isTrackLiked(trackId)) {
      return unlikeTrack(trackId)
    } else {
      return likeTrack(trackId)
    }
  }

  const fetchLikedTrackIds = async (trackIds: string[]): Promise<void> => {
    if (!user.value || trackIds.length === 0) return

    try {
      const { likedIds } = await $fetch<{ likedIds: string[] }>('/api/library/tracks/status', {
        query: { trackIds: trackIds.join(',') },
      })
      likedIds.forEach(id => likedTrackIds.value.add(id))
    } catch (e) {
      console.error('Failed to fetch liked track IDs:', e)
    }
  }

  const getLikedTracks = async (forceRefresh = false): Promise<LikedTrack[]> => {
    if (!user.value) return []
    const userId = user.value.id
    const cached = likedTracksCache.get(userId)

    // SWR: Return cached data immediately, revalidate in background if stale
    if (!forceRefresh && cached) {
      const isValid = Date.now() - cached.timestamp < CACHE_TTL_MS
      if (!isValid) {
        // Cache expired - revalidate in background
        fetchLikedTracksFromApi(userId).catch(console.error)
      }
      return cached.data
    }

    return fetchLikedTracksFromApi(userId)
  }

  const fetchLikedTracksFromApi = async (userId: string): Promise<LikedTrack[]> => {
    try {
      const data = await $fetch<LikedTrack[]>('/api/library/tracks/list')
      data.forEach(item => likedTrackIds.value.add(item.track.id))
      likedTracksCache.set(userId, { data, timestamp: Date.now() })
      return data
    } catch (e) {
      console.error('Failed to fetch liked tracks:', e)
      return []
    }
  }

  // ===== ALBUMS =====

  const isAlbumSaved = (albumId: string): boolean => {
    return savedAlbumIds.value.has(albumId)
  }

  const saveAlbum = async (albumId: string, albumTitle?: string): Promise<boolean> => {
    if (!user.value) {
      toast.add({
        title: 'Sign in required',
        description: 'Create an account to save albums',
        color: 'yellow',
      })
      navigateTo('/login')
      return false
    }

    try {
      await $fetch('/api/library/albums/save', {
        method: 'POST',
        body: { albumId },
      })
      savedAlbumIds.value.add(albumId)
      // Invalidate cache
      if (user.value) savedAlbumsCache.delete(user.value.id)
      toast.add({
        title: 'Added to Library',
        description: albumTitle ? `${albumTitle} saved to your library` : 'Album saved to your library',
        color: 'green',
      })
      return true
    } catch (e) {
      console.error('Failed to save album:', e)
      toast.add({
        title: 'Error',
        description: 'Failed to save album',
        color: 'red',
      })
      return false
    }
  }

  const unsaveAlbum = async (albumId: string, albumTitle?: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      await $fetch('/api/library/albums/unsave', {
        method: 'POST',
        body: { albumId },
      })
      savedAlbumIds.value.delete(albumId)
      // Invalidate cache
      savedAlbumsCache.delete(user.value.id)
      toast.add({
        title: 'Removed from Library',
        description: albumTitle ? `${albumTitle} removed from your library` : 'Album removed from your library',
        color: 'gray',
      })
      return true
    } catch (e) {
      console.error('Failed to unsave album:', e)
      toast.add({
        title: 'Error',
        description: 'Failed to remove album',
        color: 'red',
      })
      return false
    }
  }

  const toggleAlbumSave = async (albumId: string, albumTitle?: string): Promise<boolean> => {
    if (isAlbumSaved(albumId)) {
      return unsaveAlbum(albumId, albumTitle)
    } else {
      return saveAlbum(albumId, albumTitle)
    }
  }

  const checkAlbumSaved = async (albumId: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      const { isSaved } = await $fetch<{ isSaved: boolean }>('/api/library/albums/status', {
        query: { albumId },
      })
      if (isSaved) {
        savedAlbumIds.value.add(albumId)
      }
      return isSaved
    } catch (e) {
      console.error('Failed to check album status:', e)
      return false
    }
  }

  const getSavedAlbums = async (forceRefresh = false): Promise<SavedAlbum[]> => {
    if (!user.value) return []
    const userId = user.value.id
    const cached = savedAlbumsCache.get(userId)

    // SWR: Return cached data immediately, revalidate in background if stale
    if (!forceRefresh && cached) {
      const isValid = Date.now() - cached.timestamp < CACHE_TTL_MS
      if (!isValid) {
        // Cache expired - revalidate in background
        fetchSavedAlbumsFromApi(userId).catch(console.error)
      }
      return cached.data
    }

    return fetchSavedAlbumsFromApi(userId)
  }

  const fetchSavedAlbumsFromApi = async (userId: string): Promise<SavedAlbum[]> => {
    try {
      const data = await $fetch<SavedAlbum[]>('/api/library/albums/list')
      data.forEach(item => savedAlbumIds.value.add(item.album.id))
      savedAlbumsCache.set(userId, { data, timestamp: Date.now() })
      return data
    } catch (e) {
      console.error('Failed to fetch saved albums:', e)
      return []
    }
  }

  // ===== ARTISTS =====

  const isArtistFollowed = (bandId: string): boolean => {
    return followedBandIds.value.has(bandId)
  }

  const followArtist = async (bandId: string, bandName?: string): Promise<boolean> => {
    if (!user.value) {
      toast.add({
        title: 'Sign in required',
        description: 'Create an account to follow artists',
        color: 'yellow',
      })
      navigateTo('/login')
      return false
    }

    try {
      await $fetch('/api/follows/follow', {
        method: 'POST',
        body: { bandId },
      })
      followedBandIds.value.add(bandId)
      // Invalidate cache
      if (user.value) followedArtistsCache.delete(user.value.id)
      toast.add({
        title: 'Following',
        description: bandName ? `You're now following ${bandName}` : 'Artist followed',
        color: 'green',
      })
      return true
    } catch (e) {
      console.error('Failed to follow artist:', e)
      toast.add({
        title: 'Error',
        description: 'Failed to follow artist',
        color: 'red',
      })
      return false
    }
  }

  const unfollowArtist = async (bandId: string, bandName?: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      await $fetch('/api/follows/unfollow', {
        method: 'POST',
        body: { bandId },
      })
      followedBandIds.value.delete(bandId)
      // Invalidate cache
      followedArtistsCache.delete(user.value.id)
      toast.add({
        title: 'Unfollowed',
        description: bandName ? `You unfollowed ${bandName}` : 'Artist unfollowed',
        color: 'gray',
      })
      return true
    } catch (e) {
      console.error('Failed to unfollow artist:', e)
      toast.add({
        title: 'Error',
        description: 'Failed to unfollow artist',
        color: 'red',
      })
      return false
    }
  }

  const toggleArtistFollow = async (bandId: string, bandName?: string): Promise<boolean> => {
    if (isArtistFollowed(bandId)) {
      return unfollowArtist(bandId, bandName)
    } else {
      return followArtist(bandId, bandName)
    }
  }

  const checkArtistFollowed = async (bandId: string): Promise<boolean> => {
    if (!user.value) return false

    try {
      const { isFollowing } = await $fetch<{ isFollowing: boolean }>('/api/follows/status', {
        query: { bandId },
      })
      if (isFollowing) {
        followedBandIds.value.add(bandId)
      }
      return isFollowing
    } catch (e) {
      console.error('Failed to check follow status:', e)
      return false
    }
  }

  const getFollowedArtists = async (forceRefresh = false): Promise<FollowedArtist[]> => {
    if (!user.value) return []
    const userId = user.value.id
    const cached = followedArtistsCache.get(userId)

    // SWR: Return cached data immediately, revalidate in background if stale
    if (!forceRefresh && cached) {
      const isValid = Date.now() - cached.timestamp < CACHE_TTL_MS
      if (!isValid) {
        // Cache expired - revalidate in background
        fetchFollowedArtistsFromApi(userId).catch(console.error)
      }
      return cached.data
    }

    return fetchFollowedArtistsFromApi(userId)
  }

  const fetchFollowedArtistsFromApi = async (userId: string): Promise<FollowedArtist[]> => {
    try {
      const data = await $fetch<FollowedArtist[]>('/api/follows/list')
      followedArtistsCache.set(userId, { data, timestamp: Date.now() })
      return data
    } catch (e) {
      console.error('Failed to fetch followed artists:', e)
      return []
    }
  }

  // ===== LIBRARY COUNTS =====

  const getLibraryCounts = async (): Promise<{ artists: number; albums: number; tracks: number }> => {
    if (!user.value) return { artists: 0, albums: 0, tracks: 0 }

    try {
      const [artists, albums, tracks] = await Promise.all([
        getFollowedArtists(),
        getSavedAlbums(),
        getLikedTracks(),
      ])
      return {
        artists: artists.length,
        albums: albums.length,
        tracks: tracks.length,
      }
    } catch (e) {
      console.error('Failed to fetch library counts:', e)
      return { artists: 0, albums: 0, tracks: 0 }
    }
  }

  // Clear library state on logout
  const clearLibraryState = () => {
    likedTrackIds.value.clear()
    savedAlbumIds.value.clear()
    followedBandIds.value.clear()
    // Clear all caches
    followedArtistsCache.clear()
    savedAlbumsCache.clear()
    likedTracksCache.clear()
  }

  return {
    // Track methods
    isTrackLiked,
    likeTrack,
    unlikeTrack,
    toggleTrackLike,
    fetchLikedTrackIds,
    getLikedTracks,
    likedTrackIds,

    // Album methods
    isAlbumSaved,
    saveAlbum,
    unsaveAlbum,
    toggleAlbumSave,
    checkAlbumSaved,
    getSavedAlbums,
    savedAlbumIds,

    // Artist methods
    isArtistFollowed,
    followArtist,
    unfollowArtist,
    toggleArtistFollow,
    checkArtistFollowed,
    getFollowedArtists,
    followedBandIds,

    // Utility
    getLibraryCounts,
    clearLibraryState,
  }
}
