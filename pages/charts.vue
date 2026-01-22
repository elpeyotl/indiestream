<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-zinc-100 mb-2">Charts</h1>
        <p class="text-zinc-400">See what's trending on Fairtune</p>
      </div>

      <!-- Period Selector -->
      <USelectMenu
        v-model="selectedPeriod"
        :options="periodOptions"
        class="w-40"
        @change="loadCharts"
      />
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
      <section v-for="i in 3" :key="i">
        <USkeleton class="h-7 w-40 mb-4" />
        <div class="space-y-2">
          <div v-for="j in 5" :key="j" class="flex items-center gap-3 p-2">
            <USkeleton class="w-6 h-6" />
            <USkeleton class="w-10 h-10 rounded" />
            <div class="flex-1">
              <USkeleton class="h-4 w-32 mb-1" />
              <USkeleton class="h-3 w-20" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-400" />
      </div>
      <h2 class="text-xl font-semibold text-zinc-100 mb-2">Failed to Load Charts</h2>
      <p class="text-zinc-400 mb-6">Something went wrong. Please try again.</p>
      <UButton color="violet" @click="loadCharts">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Retry
      </UButton>
    </div>

    <template v-else>
      <!-- Charts Grid: 3 columns on desktop, 2 on tablet, 1 on mobile -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        <!-- Top Tracks -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
            Top Tracks
          </h2>

          <div v-if="charts.tracks.length > 0" class="space-y-2">
            <div
              v-for="(track, index) in charts.tracks.slice(0, 10)"
              :key="track.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
              @click="playTrack(track)"
            >
              <!-- Rank -->
              <div class="w-6 text-center shrink-0">
                <span
                  class="text-sm font-bold"
                  :class="index < 3 ? 'text-violet-400' : 'text-zinc-500'"
                >
                  {{ index + 1 }}
                </span>
              </div>

              <!-- Cover -->
              <div class="w-10 h-10 rounded overflow-hidden bg-zinc-800 shrink-0 relative">
                <NuxtImg
                  v-if="trackCovers[track.id]"
                  :src="trackCovers[track.id]"
                  :alt="track.title"
                  :width="40"
                  :height="40"
                  format="webp"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
                </div>
                <!-- Play overlay -->
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <UIcon v-if="loadingPlayId === track.id" name="i-heroicons-arrow-path" class="w-4 h-4 text-white animate-spin" />
                  <UIcon v-else name="i-heroicons-play" class="w-4 h-4 text-white" />
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                  {{ track.title }}
                </p>
                <NuxtLink
                  :to="`/${track.album?.band?.slug}`"
                  class="text-xs text-zinc-400 hover:text-violet-400 truncate block"
                  @click.stop
                >
                  {{ track.album?.band?.name }}
                </NuxtLink>
              </div>

              <!-- Streams -->
              <div class="text-right shrink-0">
                <p class="text-xs text-zinc-400">{{ formatNumber(track.streams) }}</p>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            icon="i-heroicons-musical-note"
            title="No Data Yet"
            description="Not enough streams to show charts"
            class="py-8"
          />
        </section>

        <!-- Top Albums -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-square-3-stack-3d" class="w-5 h-5 text-violet-400" />
            Top Albums
          </h2>

          <div v-if="charts.albums.length > 0" class="space-y-2">
            <div
              v-for="(album, index) in charts.albums.slice(0, 10)"
              :key="album.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
            >
              <!-- Rank -->
              <div class="w-6 text-center shrink-0">
                <span
                  class="text-sm font-bold"
                  :class="index < 3 ? 'text-violet-400' : 'text-zinc-500'"
                >
                  {{ index + 1 }}
                </span>
              </div>

              <!-- Cover with play button -->
              <div class="w-10 h-10 rounded overflow-hidden bg-zinc-800 shrink-0 relative cursor-pointer" @click="playAlbum(album)">
                <NuxtImg
                  v-if="albumCovers[album.id]"
                  :src="albumCovers[album.id]"
                  :alt="album.title"
                  :width="40"
                  :height="40"
                  format="webp"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
                </div>
                <!-- Play overlay -->
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <UIcon v-if="loadingPlayId === album.id" name="i-heroicons-arrow-path" class="w-4 h-4 text-white animate-spin" />
                  <UIcon v-else name="i-heroicons-play" class="w-4 h-4 text-white" />
                </div>
              </div>

              <!-- Info -->
              <NuxtLink :to="`/${album.band?.slug}/${album.slug}`" class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                  {{ album.title }}
                </p>
                <p class="text-xs text-zinc-400 truncate">{{ album.band?.name }}</p>
              </NuxtLink>

              <!-- Streams -->
              <div class="text-right shrink-0">
                <p class="text-xs text-zinc-400">{{ formatNumber(album.streams) }}</p>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            icon="i-heroicons-square-3-stack-3d"
            title="No Data Yet"
            description="Not enough streams to show album charts"
            class="py-8"
          />
        </section>

        <!-- Top Artists -->
        <section>
          <h2 class="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-violet-400" />
            Top Artists
          </h2>

          <div v-if="charts.artists.length > 0" class="space-y-2">
            <div
              v-for="(artist, index) in charts.artists.slice(0, 10)"
              :key="artist.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
            >
              <!-- Rank -->
              <div class="w-6 text-center shrink-0">
                <span
                  class="text-sm font-bold"
                  :class="index < 3 ? 'text-violet-400' : 'text-zinc-500'"
                >
                  {{ index + 1 }}
                </span>
              </div>

              <!-- Avatar with play button -->
              <div class="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0 relative cursor-pointer" @click="playArtist(artist)">
                <NuxtImg
                  v-if="artistAvatars[artist.id]"
                  :src="artistAvatars[artist.id]"
                  :alt="artist.name"
                  :width="40"
                  :height="40"
                  format="webp"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                  :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
                >
                  <span class="text-sm font-bold text-white">{{ artist.name.charAt(0) }}</span>
                </div>
                <!-- Play overlay -->
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <UIcon v-if="loadingPlayId === artist.id" name="i-heroicons-arrow-path" class="w-4 h-4 text-white animate-spin" />
                  <UIcon v-else name="i-heroicons-play" class="w-4 h-4 text-white" />
                </div>
              </div>

              <!-- Info -->
              <NuxtLink :to="`/${artist.slug}`" class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                  {{ artist.name }}
                </p>
                <p class="text-xs text-zinc-500">{{ artist.genres?.slice(0, 2).join(', ') || 'Artist' }}</p>
              </NuxtLink>

              <!-- Streams -->
              <div class="text-right shrink-0">
                <p class="text-xs text-zinc-400">{{ formatNumber(artist.streams) }}</p>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            icon="i-heroicons-user-group"
            title="No Data Yet"
            description="Not enough streams to show artist charts"
            class="py-8"
          />
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const albumStore = useAlbumStore()
const { getCachedCoverUrl, getAlbumById } = albumStore
const playerStore = usePlayerStore()
const { setQueue, playPlaylist } = playerStore

