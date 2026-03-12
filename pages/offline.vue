<template>
  <div class="min-h-screen bg-zinc-950 text-white">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Offline header -->
      <div class="flex items-center gap-3 mb-8">
        <UIcon name="i-heroicons-cloud-arrow-down" class="w-8 h-8 text-violet-400" />
        <div>
          <h1 class="text-2xl font-bold">Your Downloads</h1>
          <p class="text-zinc-400 text-sm">You're offline — playing from your saved music.</p>
        </div>
      </div>

      <!-- Storage info -->
      <OfflineStorageBar v-if="offlineAlbumsArray.length > 0" class="mb-6" />

      <!-- Loading state -->
      <div v-if="!offlineStore.initialized" class="text-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-500 animate-spin mx-auto" />
        <p class="text-zinc-500 mt-3">Loading your offline library...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="offlineAlbumsArray.length === 0" class="text-center py-16">
        <UIcon name="i-heroicons-cloud-arrow-down" class="w-16 h-16 text-zinc-700 mx-auto" />
        <h2 class="text-xl font-semibold text-zinc-400 mt-4">No offline downloads</h2>
        <p class="text-zinc-500 mt-2">Save albums for offline listening while you have internet.</p>
      </div>

      <!-- Album grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div
          v-for="album in offlineAlbumsArray"
          :key="album.albumId"
          class="group cursor-pointer"
          @click="playOfflineAlbum(album)"
        >
          <!-- Cover image -->
          <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2 relative">
            <img
              v-if="albumCovers[album.albumId]"
              :src="albumCovers[album.albumId]"
              :alt="album.title"
              class="w-full h-full object-cover"
            >
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
            </div>

            <!-- Play overlay -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <UIcon name="i-heroicons-play" class="w-12 h-12 text-white" />
            </div>

            <!-- Status badge -->
            <div
              v-if="album.status !== 'complete'"
              class="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-amber-500/20 text-amber-400': album.status === 'partial',
                'bg-red-500/20 text-red-400': album.status === 'error',
                'bg-violet-500/20 text-violet-400': album.status === 'downloading',
              }"
            >
              {{ album.status === 'downloading' ? `${album.cachedTracks}/${album.totalTracks}` : album.status }}
            </div>
          </div>

          <!-- Info -->
          <h3 class="text-sm font-medium truncate">{{ album.title }}</h3>
          <p class="text-xs text-zinc-400 truncate">{{ album.artistName }}</p>
          <p class="text-xs text-zinc-500">{{ album.totalTracks }} tracks</p>
        </div>
      </div>
    </div>

    <!-- Audio Player will render from layout -->
  </div>
</template>

<script setup lang="ts">
import type { OfflineAlbum } from '~/utils/offlineDb'

definePageMeta({
  layout: 'default',
})

const offlineStore = useOfflineStore()
const playerStore = usePlayerStore()

// Initialize offline store on mount
onMounted(async () => {
  await offlineStore.init()
  // Load cover images from IndexedDB
  await loadAlbumCovers()
})

const offlineAlbumsArray = computed(() =>
  Array.from(offlineStore.offlineAlbums.values()).filter(a => a.status === 'complete' || a.status === 'partial'),
)

const albumCovers = ref<Record<string, string>>({})

const loadAlbumCovers = async () => {
  for (const album of offlineAlbumsArray.value) {
    if (album.coverKey) {
      const blobUrl = await offlineStore.getOfflineCoverBlobUrl(album.coverKey)
      if (blobUrl) {
        albumCovers.value[album.albumId] = blobUrl
      }
    }
  }
}

const playOfflineAlbum = async (album: OfflineAlbum) => {
  // Get tracks for this album from offline store
  const tracks = Array.from(offlineStore.offlineTracks.values())
    .filter(t => t.albumId === album.albumId)
    .sort((a, b) => a.trackNumber - b.trackNumber)

  if (tracks.length === 0) return

  // Build cover URL
  const coverUrl = albumCovers.value[album.albumId] || null

  // Build player queue from offline track metadata
  const playerTracks = tracks.map(track => ({
    id: track.trackId,
    title: track.title,
    artist: track.artist,
    artistSlug: track.artistSlug,
    albumTitle: track.albumTitle,
    albumSlug: track.albumSlug,
    coverUrl,
    audioKey: track.audioKey,
    duration: track.duration,
  }))

  // Set queue and play first track
  playerStore.setQueue(playerTracks, 0)
}
</script>
