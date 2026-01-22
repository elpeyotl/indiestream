<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <!-- Liked Songs Cover -->
        <div class="w-48 h-48 md:w-56 md:h-56 shrink-0 mx-auto md:mx-0">
          <div class="w-full h-full rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 flex items-center justify-center shadow-xl">
            <UIcon name="i-heroicons-heart-solid" class="w-24 h-24 text-white" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 flex flex-col justify-end text-center md:text-left">
          <span class="text-sm text-zinc-400 uppercase tracking-wider mb-2">Playlist</span>

          <h1 class="text-3xl md:text-4xl font-bold text-zinc-100 mb-2">Liked Songs</h1>

          <p class="text-zinc-400 mb-4">All your favorited tracks in one place</p>

          <div class="flex items-center gap-4 text-sm text-zinc-400 justify-center md:justify-start">
            <span>{{ tracks.length }} {{ tracks.length === 1 ? 'track' : 'tracks' }}</span>
            <span v-if="totalDuration">{{ formatTotalDuration(totalDuration) }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 mt-6 justify-center md:justify-start">
            <UButton
              v-if="tracks.length > 0"
              color="violet"
              size="lg"
              @click="playAll"
            >
              <UIcon name="i-heroicons-play" class="w-5 h-5 mr-1" />
              Play All
            </UButton>

            <UButton
              v-if="tracks.length > 0"
              color="gray"
              variant="outline"
              @click="shufflePlay"
            >
              <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 mr-1" />
              Shuffle
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="tracks.length === 0" class="text-center py-16 bg-zinc-900/30 rounded-lg">
        <UIcon name="i-heroicons-heart" class="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-zinc-100 mb-2">No liked songs yet</h3>
        <p class="text-zinc-400 mb-4">
          Like songs by clicking the heart icon while browsing or playing music.
        </p>
        <UButton color="violet" to="/discover">
          Discover Music
        </UButton>
      </div>

      <!-- Track List -->
      <div v-else class="space-y-1">
        <div
          v-for="(item, index) in tracks"
          :key="item.track.id"
          class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
        >
          <!-- Index -->
          <div class="w-8 text-center shrink-0 flex items-center justify-center">
            <span class="text-sm text-zinc-500 group-hover:hidden">{{ index + 1 }}</span>
            <UIcon
              name="i-heroicons-play"
              class="w-4 h-4 text-zinc-100 hidden group-hover:block cursor-pointer"
              @click.stop="playFromIndex(index)"
            />
          </div>

          <!-- Cover (clickable to play) -->
          <div
            class="w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden relative cursor-pointer group/cover"
            @click.stop="playFromIndex(index)"
          >
            <img
              v-if="trackCovers[item.track.id]"
              :src="trackCovers[item.track.id]"
              :alt="item.track.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
            </div>
            <!-- Play overlay on hover -->
            <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
              <UIcon name="i-heroicons-play" class="w-5 h-5 text-white" />
            </div>
          </div>

          <!-- Track Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-zinc-100 truncate">{{ item.track.title }}</p>
            <NuxtLink
              :to="`/${item.track.album.band.slug}`"
              class="text-sm text-zinc-400 hover:text-violet-400 truncate block"
              @click.stop
            >
              {{ item.track.album.band.name }}
            </NuxtLink>
          </div>

          <!-- Album -->
          <NuxtLink
            :to="`/${item.track.album.band.slug}/${item.track.album.slug}`"
            class="hidden md:block text-sm text-zinc-500 hover:text-zinc-300 truncate max-w-[200px]"
            @click.stop
          >
            {{ item.track.album.title }}
          </NuxtLink>

          <!-- Duration -->
          <span class="text-sm text-zinc-500 w-12 text-right">
            {{ formatDuration(item.track.duration_seconds) }}
          </span>

          <!-- Add to playlist -->
          <AddToPlaylistMenu
            :track-id="item.track.id"
            :track-title="item.track.title"
            class="opacity-0 group-hover:opacity-60"
          />

          <!-- Unlike button -->
          <UButton
            color="red"
            variant="ghost"
            size="xs"
            icon="i-heroicons-heart-solid"
            class="opacity-60 hover:opacity-100"
            @click.stop="handleUnlike(item.track.id)"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LikedTrack } from '~/stores/library'

definePageMeta({
  middleware: 'auth',
})

const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore
const libraryStore = useLibraryStore()
const { getLikedTracks, unlikeTrack } = libraryStore
const playerStore = usePlayerStore()
const { playPlaylist } = playerStore

const loading = ref(true)
const tracks = ref<LikedTrack[]>([])
const trackCovers = ref<Record<string, string>>({})

const totalDuration = computed(() => {
  return tracks.value.reduce(
    (sum, item) => sum + (item.track.duration_seconds || 0),
    0
  )
})

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTotalDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hr ${mins} min`
  }
  return `${mins} min`
}

const loadLikedTracks = async () => {
  loading.value = true
  try {
    tracks.value = await getLikedTracks()
    await loadTrackCovers()
  } catch (e) {
    console.error('Failed to load liked tracks:', e)
  } finally {
    loading.value = false
  }
}

const loadTrackCovers = async () => {
  for (const item of tracks.value) {
    if (item.track.album.cover_key) {
      try {
        trackCovers.value[item.track.id] = await getStreamUrl(item.track.album.cover_key)
      } catch (e) {
        console.error('Failed to load cover:', e)
      }
    } else if (item.track.album.cover_url) {
      trackCovers.value[item.track.id] = item.track.album.cover_url
    }
  }
}

const playAll = () => {
  if (tracks.value.length === 0) return
  const playableTracks = tracks.value.map((item) => ({
    ...item.track,
    coverUrl: trackCovers.value[item.track.id] || null,
  }))
  playPlaylist(playableTracks, 0)
}

const shufflePlay = () => {
  if (tracks.value.length === 0) return
  const playableTracks = tracks.value.map((item) => ({
    ...item.track,
    coverUrl: trackCovers.value[item.track.id] || null,
  }))
  // Shuffle the array
  const shuffled = [...playableTracks].sort(() => Math.random() - 0.5)
  playPlaylist(shuffled, 0)
}

const playFromIndex = (index: number) => {
  if (tracks.value.length === 0) return
  const playableTracks = tracks.value.map((item) => ({
    ...item.track,
    coverUrl: trackCovers.value[item.track.id] || null,
  }))
  playPlaylist(playableTracks, index)
}

const handleUnlike = async (trackId: string) => {
  await unlikeTrack(trackId)
  tracks.value = tracks.value.filter(t => t.track.id !== trackId)
}

onMounted(() => {
  loadLikedTracks()
})
</script>