interface ChartData {
  tracks: any[]
  albums: any[]
  artists: any[]
}

const loadingPlayId = ref<string | null>(null)
const selectedPeriod = ref('7d')

const periodOptions = [
  { label: 'This Week', value: '7d' },
  { label: 'This Month', value: '30d' },
  { label: 'All Time', value: 'all' },
]

const trackCovers = ref<Record<string, string>>({})
const albumCovers = ref<Record<string, string>>({})
const artistAvatars = ref<Record<string, string>>({})

// Fetch charts using Nuxt's useLazyAsyncData with period as watch source
const { data: chartsData, pending: loading, error: fetchError, refresh } = await useLazyAsyncData(
  'charts-page',
  async () => {
    const data = await $fetch('/api/charts/trending', {
      query: { period: selectedPeriod.value, limit: 20 },
    })
    return data as ChartData
  },
  {
    default: () => ({
      tracks: [],
      albums: [],
      artists: [],
    }),
    watch: [selectedPeriod],
  }
)

// Computed accessors
const charts = computed(() => chartsData.value ?? { tracks: [], albums: [], artists: [] })
const error = computed(() => !!fetchError.value)

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const loadCharts = () => refresh()

// Load images using the cached cover URL helper - defined before the watch that uses it
const loadImages = async () => {
  // Load cover images for tracks (parallel)
  await Promise.all(
    charts.value.tracks.map(async (track) => {
      if (track.album?.cover_key && !trackCovers.value[track.id]) {
        const url = await getCachedCoverUrl(track.album.cover_key)
        if (url) trackCovers.value[track.id] = url
      }
    })
  )

  // Load cover images for albums (parallel)
  await Promise.all(
    charts.value.albums.map(async (album) => {
      if (album.cover_key && !albumCovers.value[album.id]) {
        const url = await getCachedCoverUrl(album.cover_key)
        if (url) albumCovers.value[album.id] = url
      }
    })
  )

  // Load avatars for artists (parallel, using cache)
  await Promise.all(
    charts.value.artists.map(async (artist) => {
      if (artist.avatar_key && !artistAvatars.value[artist.id]) {
        const url = await getCachedCoverUrl(artist.avatar_key)
        if (url) artistAvatars.value[artist.id] = url
      }
    })
  )
}

