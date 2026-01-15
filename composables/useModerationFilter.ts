// Composable to handle moderation filtering for tracks

export const useModerationFilter = () => {
  // Use useState for SSR-safe shared state
  const moderationEnabled = useState<boolean>('moderationEnabled', () => false)
  const loaded = useState<boolean>('moderationLoaded', () => false)

  // Fetch moderation setting (cached on server)
  const loadModerationSetting = async () => {
    if (loaded.value) return

    try {
      const { requireModeration } = await $fetch<{ requireModeration: boolean }>('/api/settings/moderation')
      moderationEnabled.value = requireModeration
    } catch (e) {
      console.error('Failed to load moderation setting:', e)
      moderationEnabled.value = false
    } finally {
      loaded.value = true
    }
  }

  // Filter tracks array based on moderation status
  const filterTracks = <T extends { moderation_status?: string }>(tracks: T[]): T[] => {
    if (!moderationEnabled.value) return tracks
    return tracks.filter(track => track.moderation_status === 'approved')
  }

  // Check if a single track should be visible
  const isTrackVisible = (track: { moderation_status?: string }): boolean => {
    if (!moderationEnabled.value) return true
    return track.moderation_status === 'approved'
  }

  // Get SQL filter condition for track queries
  const getTrackFilter = () => {
    if (!moderationEnabled.value) return null
    return { column: 'moderation_status', value: 'approved' }
  }

  // Filter albums array - remove albums with no tracks after track filtering
  const filterAlbums = <T extends { tracks?: any[] }>(albums: T[]): T[] => {
    if (!moderationEnabled.value) return albums
    return albums.filter(album => album.tracks && album.tracks.length > 0)
  }

  // Check if an album has visible tracks
  const hasVisibleTracks = (album: { tracks?: { moderation_status?: string }[] }): boolean => {
    if (!moderationEnabled.value) return true
    if (!album.tracks || album.tracks.length === 0) return false
    return album.tracks.some(track => track.moderation_status === 'approved')
  }

  return {
    moderationEnabled: readonly(moderationEnabled),
    loaded: readonly(loaded),
    loadModerationSetting,
    filterTracks,
    isTrackVisible,
    getTrackFilter,
    filterAlbums,
    hasVisibleTracks,
  }
}
