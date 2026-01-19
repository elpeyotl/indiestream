<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold text-zinc-100 mb-2">Charts</h1>
        <p class="text-zinc-400">See what's trending on Fairstream</p>
      </div>

      <!-- Period Selector -->
      <USelectMenu
        v-model="selectedPeriod"
        :options="periodOptions"
        class="w-40"
        @change="loadCharts"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-12">
      <section v-for="i in 3" :key="i">
        <div class="h-7 w-48 skeleton mb-4" />
        <div class="space-y-3">
          <div v-for="j in 5" :key="j" class="h-16 skeleton rounded-lg" />
        </div>
      </section>
    </div>

    <template v-else>
      <!-- Top Tracks -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
          Top Tracks
        </h2>

        <div v-if="charts.tracks.length > 0" class="space-y-2">
          <div
            v-for="(track, index) in charts.tracks.slice(0, 10)"
            :key="track.id"
            class="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
            @click="playTrack(track)"
          >
            <!-- Rank -->
            <div class="w-8 text-center">
              <span
                class="text-lg font-bold"
                :class="index < 3 ? 'text-violet-400' : 'text-zinc-500'"
              >
                {{ index + 1 }}
              </span>
            </div>

            <!-- Cover -->
            <div class="w-12 h-12 rounded overflow-hidden bg-zinc-800 shrink-0 relative">
              <img
                v-if="trackCovers[track.id]"
                :src="trackCovers[track.id]"
                :alt="track.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-600" />
              </div>
              <!-- Play overlay -->
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <UIcon name="i-heroicons-play" class="w-6 h-6 text-white" />
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                {{ track.title }}
              </p>
              <NuxtLink
                :to="`/${track.album?.band?.slug}`"
                class="text-sm text-zinc-400 hover:text-violet-400 truncate block"
                @click.stop
              >
                {{ track.album?.band?.name }}
              </NuxtLink>
            </div>

            <!-- Streams -->
            <div class="text-right shrink-0">
              <p class="text-zinc-100 font-medium">{{ formatNumber(track.streams) }}</p>
              <p class="text-xs text-zinc-500">streams</p>
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
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-square-3-stack-3d" class="w-5 h-5 text-violet-400" />
          Top Albums
        </h2>

        <div v-if="charts.albums.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="(album, index) in charts.albums.slice(0, 10)"
            :key="album.id"
            :to="`/${album.band?.slug}/${album.slug}`"
            class="group relative"
          >
            <!-- Rank badge -->
            <div
              class="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-10"
              :class="index < 3 ? 'bg-violet-500 text-white' : 'bg-zinc-700 text-zinc-300'"
            >
              {{ index + 1 }}
            </div>

            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl transition-all">
              <img
                v-if="albumCovers[album.id]"
                :src="albumCovers[album.id]"
                :alt="album.title"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
              </div>
            </div>
            <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
              {{ album.title }}
            </p>
            <p class="text-sm text-zinc-400 truncate">{{ album.band?.name }}</p>
            <p class="text-xs text-zinc-500">{{ formatNumber(album.streams) }} streams</p>
          </NuxtLink>
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
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-violet-400" />
          Top Artists
        </h2>

        <div v-if="charts.artists.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink
            v-for="(artist, index) in charts.artists.slice(0, 12)"
            :key="artist.id"
            :to="`/${artist.slug}`"
            class="group text-center"
          >
            <!-- Avatar with rank -->
            <div class="relative inline-block mb-3">
              <div class="w-24 h-24 mx-auto rounded-full overflow-hidden bg-zinc-800 shadow-lg group-hover:shadow-xl group-hover:ring-2 group-hover:ring-violet-500/50 transition-all">
                <img
                  v-if="artistAvatars[artist.id]"
                  :src="artistAvatars[artist.id]"
                  :alt="artist.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                  :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
                >
                  <span class="text-3xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
                </div>
              </div>
              <!-- Rank badge -->
              <div
                class="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                :class="index < 3 ? 'bg-violet-500 text-white' : 'bg-zinc-700 text-zinc-300'"
              >
                {{ index + 1 }}
              </div>
            </div>

            <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
              {{ artist.name }}
            </p>
            <p class="text-xs text-zinc-500">{{ formatNumber(artist.streams) }} streams</p>
          </NuxtLink>
        </div>

        <EmptyState
          v-else
          icon="i-heroicons-user-group"
          title="No Data Yet"
          description="Not enough streams to show artist charts"
          class="py-8"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
const { getStreamUrl } = useAlbum()
const { playTrack: playFromPlayer, setQueue } = usePlayer()

const loading = ref(true)
const selectedPeriod = ref('7d')

const periodOptions = [
  { label: 'This Week', value: '7d' },
  { label: 'This Month', value: '30d' },
  { label: 'All Time', value: 'all' },
]

interface ChartData {
  tracks: any[]
  albums: any[]
  artists: any[]
}

const charts = ref<ChartData>({
  tracks: [],
  albums: [],
  artists: [],
})

const trackCovers = ref<Record<string, string>>({})
const albumCovers = ref<Record<string, string>>({})
const artistAvatars = ref<Record<string, string>>({})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const loadCharts = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/charts/trending', {
      query: { period: selectedPeriod.value, limit: 20 },
    })

    charts.value = data as ChartData

    // Load cover images for tracks
    for (const track of charts.value.tracks) {
      if (track.album?.cover_key && !trackCovers.value[track.id]) {
        try {
          trackCovers.value[track.id] = await getStreamUrl(track.album.cover_key)
        } catch (e) {
          console.error('Failed to load track cover:', e)
        }
      }
    }

    // Load cover images for albums
    for (const album of charts.value.albums) {
      if (album.cover_key && !albumCovers.value[album.id]) {
        try {
          albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
        } catch (e) {
          console.error('Failed to load album cover:', e)
        }
      }
    }

    // Load avatars for artists
    for (const artist of charts.value.artists) {
      if (artist.avatar_key && !artistAvatars.value[artist.id]) {
        try {
          artistAvatars.value[artist.id] = await getStreamUrl(artist.avatar_key)
        } catch (e) {
          console.error('Failed to load artist avatar:', e)
        }
      }
    }
  } catch (e) {
    console.error('Failed to load charts:', e)
  } finally {
    loading.value = false
  }
}

const playTrack = async (track: any) => {
  // Create queue from top tracks
  const queue = charts.value.tracks.map(t => ({
    id: t.id,
    title: t.title,
    artist: t.album?.band?.name || 'Unknown Artist',
    artistSlug: t.album?.band?.slug || '',
    albumTitle: t.album?.title || '',
    albumSlug: t.album?.slug || '',
    coverUrl: trackCovers.value[t.id] || null,
    duration: t.duration || 0,
    audioKey: '', // Will be loaded by player
  }))

  const trackIndex = charts.value.tracks.findIndex(t => t.id === track.id)
  setQueue(queue, trackIndex >= 0 ? trackIndex : 0)
}

onMounted(loadCharts)

useHead({
  title: 'Charts - Fairstream',
})
</script>