// Load images when charts data changes
watch(chartsData, () => {
  if (chartsData.value) {
    loadImages()
  }
}, { immediate: true })

const playTrack = async (track: any) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = track.id

  try {
    // Filter tracks that have streaming audio keys
    const playableTracks = charts.value.tracks.filter(t => t.streaming_audio_key)

    if (playableTracks.length === 0) return

    // Create queue from playable tracks
    const queue = playableTracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.album?.band?.name || 'Unknown Artist',
      artistSlug: t.album?.band?.slug || '',
      albumTitle: t.album?.title || '',
      albumSlug: t.album?.slug || '',
      coverUrl: trackCovers.value[t.id] || null,
      duration: t.duration || 0,
      audioKey: t.streaming_audio_key,
    }))

    const trackIndex = playableTracks.findIndex(t => t.id === track.id)
    setQueue(queue, trackIndex >= 0 ? trackIndex : 0)
  } finally {
    loadingPlayId.value = null
  }
}

const playAlbum = async (album: any) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = album.id

  try {
    // Fetch album with tracks
    const fullAlbum = await getAlbumById(album.id)
    if (!fullAlbum?.tracks?.length) return

    // Get cover URL
    const coverUrl = albumCovers.value[album.id] || null

    // Filter tracks with audio and map to playlist format
    const playableTracks = fullAlbum.tracks
      .filter(t => t.audio_key)
      .map(t => ({
        id: t.id,
        title: t.title,
        duration_seconds: t.duration_seconds,
        audio_key: t.audio_key,
        coverUrl,
        album: {
          id: fullAlbum.id,
          title: fullAlbum.title,
          slug: fullAlbum.slug,
          band: fullAlbum.band,
        },
      }))

    if (playableTracks.length > 0) {
      await playPlaylist(playableTracks, 0)
    }
  } catch (e) {
    console.error('Failed to play album:', e)
  } finally {
    loadingPlayId.value = null
  }
}

const playArtist = async (artist: any) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = artist.id

  try {
    // Fetch random tracks from this artist
    const tracks = await $fetch<Array<{
      id: string
      title: string
      audioKey: string
      duration: number
      albumTitle: string
      albumSlug: string
      coverKey: string | null
    }>>(`/api/artists/${artist.id}/tracks`, {
      query: { shuffle: 'true', limit: 20 },
    })

    if (!tracks?.length) return

    // Build queue with cover URLs
    const queue = await Promise.all(
      tracks.map(async (t) => ({
        id: t.id,
        title: t.title,
        artist: artist.name,
        artistSlug: artist.slug,
        albumTitle: t.albumTitle,
        albumSlug: t.albumSlug,
        coverUrl: await getCachedCoverUrl(t.coverKey),
        duration: t.duration,
        audioKey: t.audioKey,
      }))
    )

    if (queue.length > 0) {
      await setQueue(queue, 0)
    }
  } catch (e) {
    console.error('Failed to play artist:', e)
  } finally {
    loadingPlayId.value = null
  }
}

useHead({
  title: 'Charts | Fairtune',
  meta: [
    { name: 'description', content: 'See what\'s trending on Fairtune. Discover top tracks, albums, and artists from independent musicians.' },
  ],
})
</script>
