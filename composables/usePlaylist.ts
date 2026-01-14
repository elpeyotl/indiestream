// Playlist management composable

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

// Global state
const playlists = ref<Playlist[]>([])
const loading = ref(false)

export const usePlaylist = () => {
  const user = useSupabaseUser()
  const toast = useToast()

  // Fetch user's playlists
  const fetchPlaylists = async (): Promise<Playlist[]> => {
    if (!user.value) {
      playlists.value = []
      return []
    }

    loading.value = true
    try {
      const data = await $fetch<Playlist[]>('/api/playlists')
      playlists.value = data
      return data
    } catch (e) {
      console.error('Failed to fetch playlists:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  // Get single playlist with tracks
  const getPlaylist = async (id: string): Promise<PlaylistWithTracks | null> => {
    try {
      return await $fetch<PlaylistWithTracks>(`/api/playlists/${id}`)
    } catch (e) {
      console.error('Failed to fetch playlist:', e)
      return null
    }
  }

  // Get shared playlist by token
  const getSharedPlaylist = async (token: string): Promise<PlaylistWithTracks | null> => {
    try {
      return await $fetch<PlaylistWithTracks>(`/api/playlists/shared/${token}`)
    } catch (e) {
      console.error('Failed to fetch shared playlist:', e)
      return null
    }
  }

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
      playlists.value.unshift({ ...playlist, role: 'owner' })
      toast.add({
        title: 'Playlist created',
        description: `"${title}" is ready`,
        color: 'green',
      })
      return playlist
    } catch (e: any) {
      console.error('Failed to create playlist:', e)
      toast.add({
        title: 'Failed to create playlist',
        description: e.data?.message || 'Please try again',
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
      toast.add({
        title: 'Playlist updated',
        color: 'green',
      })
      return true
    } catch (e: any) {
      console.error('Failed to update playlist:', e)
      toast.add({
        title: 'Failed to update playlist',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // Delete playlist
  const deletePlaylist = async (id: string): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${id}`, { method: 'DELETE' })
      playlists.value = playlists.value.filter((p) => p.id !== id)
      toast.add({
        title: 'Playlist deleted',
        color: 'green',
      })
      return true
    } catch (e: any) {
      console.error('Failed to delete playlist:', e)
      toast.add({
        title: 'Failed to delete playlist',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // Add track to playlist
  const addTrack = async (playlistId: string, trackId: string, trackTitle?: string): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: { trackId },
      })
      // Update track count
      const playlist = playlists.value.find((p) => p.id === playlistId)
      if (playlist) {
        playlist.track_count++
      }
      toast.add({
        title: 'Added to playlist',
        description: trackTitle ? `"${trackTitle}" added` : 'Track added',
        color: 'green',
      })
      return true
    } catch (e: any) {
      console.error('Failed to add track:', e)
      toast.add({
        title: 'Failed to add track',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // Remove track from playlist
  const removeTrack = async (playlistId: string, trackId: string): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${playlistId}/tracks/${trackId}`, {
        method: 'DELETE',
      })
      // Update track count
      const playlist = playlists.value.find((p) => p.id === playlistId)
      if (playlist && playlist.track_count > 0) {
        playlist.track_count--
      }
      toast.add({
        title: 'Track removed',
        color: 'green',
      })
      return true
    } catch (e: any) {
      console.error('Failed to remove track:', e)
      toast.add({
        title: 'Failed to remove track',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
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
      return true
    } catch (e: any) {
      console.error('Failed to reorder tracks:', e)
      toast.add({
        title: 'Failed to reorder tracks',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

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
    email: string,
    role: 'editor' | 'viewer' = 'viewer'
  ): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${playlistId}/collaborators`, {
        method: 'POST',
        body: { email, role },
      })
      toast.add({
        title: 'Collaborator invited',
        description: `${email} added as ${role}`,
        color: 'green',
      })
      return true
    } catch (e: any) {
      console.error('Failed to invite collaborator:', e)
      toast.add({
        title: 'Failed to invite collaborator',
        description: e.data?.message || 'User not found',
        color: 'red',
      })
      return false
    }
  }

  // Remove collaborator
  const removeCollaborator = async (playlistId: string, userId: string): Promise<boolean> => {
    try {
      await $fetch(`/api/playlists/${playlistId}/collaborators/${userId}`, {
        method: 'DELETE',
      })
      toast.add({
        title: 'Collaborator removed',
        color: 'green',
      })
      return true
    } catch (e: any) {
      console.error('Failed to remove collaborator:', e)
      toast.add({
        title: 'Failed to remove collaborator',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return false
    }
  }

  // Generate share link
  const generateShareLink = async (playlistId: string): Promise<string | null> => {
    try {
      const result = await $fetch<{ token: string; url: string }>(`/api/playlists/${playlistId}/share`, {
        method: 'POST',
      })
      // Update playlist in local state
      const playlist = playlists.value.find((p) => p.id === playlistId)
      if (playlist) {
        playlist.share_token = result.token
        playlist.is_public = true
      }
      return result.url
    } catch (e: any) {
      console.error('Failed to generate share link:', e)
      toast.add({
        title: 'Failed to generate share link',
        description: e.data?.message || 'Please try again',
        color: 'red',
      })
      return null
    }
  }

  return {
    playlists,
    loading,
    fetchPlaylists,
    getPlaylist,
    getSharedPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    reorderTracks,
    getCollaborators,
    inviteCollaborator,
    removeCollaborator,
    generateShareLink,
  }
}
