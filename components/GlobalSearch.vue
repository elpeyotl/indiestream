<template>
  <div class="relative">
    <!-- Search Trigger Button -->
    <UButton
      color="gray"
      variant="ghost"
      icon="i-heroicons-magnifying-glass"
      @click="openSearch"
    />

    <!-- Search Modal -->
    <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <div class="p-4">
        <!-- Search Input -->
        <UInput
          ref="searchInput"
          v-model="query"
          placeholder="Search artists, albums, tracks, playlists..."
          size="xl"
          icon="i-heroicons-magnifying-glass"
          :loading="searching"
          autofocus
          @input="debouncedSearch"
        />

        <!-- Results -->
        <div v-if="query" class="mt-4 max-h-96 overflow-y-auto">
          <!-- Loading -->
          <div v-if="searching" class="flex items-center justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
          </div>

          <!-- No Results -->
          <div v-else-if="!hasResults" class="text-center py-8 text-zinc-400">
            <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No results found for "{{ query }}"</p>
          </div>

          <!-- Results List -->
          <div v-else class="space-y-4">
            <!-- Artists -->
            <div v-if="results.artists.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Artists</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="artist in results.artists"
                  :key="artist.id"
                  :to="`/${artist.slug}`"
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
                >
                  <div
                    class="w-10 h-10 rounded-lg overflow-hidden shrink-0"
                    :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
                  >
                    <img
                      v-if="artist.avatar_url"
                      :src="artist.avatar_url"
                      :alt="artist.name"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <span class="text-sm font-bold text-white">{{ artist.name.charAt(0) }}</span>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-zinc-100 truncate">{{ artist.name }}</p>
                    <p class="text-xs text-zinc-500">Artist</p>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Albums -->
            <div v-if="results.albums.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Albums</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="album in results.albums"
                  :key="album.id"
                  :to="`/${album.band?.slug}/${album.slug}`"
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
                >
                  <div class="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                    <img
                      v-if="album.cover_url"
                      :src="album.cover_url"
                      :alt="album.title"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-600" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-zinc-100 truncate">{{ album.title }}</p>
                    <p class="text-xs text-zinc-500">{{ album.band?.name }} · Album</p>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Tracks -->
            <div v-if="results.tracks.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tracks</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="track in results.tracks"
                  :key="track.id"
                  :to="`/${track.band_slug}/${track.album_slug}`"
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
                >
                  <div class="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                    <img
                      v-if="track.cover_url"
                      :src="track.cover_url"
                      :alt="track.album_title"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-600" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-zinc-100 truncate">{{ track.title }}</p>
                    <p class="text-xs text-zinc-500">{{ track.band_name }} · {{ track.album_title }}</p>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Playlists -->
            <div v-if="results.playlists.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Playlists</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="playlist in results.playlists"
                  :key="playlist.id"
                  :to="`/playlist/${playlist.id}`"
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
                >
                  <!-- Mini playlist cover mosaic -->
                  <div class="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                    <!-- 4 covers: 2x2 grid -->
                    <div v-if="playlist.covers?.length >= 4" class="grid grid-cols-2 h-full w-full">
                      <img
                        v-for="(cover, index) in playlist.covers.slice(0, 4)"
                        :key="index"
                        :src="cover"
                        :alt="`Cover ${index + 1}`"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <!-- 2-3 covers: show first 2 side by side -->
                    <div v-else-if="playlist.covers?.length >= 2" class="grid grid-cols-2 h-full w-full">
                      <img
                        v-for="(cover, index) in playlist.covers.slice(0, 2)"
                        :key="index"
                        :src="cover"
                        :alt="`Cover ${index + 1}`"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <!-- 1 cover: full image -->
                    <img
                      v-else-if="playlist.covers?.length === 1"
                      :src="playlist.covers[0]"
                      :alt="playlist.title"
                      class="w-full h-full object-cover"
                    />
                    <!-- No covers: gradient fallback -->
                    <div
                      v-else
                      class="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center"
                    >
                      <UIcon name="i-heroicons-queue-list" class="w-5 h-5 text-white/80" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-zinc-100 truncate">{{ playlist.title }}</p>
                    <p class="text-xs text-zinc-500">{{ playlist.track_count }} tracks · {{ playlist.owner_name || 'Unknown' }}</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Searches & Quick Links (when no query) -->
        <div v-else class="mt-4 space-y-4">
          <!-- Recent Searches -->
          <div v-if="recentSearches.length > 0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent Searches</h3>
              <button
                class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                @click="clearRecentSearches"
              >
                Clear
              </button>
            </div>
            <div class="space-y-1">
              <div
                v-for="search in recentSearches"
                :key="search.query"
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors group cursor-pointer"
                @click="useRecentSearch(search.query)"
              >
                <UIcon name="i-heroicons-clock" class="w-4 h-4 text-zinc-500" />
                <span class="flex-1 text-zinc-300 truncate">{{ search.query }}</span>
                <button
                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                  @click.stop="removeRecentSearch(search.query)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Quick Links</h3>
            <div class="grid grid-cols-2 gap-2">
              <NuxtLink
                to="/discover"
                class="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                @click="closeSearch"
              >
                <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-violet-400" />
                <span class="text-zinc-200">Discover</span>
              </NuxtLink>
              <NuxtLink
                to="/artists"
                class="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                @click="closeSearch"
              >
                <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-fuchsia-400" />
                <span class="text-zinc-200">Artists</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcut Hint -->
        <div class="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Press <kbd class="px-1.5 py-0.5 bg-zinc-800 rounded">ESC</kbd> to close</span>
          <span>Press <kbd class="px-1.5 py-0.5 bg-zinc-800 rounded">⌘K</kbd> to search</span>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const { getStreamUrl } = useAlbum()
