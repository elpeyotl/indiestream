// Pinia store for library management (saved albums, liked tracks, followed artists)
// Uses SWR pattern for reads and optimistic updates for mutations
import { defineStore } from 'pinia'

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

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

export const useLibraryStore = defineStore('library', () => {
  const user = useSupabaseUser()
  const toast = useToast()

  // State
  const likedTracks = ref<LikedTrack[]>([])
  const savedAlbums = ref<SavedAlbum[]>([])
  const followedArtists = ref<FollowedArtist[]>([])

  // Derived state for quick lookups (reactive Sets)
  const likedTrackIds = ref<Set<string>>(new Set())
  const savedAlbumIds = ref<Set<string>>(new Set())
  const followedBandIds = ref<Set<string>>(new Set())

  // Cache timestamps
  let likedTracksFetchedAt = 0
  let savedAlbumsFetchedAt = 0
  let followedArtistsFetchedAt = 0

  // Track in-flight revalidations to prevent duplicate requests
  let likedTracksRevalidating = false
  let savedAlbumsRevalidating = false
  let followedArtistsRevalidating = false

  // Check if cache is stale
  const isLikedTracksStale = () => Date.now() - likedTracksFetchedAt > CACHE_TTL
  const isSavedAlbumsStale = () => Date.now() - savedAlbumsFetchedAt > CACHE_TTL
  const isFollowedArtistsStale = () => Date.now() - followedArtistsFetchedAt > CACHE_TTL

  // ===== SWR FETCH METHODS =====

  // Background revalidation for liked tracks
  const revalidateLikedTracks = async () => {
    if (likedTracksRevalidating) return
    likedTracksRevalidating = true
    try {
      const data = await $fetch<LikedTrack[]>('/api/library/tracks/list')
      likedTracks.value = data
      likedTrackIds.value = new Set(data.map(item => item.track.id))
      likedTracksFetchedAt = Date.now()
    } catch (e) {
      console.error('Failed to revalidate liked tracks:', e)
    } finally {
      likedTracksRevalidating = false
    }
  }

  // SWR: Return cached data immediately, revalidate in background if stale
  const getLikedTracks = async (forceRefresh = false): Promise<LikedTrack[]> => {
    if (import.meta.server) return []
    if (!user.value) return []

    const hasCachedData = likedTracks.value.length > 0 || likedTracksFetchedAt > 0

    // If we have cached data, return it immediately
    if (hasCachedData && !forceRefresh) {
      // Trigger background revalidation if stale
      if (isLikedTracksStale()) {
        revalidateLikedTracks()
      }
      return likedTracks.value
    }

    // No cached data or force refresh - fetch and wait
    await revalidateLikedTracks()
    return likedTracks.value
  }

  // Background revalidation for saved albums
  const revalidateSavedAlbums = async () => {
    if (savedAlbumsRevalidating) return
    savedAlbumsRevalidating = true
    try {
      const data = await $fetch<SavedAlbum[]>('/api/library/albums/list')
      savedAlbums.value = data
      savedAlbumIds.value = new Set(data.map(item => item.album.id))
      savedAlbumsFetchedAt = Date.now()
    } catch (e) {
      console.error('Failed to revalidate saved albums:', e)
    } finally {
      savedAlbumsRevalidating = false
    }
  }

  // SWR: Return cached data immediately, revalidate in background if stale
  const getSavedAlbums = async (forceRefresh = false): Promise<SavedAlbum[]> => {
    if (import.meta.server) return []
    if (!user.value) return []

    const hasCachedData = savedAlbums.value.length > 0 || savedAlbumsFetchedAt > 0

    // If we have cached data, return it immediately
    if (hasCachedData && !forceRefresh) {
      // Trigger background revalidation if stale
      if (isSavedAlbumsStale()) {
        revalidateSavedAlbums()
      }
      return savedAlbums.value
    }

    // No cached data or force refresh - fetch and wait
    await revalidateSavedAlbums()
    return savedAlbums.value
  }

  // Background revalidation for followed artists
  const revalidateFollowedArtists = async () => {
    if (followedArtistsRevalidating) return
    followedArtistsRevalidating = true
    try {
      const data = await $fetch<FollowedArtist[]>('/api/follows/list')
      followedArtists.value = data
      followedBandIds.value = new Set(data.map(item => item.band.id))
      followedArtistsFetchedAt = Date.now()
    } catch (e) {
      console.error('Failed to revalidate followed artists:', e)
    } finally {
      followedArtistsRevalidating = false
    }
  }

  // SWR: Return cached data immediately, revalidate in background if stale
  const getFollowedArtists = async (forceRefresh = false): Promise<FollowedArtist[]> => {
    if (import.meta.server) return []
    if (!user.value) return []

    const hasCachedData = followedArtists.value.length > 0 || followedArtistsFetchedAt > 0

    // If we have cached data, return it immediately
    if (hasCachedData && !forceRefresh) {
      // Trigger background revalidation if stale
      if (isFollowedArtistsStale()) {
        revalidateFollowedArtists()
      }
      return followedArtists.value
    }

    // No cached data or force refresh - fetch and wait
    await revalidateFollowedArtists()
    return followedArtists.value
  }

  // ===== QUICK LOOKUP METHODS =====

  const isTrackLiked = (trackId: string): boolean => {
    return likedTrackIds.value.has(trackId)
  }

  const isAlbumSaved = (albumId: string): boolean => {
    return savedAlbumIds.value.has(albumId)
  }

  const isArtistFollowed = (bandId: string): boolean => {
    return followedBandIds.value.has(bandId)
  }

  // ===== TRACK METHODS WITH OPTIMISTIC UPDATES =====

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

    // Optimistic update
    const wasLiked = likedTrackIds.value.has(trackId)
    likedTrackIds.value.add(trackId)

    // API call in background
    $fetch('/api/library/tracks/like', {
      method: 'POST',
      body: { trackId },
    }).then(() => {
      // Invalidate cache to get fresh data on next read
      likedTracksFetchedAt = 0
    }).catch(() => {
      // Rollback on error
      if (!wasLiked) {
        likedTrackIds.value.delete(trackId)
      }
      toast.add({
        title: 'Error',
        description: 'Failed to like track',
        color: 'red',
      })
    })

    return true
  }

  const unlikeTrack = async (trackId: string): Promise<boolean> => {
    if (!user.value) return false

    // Optimistic update
    const wasLiked = likedTrackIds.value.has(trackId)
    likedTrackIds.value.delete(trackId)

    // Also remove from likedTracks array for immediate UI update
    const previousTracks = [...likedTracks.value]
    likedTracks.value = likedTracks.value.filter(t => t.track.id !== trackId)

    // API call in background
    $fetch('/api/library/tracks/unlike', {
      method: 'POST',
      body: { trackId },
    }).then(() => {
      likedTracksFetchedAt = 0
    }).catch(() => {
      // Rollback on error
      if (wasLiked) {
        likedTrackIds.value.add(trackId)
      }
      likedTracks.value = previousTracks
      toast.add({
        title: 'Error',
        description: 'Failed to unlike track',
        color: 'red',
      })
    })

    return true
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

  // ===== ALBUM METHODS WITH OPTIMISTIC UPDATES =====

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

    // Optimistic update
    const wasSaved = savedAlbumIds.value.has(albumId)
    savedAlbumIds.value.add(albumId)

    // Show success toast immediately (optimistic)
    toast.add({
      title: 'Added to Library',
      description: albumTitle ? `${albumTitle} saved to your library` : 'Album saved to your library',
      color: 'green',
    })

    // API call in background
    $fetch('/api/library/albums/save', {
      method: 'POST',
      body: { albumId },
    }).then(() => {
      savedAlbumsFetchedAt = 0
    }).catch(() => {
      // Rollback on error
      if (!wasSaved) {
        savedAlbumIds.value.delete(albumId)
      }
      toast.add({
        title: 'Error',
        description: 'Failed to save album',
        color: 'red',
      })
    })

    return true
  }

  const unsaveAlbum = async (albumId: string, albumTitle?: string): Promise<boolean> => {
    if (!user.value) return false

    // Optimistic update
    const wasSaved = savedAlbumIds.value.has(albumId)
    savedAlbumIds.value.delete(albumId)

    // Also remove from savedAlbums array for immediate UI update
    const previousAlbums = [...savedAlbums.value]
    savedAlbums.value = savedAlbums.value.filter(a => a.album.id !== albumId)

    // Show success toast immediately (optimistic)
    toast.add({
      title: 'Removed from Library',
      description: albumTitle ? `${albumTitle} removed from your library` : 'Album removed from your library',
      color: 'gray',
    })

    // API call in background
    $fetch('/api/library/albums/unsave', {
      method: 'POST',
      body: { albumId },
    }).then(() => {
      savedAlbumsFetchedAt = 0
    }).catch(() => {
      // Rollback on error
      if (wasSaved) {
        savedAlbumIds.value.add(albumId)
      }
      savedAlbums.value = previousAlbums
      toast.add({
        title: 'Error',
        description: 'Failed to remove album',
        color: 'red',
      })
    })

    return true
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

  // ===== ARTIST METHODS WITH OPTIMISTIC UPDATES =====

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

    // Optimistic update
    const wasFollowed = followedBandIds.value.has(bandId)
    followedBandIds.value.add(bandId)

    // Show success toast immediately (optimistic)
    toast.add({
      title: 'Following',
      description: bandName ? `You're now following ${bandName}` : 'Artist followed',
      color: 'green',
    })

    // API call in background
    $fetch('/api/follows/follow', {
      method: 'POST',
      body: { bandId },
    }).then(() => {
      followedArtistsFetchedAt = 0
    }).catch(() => {
      // Rollback on error
      if (!wasFollowed) {
        followedBandIds.value.delete(bandId)
      }
      toast.add({
        title: 'Error',
        description: 'Failed to follow artist',
        color: 'red',
      })
    })

    return true
  }

  const unfollowArtist = async (bandId: string, bandName?: string): Promise<boolean> => {
    if (!user.value) return false

    // Optimistic update
    const wasFollowed = followedBandIds.value.has(bandId)
    followedBandIds.value.delete(bandId)

    // Also remove from followedArtists array for immediate UI update
    const previousArtists = [...followedArtists.value]
    followedArtists.value = followedArtists.value.filter(a => a.band.id !== bandId)

    // Show success toast immediately (optimistic)
    toast.add({
      title: 'Unfollowed',
      description: bandName ? `You unfollowed ${bandName}` : 'Artist unfollowed',
      color: 'gray',
    })

    // API call in background
    $fetch('/api/follows/unfollow', {
      method: 'POST',
      body: { bandId },
    }).then(() => {
      followedArtistsFetchedAt = 0
    }).catch(() => {
      // Rollback on error
      if (wasFollowed) {
        followedBandIds.value.add(bandId)
      }
      followedArtists.value = previousArtists
      toast.add({
        title: 'Error',
        description: 'Failed to unfollow artist',
        color: 'red',
      })
    })

    return true
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

  // ===== UTILITY METHODS =====

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

  const clearLibraryState = () => {
    likedTracks.value = []
    savedAlbums.value = []
    followedArtists.value = []
    likedTrackIds.value.clear()
    savedAlbumIds.value.clear()
    followedBandIds.value.clear()
    likedTracksFetchedAt = 0
    savedAlbumsFetchedAt = 0
    followedArtistsFetchedAt = 0
  }

  // Clear state when user logs out
  watch(() => user.value?.id, (newUserId) => {
    if (!newUserId) {
      clearLibraryState()
    }
  })

  return {
    // State
    likedTracks,
    savedAlbums,
    followedArtists,

    // Quick lookup Sets
    likedTrackIds,
    savedAlbumIds,
    followedBandIds,

    // Track methods
    isTrackLiked,
    likeTrack,
    unlikeTrack,
    toggleTrackLike,
    fetchLikedTrackIds,
    getLikedTracks,

    // Album methods
    isAlbumSaved,
    saveAlbum,
    unsaveAlbum,
    toggleAlbumSave,
    checkAlbumSaved,
    getSavedAlbums,

    // Artist methods
    isArtistFollowed,
    followArtist,
    unfollowArtist,
    toggleArtistFollow,
    checkArtistFollowed,
    getFollowedArtists,

    // Utility
    getLibraryCounts,
    clearLibraryState,
  }
})
