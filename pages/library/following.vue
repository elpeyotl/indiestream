<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink
        to="/library"
        class="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1 mb-2"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Library
      </NuxtLink>
      <h1 class="text-3xl font-bold text-zinc-100">New From Your Artists</h1>
      <p class="text-zinc-400 mt-1">
        Latest releases from artists you follow
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-8">
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <div v-for="i in 10" :key="i">
          <USkeleton class="aspect-square rounded-lg mb-3" />
          <USkeleton class="h-4 w-3/4 mb-2" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </div>
    </div>

    <!-- Not Following Anyone -->
    <EmptyState
      v-else-if="followedArtists.length === 0"
      icon="i-heroicons-user-group"
      title="Not following anyone yet"
      description="Follow artists to see their latest releases here. You'll be notified when they drop new music."
      action-label="Discover Artists"
      action-to="/discover"
    />

    <!-- No New Releases -->
    <EmptyState
      v-else-if="newReleases.length === 0"
      icon="i-heroicons-musical-note"
      title="No new releases"
      description="Your followed artists haven't released anything in the last 30 days. Check back soon!"
    />

    <!-- Releases List -->
    <div v-else>
      <!-- Stats -->
      <div class="flex items-center gap-4 mb-6 text-sm text-zinc-400">
        <span>
          <strong class="text-zinc-100">{{ followedArtists.length }}</strong>
          artists followed
        </span>
        <span>
          <strong class="text-zinc-100">{{ newReleases.length }}</strong>
          new releases
        </span>
      </div>

      <!-- Albums Grid -->
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <div v-for="album in newReleases" :key="album.id">
          <AlbumCard
            :album="album"
            :cover-url="albumCovers[album.id]"
            :loading="loadingPlayId === album.id"
            @play="playAlbum"
          />
          <p v-if="album.created_at" class="text-xs text-zinc-500 mt-1">
            {{ formatTimeAgo(album.created_at) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Following Section -->
    <section v-if="followedArtists.length > 0" class="mt-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Artists You Follow</h2>
        <NuxtLink
          to="/library?tab=artists"
          class="text-sm text-violet-400 hover:text-violet-300"
        >
          View all
        </NuxtLink>
      </div>

      <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
        <NuxtLink
          v-for="item in followedArtists.slice(0, 10)"
          :key="item.band.id"
          :to="`/${item.band.slug}`"
          class="flex-shrink-0 snap-start text-center group"
        >
          <div
            class="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 mb-2 ring-2 ring-transparent group-hover:ring-violet-500/50 transition-all"
          >
            <img
              v-if="artistAvatars[item.band.id]"
              :src="artistAvatars[item.band.id]"
              :alt="item.band.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600"
            >
              <span class="text-xl font-bold text-white">{{
                item.band.name.charAt(0).toUpperCase()
              }}</span>
            </div>
          </div>
          <p
            class="text-xs text-zinc-300 truncate w-20 group-hover:text-violet-400 transition-colors"
          >
            {{ item.band.name }}
          </p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { FollowedArtist } from '~/stores/library'

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

definePageMeta({
  middleware: 'auth',
})

const libraryStore = useLibraryStore()
const { getFollowedArtists } = libraryStore
const albumStore = useAlbumStore()
const { getCachedCoverUrl, getAlbumById } = albumStore
const playerStore = usePlayerStore()

const loading = ref(true)
const followedArtists = ref<FollowedArtist[]>([])
const newReleases = ref<Album[]>([])
const albumCovers = ref<Record<string, string>>({})
const artistAvatars = ref<Record<string, string>>({})
const loadingPlayId = ref<string | null>(null)

// Load data
onMounted(async () => {
  loading.value = true
  try {
    // Get followed artists
    followedArtists.value = await getFollowedArtists()

    // Load artist avatars
    for (const item of followedArtists.value) {
      if (item.band.avatar_key) {
        const url = await getCachedCoverUrl(item.band.avatar_key)
        if (url) artistAvatars.value[item.band.id] = url
      } else if (item.band.avatar_url) {
        artistAvatars.value[item.band.id] = item.band.avatar_url
      }
    }

    // Get new releases from followed artists
    if (followedArtists.value.length > 0) {
      try {
        const result = await $fetch<{ albums: Album[] }>(
          '/api/user/feed/new-releases',
        )
        newReleases.value = result.albums || []

        // Load album covers
        for (const album of newReleases.value) {
          if (album.cover_key && !albumCovers.value[album.id]) {
            const url = await getCachedCoverUrl(album.cover_key)
            if (url) albumCovers.value[album.id] = url
          } else if (album.cover_url && !albumCovers.value[album.id]) {
            albumCovers.value[album.id] = album.cover_url
          }
        }
      } catch (e) {
        console.error('Failed to load new releases:', e)
      }
    }
  } finally {
    loading.value = false
  }
})

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
  title: 'New From Your Artists | Fairtune',
  meta: [
    {
      name: 'description',
      content: 'See the latest releases from artists you follow on Fairtune.',
    },
  ],
})
</script>
