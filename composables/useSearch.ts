// Composable for shared search functionality between desktop modal and mobile page
import type { Band } from '~/stores/band'

export interface SearchResults {
  artists: any[]
  albums: any[]
  tracks: any[]
  playlists: any[]
}

export interface FeaturedPlaylist {
  id: string
  title: string
  track_count: number
  is_curated?: boolean
  previewTracks?: { coverKey: string }[]
}

export function useSearch() {
  const client = useSupabaseClient()
  const albumStore = useAlbumStore()
  const bandStore = useBandStore()
  const { getStreamUrl } = albumStore
  const { resolveAvatarUrls, getFeaturedBands } = bandStore
  const { moderationEnabled, loadModerationSetting } = useModerationFilter()

  // Search state
  const query = ref('')
  const searching = ref(false)
  const results = ref<SearchResults>({
    artists: [],
    albums: [],
    tracks: [],
    playlists: [],
  })

  // Empty state content
  const trendingArtists = ref<Band[]>([])
  const featuredPlaylist = ref<FeaturedPlaylist | null>(null)
  const playlistCovers = ref<string[]>([])
  const loadingTrending = ref(true)

  // Computed
  const hasResults = computed(() => {
    return results.value.artists.length > 0 ||
           results.value.albums.length > 0 ||
           results.value.tracks.length > 0 ||
           results.value.playlists.length > 0
  })

  // Debounced search
  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  const debouncedSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      performSearch()
    }, 300)
  }

  // Clear search
  const clearSearch = () => {
    query.value = ''
    results.value = { artists: [], albums: [], tracks: [], playlists: [] }
  }

  // Main search function
  const performSearch = async () => {
    if (!query.value.trim()) {
      results.value = { artists: [], albums: [], tracks: [], playlists: [] }
      return
    }

    searching.value = true

    try {
      // Search artists (only active/approved)
      const { data: artists } = await client
        .from('bands')
        .select('id, name, slug, theme_color, avatar_key, avatar_url')
        .eq('status', 'active')
        .ilike('name', `%${query.value}%`)
        .limit(5)

      // Search albums
      const { data: albums } = await client
        .from('albums')
        .select(`
          id,
          title,
          slug,
          cover_key,
          cover_url,
          band:bands!inner (
            id,
            name,
            slug
          )
        `)
        .eq('is_published', true)
        .ilike('title', `%${query.value}%`)
        .limit(5)

      // Search tracks - check moderation setting
      await loadModerationSetting()

      let tracksQuery = client
        .from('tracks')
        .select(`
          id,
          title,
          moderation_status,
          albums!inner (
            slug,
            title,
            cover_key,
            is_published,
            bands!inner (
              name,
              slug
            )
          )
        `)
        .eq('albums.is_published', true)
        .ilike('title', `%${query.value}%`)

      // Filter by moderation status if enabled
      if (moderationEnabled.value) {
        tracksQuery = tracksQuery.eq('moderation_status', 'approved')
      }

      const { data: tracks } = await tracksQuery.limit(5)

      // Search public playlists
      const { data: playlists } = await client
        .from('playlists')
        .select(`
          id,
          title,
          track_count,
          cover_key,
          owner_id
        `)
        .eq('is_public', true)
        .ilike('title', `%${query.value}%`)
        .limit(5)

      // Get owner info for playlists
      const playlistsData = (playlists || []) as any[]
      const ownerIds = [...new Set(playlistsData.map(p => p.owner_id).filter(Boolean))]
      const { data: owners } = ownerIds.length > 0
        ? await client
            .from('profiles')
            .select('id, display_name')
            .in('id', ownerIds)
        : { data: [] }
      const ownerMap = new Map((owners || []).map((o: any) => [o.id, o.display_name]))

      // Process artists with avatar URLs
      const processedArtists = (artists || []) as any[]
      await resolveAvatarUrls(processedArtists)
      results.value.artists = processedArtists

      // Process albums with cover URLs
      const processedAlbums = []
      const albumsData = (albums || []) as any[]
      for (const album of albumsData) {
        const processed: any = {
          ...album,
          band: Array.isArray(album.band) ? album.band[0] : album.band,
          cover_url: album.cover_url || null,
        }
        if (album.cover_key) {
          try {
            processed.cover_url = await getStreamUrl(album.cover_key)
          } catch (e) {
            // Skip - use cover_url from DB as fallback
          }
        }
        processedAlbums.push(processed)
      }
      results.value.albums = processedAlbums

      // Process tracks with cover URLs
      const processedTracks = []
      const tracksData = (tracks || []) as any[]
      for (const track of tracksData) {
        const processed: any = {
          id: track.id,
          title: track.title,
          album_slug: track.albums?.slug,
          album_title: track.albums?.title,
          band_name: track.albums?.bands?.name,
          band_slug: track.albums?.bands?.slug,
          cover_url: null,
        }
        if (track.albums?.cover_key) {
          try {
            processed.cover_url = await getStreamUrl(track.albums.cover_key)
          } catch (e) {
            // Skip cover URL
          }
        }
        processedTracks.push(processed)
      }
      results.value.tracks = processedTracks

      // Process playlists with cover URLs from tracks
      const processedPlaylists = []
      for (const playlist of playlistsData) {
        // Fetch first 4 track covers for playlist mosaic
        const { data: playlistTracks } = await client
          .from('playlist_tracks')
          .select(`
            track:tracks!track_id (
              album:albums!album_id (
                cover_key
              )
            )
          `)
          .eq('playlist_id', playlist.id)
          .order('position', { ascending: true })
          .limit(4)

        // Get unique cover URLs
        const covers: string[] = []
        const playlistTracksData = (playlistTracks || []) as any[]
        for (const pt of playlistTracksData) {
          const coverKey = pt.track?.album?.cover_key
          if (coverKey && covers.length < 4) {
            try {
              const url = await getStreamUrl(coverKey)
              if (url && !covers.includes(url)) {
                covers.push(url)
              }
            } catch (e) {
              // Skip this cover
            }
          }
        }

        processedPlaylists.push({
          id: playlist.id,
          title: playlist.title,
          track_count: playlist.track_count,
          owner_name: ownerMap.get(playlist.owner_id) || null,
          covers, // Array of cover URLs for mosaic
        })
      }
      results.value.playlists = processedPlaylists
    } catch (e) {
      console.error('Search failed:', e)
    } finally {
      searching.value = false
    }
  }

  // Load empty state content (trending artists + featured playlist)
  const loadEmptyStateContent = async () => {
    loadingTrending.value = true

    // Load trending artists
    try {
      const bands = await getFeaturedBands(6)
      await resolveAvatarUrls(bands)
      trendingArtists.value = bands
    } catch (e) {
      console.error('Failed to load trending artists:', e)
    } finally {
      loadingTrending.value = false
    }

    // Load featured playlist
    try {
      const { data } = await $fetch<{ data: any[] }>('/api/playlists/featured', {
        query: { limit: 1 },
      })
      if (data && data.length > 0) {
        featuredPlaylist.value = data[0]
        // Load playlist covers
        const covers: string[] = []
        for (const track of (data[0].previewTracks || []).slice(0, 4)) {
          if (track.coverKey && covers.length < 4) {
            try {
              const url = await getStreamUrl(track.coverKey)
              if (url) covers.push(url)
            } catch (e) {
              // Skip
            }
          }
        }
        playlistCovers.value = covers
      }
    } catch (e) {
      console.error('Failed to load featured playlist:', e)
    }
  }

  return {
    // Search state
    query,
    searching,
    results,
    hasResults,

    // Empty state content
    trendingArtists,
    featuredPlaylist,
    playlistCovers,
    loadingTrending,

    // Methods
    performSearch,
    debouncedSearch,
    clearSearch,
    loadEmptyStateContent,
  }
}
