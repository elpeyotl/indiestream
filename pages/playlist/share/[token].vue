<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <!-- Not Found -->
    <div v-else-if="!playlist" class="text-center py-20">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-zinc-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">Playlist not found</h2>
      <p class="text-zinc-400 mb-6">This playlist may have been deleted or is no longer public.</p>
      <UButton color="violet" to="/discover">Discover Music</UButton>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <!-- Playlist Cover -->
        <div class="w-48 h-48 md:w-56 md:h-56 shrink-0 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-xl mx-auto md:mx-0">
          <UIcon name="i-heroicons-musical-note" class="w-20 h-20 text-white/50" />
        </div>

        <!-- Info -->
        <div class="flex-1 flex flex-col justify-end text-center md:text-left">
          <div class="flex items-center gap-2 justify-center md:justify-start mb-2">
            <span class="text-sm text-zinc-400 uppercase tracking-wider">Shared Playlist</span>
            <UBadge color="green" variant="soft" size="xs">Public</UBadge>
          </div>

          <h1 class="text-3xl md:text-4xl font-bold text-zinc-100 mb-2">{{ playlist.title }}</h1>

          <p v-if="playlist.description" class="text-zinc-400 mb-4">{{ playlist.description }}</p>

          <div class="flex items-center gap-4 text-sm text-zinc-400 justify-center md:justify-start">
            <span v-if="playlist.owner" class="flex items-center gap-2">
              <span>by {{ playlist.owner.display_name }}</span>
            </span>
            <span>{{ playlist.track_count }} {{ playlist.track_count === 1 ? 'track' : 'tracks' }}</span>
            <span v-if="totalDuration">{{ formatTotalDuration(totalDuration) }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 mt-6 justify-center md:justify-start">
            <UButton
              v-if="playlist.playlist_tracks?.length > 0"
              color="violet"
              size="lg"
              :loading="loadingPlay"
              @click="playAll"
            >
              <UIcon name="i-heroicons-play" class="w-5 h-5 mr-1" />
              Play All
            </UButton>

            <UButton
              color="gray"
              variant="ghost"
              @click="copyShareUrl"
            >
              <UIcon name="i-heroicons-share" class="w-4 h-4 mr-1" />
              Share
            </UButton>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="playlist.playlist_tracks?.length === 0" class="text-center py-16 bg-zinc-900/30 rounded-lg">
        <UIcon name="i-heroicons-musical-note" class="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-zinc-100 mb-2">This playlist is empty</h3>
      </div>

      <!-- Track List -->
      <div v-else class="space-y-1">
        <div
          v-for="(item, index) in playlist.playlist_tracks"
          :key="item.id"
          class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
        >
          <!-- Index / Play -->
          <div class="w-8 text-center shrink-0">
            <UIcon
              v-if="loadingTrackIndex === index"
              name="i-heroicons-arrow-path"
              class="w-4 h-4 text-violet-400 animate-spin"
            />
            <template v-else>
              <span class="text-sm text-zinc-500 group-hover:hidden">{{ index + 1 }}</span>
              <UIcon
                name="i-heroicons-play"
                class="w-4 h-4 text-zinc-100 hidden group-hover:inline cursor-pointer"
                @click.stop="playFromIndex(index)"
              />
            </template>
          </div>

          <!-- Cover -->
          <div class="w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
            <img
              v-if="trackCovers[item.track.id]"
              :src="trackCovers[item.track.id]"
              :alt="item.track.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
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
        </div>
      </div>

      <!-- Sign Up CTA -->
      <div v-if="!user" class="mt-8 p-6 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-lg text-center">
        <h3 class="text-lg font-semibold text-zinc-100 mb-2">Like what you hear?</h3>
        <p class="text-zinc-400 mb-4">Sign up to create your own playlists and support artists directly.</p>
        <UButton color="violet" to="/register">Get Started</UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { PlaylistWithTracks } from '~/stores/playlist'

const route = useRoute()
const toast = useToast()
const user = useSupabaseUser()
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore
const playlistStore = usePlaylistStore()
const { getSharedPlaylist } = playlistStore
const playerStore = usePlayerStore()
const { isLoading: playerLoading } = storeToRefs(playerStore)
const { playPlaylist } = playerStore

const token = route.params.token as string

const loading = ref(true)
const playlist = ref<(PlaylistWithTracks & { owner?: { id: string; display_name: string } }) | null>(null)
const trackCovers = ref<Record<string, string>>({})
const loadingPlay = ref(false)
const loadingTrackIndex = ref<number | null>(null)

const totalDuration = computed(() => {
  if (!playlist.value?.playlist_tracks) return 0
  return playlist.value.playlist_tracks.reduce(
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

const loadPlaylist = async () => {
  loading.value = true
  try {
    playlist.value = await getSharedPlaylist(token)
    if (playlist.value) {
      await loadTrackCovers()
    }
  } catch (e) {
    console.error('Failed to load playlist:', e)
  } finally {
    loading.value = false
  }
}

const loadTrackCovers = async () => {
  if (!playlist.value?.playlist_tracks) return

  for (const item of playlist.value.playlist_tracks) {
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

const playAll = async () => {
  if (!playlist.value?.playlist_tracks || loadingPlay.value) return
  loadingPlay.value = true
  try {
    const tracks = playlist.value.playlist_tracks.map((item) => ({
      ...item.track,
      coverUrl: trackCovers.value[item.track.id] || null,
    }))
    await playPlaylist(tracks, 0)
  } finally {
    loadingPlay.value = false
  }
}

const playFromIndex = async (index: number) => {
  if (!playlist.value?.playlist_tracks || loadingTrackIndex.value !== null) return
  loadingTrackIndex.value = index
  try {
    const tracks = playlist.value.playlist_tracks.map((item) => ({
      ...item.track,
      coverUrl: trackCovers.value[item.track.id] || null,
    }))
    await playPlaylist(tracks, index)
  } finally {
    loadingTrackIndex.value = null
  }
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.add({ title: 'Link copied!', color: 'green' })
  } catch (e) {
    toast.add({ title: 'Failed to copy', color: 'red' })
  }
}

onMounted(() => {
  loadPlaylist()
})
</script>
