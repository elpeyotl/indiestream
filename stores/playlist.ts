// Playlist store using plain Pinia
// Uses SWR pattern for reads and optimistic updates for mutations

// Types
export interface Playlist {
  id: string
  title: string
  description: string | null
  is_public: boolean
  share_token: string | null
  track_count: number
  owner_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface PlaylistTrack {
  id: string
  position: number
  added_by: string
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

export interface PlaylistWithTracks extends Playlist {
  playlist_tracks: PlaylistTrack[]
  canEdit: boolean
}

export interface Collaborator {
  id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  display_name: string
  avatar_url: string | null
  is_owner: boolean
  created_at?: string
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Cache for individual playlists with tracks
interface CacheEntry<T> {
  data: T
  timestamp: number
}
const playlistCache = new Map<string, CacheEntry<PlaylistWithTracks>>()
const revalidatingPlaylist = new Set<string>()

export const usePlaylistStore = defineStore('playlist', () => {
  const user = useSupabaseUser()
  const toast = useToast()

  // Computed user ID
  const userId = computed(() => user.value?.id || null)

  // Use useState for SSR-safe shared state
  const playlists = useState<Playlist[]>('playlists', () => [])
  const loading = useState<boolean>('playlistsLoading', () => false)

  // Reactive state for SWR (current playlist being viewed)
  const currentPlaylist = ref<PlaylistWithTracks | null>(null)
  const currentPlaylistId = ref<string | null>(null)

  // Cache timestamp
  let playlistsFetchedAt = 0
  let playlistsRevalidating = false

  // Check if cache is stale
  const isPlaylistsStale = () => Date.now() - playlistsFetchedAt > CACHE_TTL
  const isPlaylistCacheStale = (entry: CacheEntry<PlaylistWithTracks> | undefined): boolean => {
    if (!entry) return true
    return Date.now() - entry.timestamp > CACHE_TTL
  }

  // ===== SWR REVALIDATION FUNCTIONS =====

  // Background revalidation for playlists list
  const revalidatePlaylists = async () => {
    if (playlistsRevalidating) return
    playlistsRevalidating = true
    try {
      const data = await $fetch<Playlist[]>('/api/playlists')
      playlists.value = data
      playlistsFetchedAt = Date.now()
    } catch (e) {
      console.error('Failed to revalidate playlists:', e)
    } finally {
      playlistsRevalidating = false
    }
  }

  // Background revalidation for single playlist
  const revalidatePlaylist = async (id: string) => {
    if (revalidatingPlaylist.has(id)) return
    revalidatingPlaylist.add(id)
    try {
      const data = await $fetch<PlaylistWithTracks>(`/api/playlists/${id}`)
      playlistCache.set(id, { data, timestamp: Date.now() })
      // Update reactive state if this is the current playlist
      if (currentPlaylistId.value === id) {
        currentPlaylist.value = data
      }
    } catch (e) {
      console.error('Failed to revalidate playlist:', e)
    } finally {
      revalidatingPlaylist.delete(id)
    }
  }

  // ===== SWR FETCH METHODS =====

  // SWR: Fetch playlists - returns cached data immediately, revalidates in background if stale
  const fetchPlaylists = async (forceRefresh = false): Promise<Playlist[]> => {
    if (import.meta.server) return []
    if (!user.value) {
      playlists.value = []
      return []
    }

    const hasCachedData = playlists.value.length > 0 || playlistsFetchedAt > 0

    // If we have cached data, return it immediately
    if (hasCachedData && !forceRefresh) {
      // Trigger background revalidation if stale
      if (isPlaylistsStale()) {
        revalidatePlaylists()
      }
      return playlists.value
    }

    // No cached data or force refresh - fetch and wait
    loading.value = true
    try {
      const data = await $fetch<Playlist[]>('/api/playlists')
      playlists.value = data
      playlistsFetchedAt = Date.now()
      return data
    } catch (e) {
      console.error('Failed to fetch playlists:', e)
      return playlists.value
    } finally {
      loading.value = false
    }
  }

  // SWR: Get single playlist with tracks
  const getPlaylist = async (id: string, forceRefresh = false): Promise<PlaylistWithTracks | null> => {
    const cached = playlistCache.get(id)

    // Update current key for reactive updates
    currentPlaylistId.value = id

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Update reactive state
      currentPlaylist.value = cached.data

      // Trigger background revalidation if stale
      if (isPlaylistCacheStale(cached)) {
        revalidatePlaylist(id)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    try {
      const data = await $fetch<PlaylistWithTracks>(`/api/playlists/${id}`)
      playlistCache.set(id, { data, timestamp: Date.now() })
      currentPlaylist.value = data
      return data
    } catch (e) {
      console.error('Failed to fetch playlist:', e)
      return null
    }
  }

  // Get shared playlist by token (no SWR needed - public access)
  const getSharedPlaylist = async (token: string): Promise<PlaylistWithTracks | null> => {
    try {
      return await $fetch<PlaylistWithTracks>(`/api/playlists/shared/${token}`)
    } catch (e) {
      console.error('Failed to fetch shared playlist:', e)
      return null
    }
  }

  // ===== MUTATION METHODS =====

  // Create playlist
  const createPlaylist = async (title: string, description?: string): Promise<Playlist | null> => {
    if (!user.value) {
      toast.add({
        title: 'Sign in required',
        description: 'Please sign in to create playlists',
        color: 'red',
      })
      return null
    }

    try {
      const playlist = await $fetch<Playlist>('/api/playlists', {
        method: 'POST',
        body: { title, description },
      })

      // Add to local state with owner role
      playlists.value.unshift({ ...playlist, role: 'owner' })
      playlistsFetchedAt = 0 // Invalidate cache

      toast.add({
        title: 'Playlist created',
        description: `"${playlist.title}" is ready`,
        color: 'green',
      })

      return playlist
    } catch (error: any) {
      toast.add({
        title: 'Failed to create playlist',
        description: error.data?.message || 'Please try again',
        color: 'red',
      })
      return null
    }
  }

  // Update playlist
  const updatePlaylist = async (
    id: string,
    updates: { title?: string; description?: string; is_public?: boolean }
  ): Promise<boolean> => {
    try {
      const updated = await $fetch<Playlist>(`/api/playlists/${id}`, {
        method: 'PATCH',
        body: updates,
      })

      const index = playlists.value.findIndex((p) => p.id === id)
      if (index >= 0) {
        playlists.value[index] = { ...playlists.value[index], ...updated }
      }

      // Invalidate playlist cache
      playlistCache.delete(id)

      toast.add({
        title: 'Playlist updated',
        color: 'green',
      })

      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to update playlist',
        description: error.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // Delete playlist
  const deletePlaylist = async (id: string): Promise<boolean> => {
    try {
      await $fetch<void>(`/api/playlists/${id}`, { method: 'DELETE' })

      playlists.value = playlists.value.filter((p) => p.id !== id)
      playlistsFetchedAt = 0 // Invalidate cache
      playlistCache.delete(id)

      toast.add({
        title: 'Playlist deleted',
        color: 'green',
      })

      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to delete playlist',
        description: error.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // ===== OPTIMISTIC TRACK MUTATIONS =====

  // Add track to playlist with optimistic update
  const addTrack = async (
    playlistId: string,
    trackId: string,
    trackTitle?: string
  ): Promise<boolean> => {
    // Optimistic update - increment track count immediately
    const playlist = playlists.value.find((p) => p.id === playlistId)
    const previousCount = playlist?.track_count ?? 0
    if (playlist) {
      playlist.track_count++
    }

    // Show success toast immediately (optimistic)
    toast.add({
      title: 'Added to playlist',
      description: trackTitle ? `"${trackTitle}" added` : 'Track added',
      color: 'green',
    })

    // API call in background
    $fetch(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: { trackId },
    }).then(() => {
      // Invalidate playlist cache to get fresh track list on next view
      playlistCache.delete(playlistId)
    }).catch(() => {
      // Rollback on error
      if (playlist) {
        playlist.track_count = previousCount
      }
      toast.add({
        title: 'Failed to add track',
        description: 'Please try again',
        color: 'red',
      })
    })

    return true
  }

  // Remove track from playlist with optimistic update
  const removeTrack = async (playlistId: string, trackId: string): Promise<boolean> => {
    // Optimistic update - decrement track count and remove from current playlist
    const playlist = playlists.value.find((p) => p.id === playlistId)
    const previousCount = playlist?.track_count ?? 0
    if (playlist && playlist.track_count > 0) {
      playlist.track_count--
    }

    // Also remove from currentPlaylist if viewing
    let previousTracks: PlaylistTrack[] = []
    if (currentPlaylist.value && currentPlaylist.value.id === playlistId) {
      previousTracks = [...currentPlaylist.value.playlist_tracks]
      currentPlaylist.value.playlist_tracks = currentPlaylist.value.playlist_tracks.filter(
        (pt) => pt.track.id !== trackId
      )
    }

    // Show success toast immediately (optimistic)
    toast.add({
      title: 'Track removed',
      color: 'green',
    })

    // API call in background
    $fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    }).then(() => {
      // Invalidate playlist cache
      playlistCache.delete(playlistId)
    }).catch(() => {
      // Rollback on error
      if (playlist) {
        playlist.track_count = previousCount
      }
      if (currentPlaylist.value && currentPlaylist.value.id === playlistId) {
        currentPlaylist.value.playlist_tracks = previousTracks
      }
      toast.add({
        title: 'Failed to remove track',
        description: 'Please try again',
        color: 'red',
      })
    })

    return true
  }

  // Reorder tracks
  const reorderTracks = async (
    playlistId: string,
    tracks: Array<{ id: string; position: number }>
  ): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${playlistId}/tracks/reorder`, {
        method: 'PATCH',
        body: { tracks },
      })

      // Invalidate playlist cache
      playlistCache.delete(playlistId)

      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to reorder tracks',
        description: error.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // ===== COLLABORATOR METHODS =====

  // Get collaborators
  const getCollaborators = async (playlistId: string): Promise<Collaborator[]> => {
    try {
      return await $fetch<Collaborator[]>(`/api/playlists/${playlistId}/collaborators`)
    } catch (e) {
      console.error('Failed to fetch collaborators:', e)
      return []
    }
  }

  // Invite collaborator
  const inviteCollaborator = async (
    playlistId: string,
    userIdOrEmail: string,
    role: 'editor' | 'viewer' = 'viewer',
    displayName?: string
  ): Promise<boolean> => {
    try {
      // Determine if it's a UUID (userId) or email
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrEmail)
      const body = isUuid ? { userId: userIdOrEmail, role } : { email: userIdOrEmail, role }

      await $fetch(`/api/playlists/${playlistId}/collaborators`, {
        method: 'POST',
        body,
      })

      toast.add({
        title: 'Collaborator added',
        description: `${displayName || userIdOrEmail} added as ${role}`,
        color: 'green',
      })

      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to add collaborator',
        description: error.data?.message || 'User not found',
        color: 'red',
      })
      return false
    }
  }

  // Remove collaborator
  const removeCollaborator = async (playlistId: string, collaboratorUserId: string): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${playlistId}/collaborators/${collaboratorUserId}`, {
        method: 'DELETE',
      })

      toast.add({
        title: 'Collaborator removed',
        color: 'green',
      })

      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to remove collaborator',
        description: error.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // Generate share link
  const generateShareLink = async (playlistId: string): Promise<string | null> => {
    try {
      const result = await $fetch<{ token: string; url: string }>(
        `/api/playlists/${playlistId}/share`,
        {
          method: 'POST',
        }
      )

      // Update playlist in local state
      const playlist = playlists.value.find((p) => p.id === playlistId)
      if (playlist) {
        playlist.share_token = result.token
        playlist.is_public = true
      }

      return result.url
    } catch (error: any) {
      toast.add({
        title: 'Failed to generate share link',
        description: error.data?.message || 'Please try again',
        color: 'red',
      })
      return null
    }
  }

  // Clear state when user logs out
  watch(userId, (newUserId) => {
    if (!newUserId) {
      playlists.value = []
      playlistsFetchedAt = 0
      playlistCache.clear()
      currentPlaylist.value = null
      currentPlaylistId.value = null
    }
  })

  return {
    // State
    playlists,
    loading,
    currentPlaylist,

    // Query methods
    fetchPlaylists,
    getPlaylist,
    getSharedPlaylist,

    // Mutation methods
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    reorderTracks,

    // Collaborator methods
    getCollaborators,
    inviteCollaborator,
    removeCollaborator,

    // Share methods
    generateShareLink,
  }
})