const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentActivity()

const isOpen = ref(false)
const query = ref('')
const searching = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

interface SearchResults {
  artists: any[]
  albums: any[]
  tracks: any[]
  playlists: any[]
}

const results = ref<SearchResults>({
  artists: [],
  albums: [],
  tracks: [],
  playlists: [],
})

const hasResults = computed(() => {
  return results.value.artists.length > 0 ||
         results.value.albums.length > 0 ||
         results.value.tracks.length > 0 ||
         results.value.playlists.length > 0
})

const openSearch = () => {
  isOpen.value = true
  query.value = ''
  results.value = { artists: [], albums: [], tracks: [], playlists: [] }
}

const closeSearch = () => {
  isOpen.value = false
}

// Save search query when navigating to results
const saveAndClose = () => {
  if (query.value.trim()) {
    addRecentSearch(query.value.trim())
  }
  closeSearch()
}

// Use a recent search
const useRecentSearch = (searchQuery: string) => {
  query.value = searchQuery
  performSearch()
}

// Keyboard shortcut
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

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
      .select('id, name, slug, theme_color, avatar_key')
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
    const { moderationEnabled, loadModerationSetting } = useModerationFilter()
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
    const ownerIds = [...new Set((playlists || []).map(p => p.owner_id).filter(Boolean))]
    const { data: owners } = ownerIds.length > 0
      ? await client
          .from('profiles')
          .select('id, display_name')
          .in('id', ownerIds)
      : { data: [] }
    const ownerMap = new Map((owners || []).map((o: any) => [o.id, o.display_name]))

    // Process artists with avatar URLs
    const processedArtists = []
    for (const artist of (artists || [])) {
      const processed: any = {
        ...artist,
        avatar_url: null,
      }
      if (artist.avatar_key) {
        try {
          processed.avatar_url = await getStreamUrl(artist.avatar_key)
        } catch (e) {
          // Skip avatar URL
        }
      }
      processedArtists.push(processed)
    }
    results.value.artists = processedArtists

    // Process albums with cover URLs
    const processedAlbums = []
    for (const album of (albums || [])) {
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
    for (const track of (tracks || [])) {
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
    for (const playlist of (playlists || [])) {
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
      for (const pt of (playlistTracks || [])) {
        const coverKey = (pt.track as any)?.album?.cover_key
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
</script>
