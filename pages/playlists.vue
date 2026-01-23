<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-zinc-100">Playlists</h1>
        <p class="text-zinc-400 mt-1">
          Discover playlists curated by the community
        </p>
      </div>

      <!-- Filter -->
      <div class="flex items-center gap-2">
        <UButton
          :color="!showCuratedOnly ? 'violet' : 'gray'"
          :variant="!showCuratedOnly ? 'solid' : 'ghost'"
          size="sm"
          @click="showCuratedOnly = false"
        >
          All
        </UButton>
        <UButton
          :color="showCuratedOnly ? 'violet' : 'gray'"
          :variant="showCuratedOnly ? 'solid' : 'ghost'"
          size="sm"
          @click="showCuratedOnly = true"
        >
          <UIcon name="i-heroicons-star" class="w-4 h-4 mr-1" />
          Curated
        </UButton>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="pending && playlists.length === 0"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    >
      <div v-for="i in 20" :key="i">
        <USkeleton class="aspect-square rounded-lg mb-3" />
        <USkeleton class="h-4 w-3/4 mb-2" />
        <USkeleton class="h-3 w-1/2" />
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="playlists.length === 0"
      icon="i-heroicons-queue-list"
      :title="showCuratedOnly ? 'No curated playlists yet' : 'No playlists yet'"
      :description="showCuratedOnly ? 'Check back soon for staff-picked playlists.' : 'Be the first to create a public playlist!'"
    />

    <!-- Playlists Grid -->
    <div v-else>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <PlaylistCard
          v-for="playlist in playlists"
          :key="playlist.id"
          :playlist="playlist"
          :covers="playlistCovers[playlist.id] || []"
          :loading="loadingPlayId === playlist.id"
          overlay
          @play="playPlaylist"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="flex justify-center mt-8">
        <UButton
          color="gray"
          variant="soft"
          :loading="loadingMore"
          @click="loadMore"
        >
          Load More
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Playlist {
  id: string
  title: string
  description?: string | null
  cover_key?: string | null
  track_count: number
  is_curated?: boolean
  owner?: { id: string; display_name?: string | null }
  previewTracks?: Array<{ album?: { cover_key?: string | null } | null }>
}

const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore
const playerStore = usePlayerStore()

const playlistCovers = ref<Record<string, string[]>>({})
const loadingPlayId = ref<string | null>(null)
const loadingMore = ref(false)
const showCuratedOnly = ref(false)
const offset = ref(0)
const limit = 20

// Fetch playlists
const fetchPlaylists = async (reset = false) => {
  const currentOffset = reset ? 0 : offset.value
  return $fetch<{ playlists: Playlist[]; total: number; hasMore: boolean }>(
    '/api/playlists/public',
    { query: { limit, offset: currentOffset, curated: showCuratedOnly.value } }
  )
}

const { data, pending, refresh } = await useLazyAsyncData(
  'playlists-page',
  () => fetchPlaylists(true),
  { watch: [showCuratedOnly] }
)

const playlists = ref<Playlist[]>([])
const hasMore = ref(false)

// Update playlists when data changes
watch(data, (newData) => {
  if (newData) {
    playlists.value = newData.playlists
    hasMore.value = newData.hasMore
    offset.value = newData.playlists.length
    loadPlaylistCovers(newData.playlists)
  }
}, { immediate: true })

// Reset when filter changes
watch(showCuratedOnly, () => {
  playlists.value = []
  offset.value = 0
})

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const result = await fetchPlaylists()
    playlists.value = [...playlists.value, ...result.playlists]
    hasMore.value = result.hasMore
    offset.value += result.playlists.length
    loadPlaylistCovers(result.playlists)
  } finally {
    loadingMore.value = false
  }
}

const loadPlaylistCovers = async (playlistList: Playlist[]) => {
  for (const playlist of playlistList) {
    if (playlistCovers.value[playlist.id]) continue

    // If playlist has its own cover, use that
    if (playlist.cover_key) {
      const url = await getCachedCoverUrl(playlist.cover_key)
      if (url) playlistCovers.value[playlist.id] = [url]
      continue
    }

    // Otherwise build mosaic from preview tracks' album covers
    if (playlist.previewTracks?.length) {
      const coverUrls: string[] = []
      for (const track of playlist.previewTracks) {
        if (track?.album?.cover_key) {
          const url = await getCachedCoverUrl(track.album.cover_key)
          if (url) coverUrls.push(url)
        }
      }
      if (coverUrls.length > 0) {
        playlistCovers.value[playlist.id] = coverUrls
      }
    }
  }
}

const playPlaylist = async (playlist: { id: string }) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = playlist.id
  try {
    const data = await $fetch<{ playlist_tracks: any[] }>(
      `/api/playlists/${playlist.id}`,
    )
    if (data.playlist_tracks?.length) {
      const queue = data.playlist_tracks
        .filter((pt: any) => pt.track?.audio_key)
        .map((pt: any) => ({
          id: pt.track.id,
          title: pt.track.title,
          artist: pt.track.album?.band?.name || '',
          artistSlug: pt.track.album?.band?.slug || '',
          albumTitle: pt.track.album?.title || '',
          albumSlug: pt.track.album?.slug || '',
          coverUrl: null as string | null,
          duration: pt.track.duration_seconds,
          audioKey: pt.track.audio_key,
        }))
      await playerStore.setQueue(queue, 0)
    }
  } finally {
    loadingPlayId.value = null
  }
}

// SEO
useHead({
  title: 'Playlists | Fairtune',
  meta: [
    {
      name: 'description',
      content: 'Discover curated playlists from the Fairtune community. Find your next favorite independent artists.',
    },
  ],
})
</script>
