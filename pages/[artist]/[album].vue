<template>
  <div v-if="album && band">
    <!-- Album Header -->
    <div class="container mx-auto px-4 py-12">
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Cover Art -->
        <div class="w-full md:w-80 shrink-0">
          <div class="aspect-square rounded-xl overflow-hidden shadow-2xl bg-zinc-800">
            <img
              v-if="coverUrl"
              :src="coverUrl"
              :alt="album.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-20 h-20 text-zinc-600" />
            </div>
          </div>
        </div>

        <!-- Album Info -->
        <div class="flex-1">
          <p class="text-sm text-zinc-400 uppercase tracking-wider mb-2">
            {{ releaseTypeLabel }}
          </p>
          <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-4">
            {{ album.title }}
          </h1>

          <NuxtLink
            :to="`/${band.slug}`"
            class="inline-flex items-center gap-2 text-lg text-violet-400 hover:text-violet-300 mb-6"
          >
            {{ band.name }}
            <UIcon v-if="band.is_verified" name="i-heroicons-check-badge" class="w-5 h-5" />
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6">
            <span v-if="album.release_date" class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              {{ formatDate(album.release_date) }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-musical-note" class="w-4 h-4" />
              {{ album.tracks?.length || 0 }} tracks
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              {{ formatDuration(album.total_duration_seconds) }}
            </span>
          </div>

          <p v-if="album.description" class="text-zinc-300 mb-8 max-w-xl">
            {{ album.description }}
          </p>

          <!-- Actions -->
          <div class="flex gap-3">
            <UButton color="violet" size="lg" @click="playAll">
              <UIcon name="i-heroicons-play" class="w-5 h-5 mr-1" />
              Play All
            </UButton>
            <UButton color="gray" variant="outline" size="lg">
              <UIcon name="i-heroicons-heart" class="w-5 h-5 mr-1" />
              Save
            </UButton>
            <UButton color="gray" variant="ghost" size="lg">
              <UIcon name="i-heroicons-share" class="w-5 h-5" />
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Track List -->
    <div class="container mx-auto px-4 pb-12">
      <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-zinc-800">
            <tr class="text-left text-sm text-zinc-400">
              <th class="px-4 py-3 w-12">#</th>
              <th class="px-4 py-3">Title</th>
              <th class="px-4 py-3 w-24 hidden sm:table-cell">Plays</th>
              <th class="px-4 py-3 w-20 text-right">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="track in album.tracks"
              :key="track.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
              :class="{ 'bg-violet-500/10': isTrackPlaying(track) }"
              @click="playTrack(track)"
            >
              <td class="px-4 py-4">
                <span v-if="isTrackPlaying(track)" class="text-violet-400">
                  <UIcon name="i-heroicons-speaker-wave" class="w-4 h-4 animate-pulse" />
                </span>
                <template v-else>
                  <span class="text-zinc-400 group-hover:hidden">{{ track.track_number }}</span>
                  <UIcon name="i-heroicons-play" class="w-4 h-4 text-violet-400 hidden group-hover:block" />
                </template>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div>
                    <p class="font-medium" :class="isTrackPlaying(track) ? 'text-violet-400' : 'text-zinc-100'">
                      {{ track.title }}
                    </p>
                    <div v-if="track.is_explicit" class="mt-1">
                      <UBadge color="gray" size="xs">E</UBadge>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-zinc-400 hidden sm:table-cell">
                {{ formatNumber(track.stream_count || 0) }}
              </td>
              <td class="px-4 py-4 text-zinc-400 text-right">
                {{ formatTrackDuration(track.duration_seconds) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- More from Artist -->
    <div v-if="otherAlbums.length > 0" class="container mx-auto px-4 pb-12">
      <h2 class="text-xl font-semibold text-zinc-100 mb-6">More from {{ band.name }}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <NuxtLink
          v-for="otherAlbum in otherAlbums"
          :key="otherAlbum.id"
          :to="`/${band.slug}/${otherAlbum.slug}`"
          class="group"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2">
            <div class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-zinc-600" />
            </div>
          </div>
          <p class="text-sm font-medium text-zinc-100 truncate group-hover:text-violet-400">
            {{ otherAlbum.title }}
          </p>
          <p class="text-xs text-zinc-400">
            {{ otherAlbum.release_type }}
          </p>
        </NuxtLink>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="min-h-screen flex items-center justify-center">
    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
  </div>

  <!-- Not Found -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
        <UIcon name="i-heroicons-musical-note" class="w-10 h-10 text-zinc-500" />
      </div>
      <h1 class="text-2xl font-bold text-zinc-100 mb-2">Album Not Found</h1>
      <p class="text-zinc-400 mb-6">This album doesn't exist or has been removed.</p>
      <UButton color="violet" to="/">
        Back to Home
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Album, Track } from '~/composables/useAlbum'

const route = useRoute()
const { getAlbumBySlug, getBandAlbums, getStreamUrl } = useAlbum()
const { getBandBySlug } = useBand()
const { playAlbum, playTrack: playerPlayTrack, currentTrack, isPlaying } = usePlayer()

const album = ref<Album | null>(null)
const band = ref<any>(null)
const otherAlbums = ref<Album[]>([])
const loading = ref(true)
const coverUrl = ref<string | null>(null)

const releaseTypeLabel = computed(() => {
  const types: Record<string, string> = {
    album: 'Album',
    ep: 'EP',
    single: 'Single',
  }
  return types[album.value?.release_type || 'album'] || 'Album'
})

// Format helpers
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }
  return `${minutes} min`
}

const formatTrackDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Player actions
const playAll = () => {
  if (!album.value) return
  playAlbum(album.value, coverUrl.value, 0)
}

const playTrack = (track: Track) => {
  if (!album.value) return
  // Find track index
  const index = album.value.tracks?.findIndex(t => t.id === track.id) || 0
  playAlbum(album.value, coverUrl.value, index)
}

// Check if track is currently playing
const isTrackPlaying = (track: Track) => {
  return currentTrack.value?.id === track.id && isPlaying.value
}

// Set page meta
useHead(() => ({
  title: album.value && band.value
    ? `${album.value.title} by ${band.value.name} | Indiestream`
    : 'Album | Indiestream',
  meta: [
    {
      name: 'description',
      content: album.value?.description || `Listen to ${album.value?.title || 'this album'} on Indiestream`,
    },
  ],
}))

onMounted(async () => {
  try {
    const artistSlug = route.params.artist as string
    const albumSlug = route.params.album as string

    // Load band
    band.value = await getBandBySlug(artistSlug)
    if (!band.value) {
      loading.value = false
      return
    }

    // Load album
    album.value = await getAlbumBySlug(artistSlug, albumSlug)
    if (!album.value) {
      loading.value = false
      return
    }

    // Load cover URL if exists (use cover_key if available, otherwise use cover_url)
    if (album.value.cover_key) {
      coverUrl.value = await getStreamUrl(album.value.cover_key)
    } else if (album.value.cover_url) {
      coverUrl.value = album.value.cover_url
    }

    // Load other albums from same artist
    const allAlbums = await getBandAlbums(band.value.id)
    otherAlbums.value = allAlbums.filter(a => a.id !== album.value?.id).slice(0, 6)

  } catch (e) {
    console.error('Failed to load album:', e)
  } finally {
    loading.value = false
  }
})
</script>
