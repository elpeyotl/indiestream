<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-8 border-b-2 border-zinc-800 pb-6">
      <h1 class="text-3xl font-black uppercase tracking-tighter text-white">NEW RELEASES</h1>
      <p class="text-zinc-400 font-mono text-sm mt-1">
        Fresh music, chronologically. No algorithm.
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="pending && albums.length === 0"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    >
      <div v-for="i in 20" :key="i">
        <div class="aspect-square bg-zinc-900 border-2 border-zinc-800 mb-3" />
        <div class="h-4 w-3/4 bg-zinc-800 mb-2" />
        <div class="h-3 w-1/2 bg-zinc-800" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="albums.length === 0" class="text-center py-20 bg-zinc-950 border-2 border-zinc-800">
      <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
        <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-fuchsia-500" />
      </div>
      <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-2">NO NEW RELEASES</h2>
      <p class="text-zinc-400 font-mono text-sm">Check back soon for fresh music from independent artists.</p>
    </div>

    <!-- Albums Grid -->
    <div v-else>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <div v-for="album in albums" :key="album.id">
          <AlbumCard
            :album="album"
            :cover-url="albumCovers[album.id]"
            :loading="loadingPlayId === album.id"
            @play="playAlbum"
          />
          <p v-if="album.created_at" class="text-xs text-zinc-500 font-mono mt-1">
            {{ formatTimeAgo(album.created_at) }}
          </p>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="flex justify-center mt-8">
        <button
          class="px-6 py-3 border-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight rounded-none hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist'
})

interface Album {
  id: string
  title: string
  slug: string
  cover_key?: string | null
  cover_url?: string | null
  release_type?: string
  created_at?: string
  band?: {
    id?: string
    name: string
    slug: string
  }
}

const albumStore = useAlbumStore()
const { getCachedCoverUrl, getAlbumById } = albumStore
const playerStore = usePlayerStore()

const albumCovers = ref<Record<string, string>>({})
const loadingPlayId = ref<string | null>(null)
const loadingMore = ref(false)
const offset = ref(0)
const limit = 20

// Fetch releases
const { data, pending } = await useLazyAsyncData(
  'new-releases-page',
  () => $fetch<{ albums: Album[]; total: number; hasMore: boolean }>(
    '/api/releases/recent',
    { query: { limit, offset: 0, days: 90 } }
  ),
)

const albums = ref<Album[]>([])
const hasMore = ref(false)

// Update albums when data changes
watch(data, (newData) => {
  if (newData) {
    albums.value = newData.albums
    hasMore.value = newData.hasMore
    offset.value = newData.albums.length
    loadAlbumCovers(newData.albums)
  }
}, { immediate: true })

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const result = await $fetch<{ albums: Album[]; hasMore: boolean }>(
      '/api/releases/recent',
      { query: { limit, offset: offset.value, days: 90 } }
    )
    albums.value = [...albums.value, ...result.albums]
    hasMore.value = result.hasMore
    offset.value += result.albums.length
    loadAlbumCovers(result.albums)
  } finally {
    loadingMore.value = false
  }
}

const loadAlbumCovers = async (albumList: Album[]) => {
  for (const album of albumList) {
    if (album.cover_key && !albumCovers.value[album.id]) {
      const url = await getCachedCoverUrl(album.cover_key)
      if (url) albumCovers.value[album.id] = url
    } else if (album.cover_url && !albumCovers.value[album.id]) {
      albumCovers.value[album.id] = album.cover_url
    }
  }
}

const playAlbum = async (album: Album) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = album.id
  try {
    const fullAlbum = await getAlbumById(album.id)
    if (fullAlbum) {
      await playerStore.playAlbum(
        fullAlbum,
        albumCovers.value[album.id] || null,
        0,
      )
    }
  } finally {
    loadingPlayId.value = null
  }
}

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
}

// SEO
useHead({
  title: 'New Releases | Fairtune',
  meta: [
    {
      name: 'description',
      content: 'Discover the latest music releases from independent artists on Fairtune. Pure chronological feed, no algorithm.',
    },
  ],
})
</script>
