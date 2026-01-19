<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Discover</h1>
      <p class="text-zinc-400">Find your next favorite artist</p>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="loading" class="space-y-12">
      <!-- Featured Artists Skeleton -->
      <section>
        <div class="h-7 w-48 skeleton mb-4"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="i in 6" :key="`featured-${i}`" class="space-y-2">
            <div class="w-full pb-[100%] relative">
              <div class="absolute inset-0 rounded-lg skeleton"></div>
            </div>
            <div class="h-5 skeleton w-3/4"></div>
            <div class="h-4 skeleton w-1/2"></div>
          </div>
        </div>
      </section>

      <!-- New Releases Skeleton -->
      <section>
        <div class="h-7 w-48 skeleton mb-4"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div v-for="i in 5" :key="`release-${i}`" class="space-y-2">
            <div class="w-full pb-[100%] relative">
              <div class="absolute inset-0 rounded-lg skeleton"></div>
            </div>
            <div class="h-5 skeleton w-full"></div>
            <div class="h-4 skeleton w-2/3"></div>
          </div>
        </div>
      </section>
    </div>

    <template v-else>
      <!-- Featured Artists -->
      <section v-if="featuredArtists.length > 0" class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-zinc-100">Featured Artists</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink
            v-for="artist in featuredArtists"
            :key="artist.id"
            :to="`/${artist.slug}`"
            class="group card-interactive"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300">
              <img
                v-if="artist.avatar_url"
                v-fade-image
                :src="artist.avatar_url"
                :alt="artist.name"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div
                v-else
                class="absolute inset-0 w-full h-full flex items-center justify-center"
                :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
              >
                <span class="text-4xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
              </div>
            </div>
            <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ artist.name }}</p>
            <p class="text-sm text-zinc-500">Artist</p>
          </NuxtLink>
        </div>
      </section>

      <!-- New Releases -->
      <section v-if="newReleases.length > 0" class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-zinc-100">New Releases</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <NuxtLink
            v-for="album in newReleases"
            :key="album.id"
            :to="`/${album.band?.slug}/${album.slug}`"
            class="group card-interactive"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300">
              <div class="absolute inset-0">
                <img
                  v-if="albumCovers[album.id]"
                  v-fade-image
                  :src="albumCovers[album.id]"
                  :alt="album.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
                </div>
              </div>
            </div>
            <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ album.title }}</p>
            <p class="text-sm text-zinc-400 truncate">{{ album.band?.name }}</p>
            <p class="text-xs text-zinc-500">
              {{ album.release_type === 'ep' ? 'EP' : album.release_type === 'single' ? 'Single' : 'Album' }}
            </p>
          </NuxtLink>
        </div>
      </section>

      <!-- Featured Playlists -->
      <section v-if="featuredPlaylists.length > 0" class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <UIcon name="i-heroicons-star" class="w-5 h-5 text-violet-400" />
            Featured Playlists
          </h2>
          <NuxtLink to="/playlists" class="text-sm text-violet-400 hover:text-violet-300">
            View All
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <NuxtLink
            v-for="playlist in featuredPlaylists"
            :key="playlist.id"
            :to="`/playlists/${playlist.id}`"
            class="group card-interactive"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300">
              <div class="absolute inset-0">
                <img
                  v-if="playlistCovers[playlist.id]"
                  v-fade-image
                  :src="playlistCovers[playlist.id]"
                  :alt="playlist.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                  <UIcon name="i-heroicons-queue-list" class="w-12 h-12 text-violet-400" />
                </div>
              </div>
            </div>
            <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ playlist.title }}</p>
            <p class="text-sm text-zinc-400 truncate">{{ playlist.track_count }} tracks</p>
            <p v-if="playlist.owner?.display_name" class="text-xs text-zinc-500 truncate">
              By {{ playlist.owner.display_name }}
            </p>
          </NuxtLink>
        </div>
      </section>

      <!-- All Artists -->
      <section v-if="allArtists.length > 0" class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-zinc-100">All Artists</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <NuxtLink
            v-for="artist in allArtists"
            :key="artist.id"
            :to="`/${artist.slug}`"
            class="group card-interactive"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300">
              <img
                v-if="artist.avatar_url"
                v-fade-image
                :src="artist.avatar_url"
                :alt="artist.name"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div
                v-else
                class="absolute inset-0 w-full h-full flex items-center justify-center"
                :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
              >
                <span class="text-4xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
              </div>
            </div>
            <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ artist.name }}</p>
            <p class="text-sm text-zinc-500">Artist</p>
          </NuxtLink>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreArtists" class="mt-8 text-center">
          <UButton color="gray" variant="outline" :loading="loadingMore" @click="loadMoreArtists">
            Load More Artists
          </UButton>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="allArtists.length === 0 && newReleases.length === 0" class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-10 h-10 text-violet-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-100 mb-2">No Music Yet</h2>
        <p class="text-zinc-400 mb-6">Be the first to upload your music!</p>
        <UButton color="violet" to="/dashboard/artist/new">
          Create Artist Profile
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

interface FeaturedPlaylist {
  id: string
  title: string
  description: string | null
  track_count: number
  cover_key: string | null
  owner: {
    id: string
    display_name: string | null
  } | null
}

const {
  getFeaturedArtists,
  getNewReleases,
  getAllArtists,
  loadMoreArtists: loadMoreArtistsFromComposable,
} = useDiscover()

const { getStreamUrl } = useAlbum()

const loading = ref(true)
const loadingMore = ref(false)

const featuredArtists = ref<Band[]>([])
const newReleases = ref<Album[]>([])
const allArtists = ref<Band[]>([])
const albumCovers = ref<Record<string, string>>({})
const featuredPlaylists = ref<FeaturedPlaylist[]>([])
const playlistCovers = ref<Record<string, string>>({})
const hasMoreArtists = ref(false)
const artistPage = ref(0)

const loadFeaturedPlaylists = async () => {
  try {
    const data = await $fetch<{ playlists: FeaturedPlaylist[] }>('/api/playlists/featured')
    featuredPlaylists.value = data.playlists

    // Load cover images
    for (const playlist of data.playlists) {
      if (playlist.cover_key && !playlistCovers.value[playlist.id]) {
        try {
          playlistCovers.value[playlist.id] = await getStreamUrl(playlist.cover_key)
        } catch (e) {
          console.error('Failed to load playlist cover:', e)
        }
      }
    }
  } catch (e) {
    console.error('Failed to load featured playlists:', e)
  }
}

const loadData = async (forceRefresh = false) => {
  try {
    const [featured, releases, artists] = await Promise.all([
      getFeaturedArtists(forceRefresh),
      getNewReleases(forceRefresh),
      getAllArtists(forceRefresh),
    ])

    featuredArtists.value = featured
    newReleases.value = releases.albums
    albumCovers.value = releases.covers
    allArtists.value = artists.artists
    hasMoreArtists.value = artists.hasMore
    artistPage.value = 0

    // Also load featured playlists
    await loadFeaturedPlaylists()
  } catch (e) {
    console.error('Failed to load discover data:', e)
  }
}

const loadMoreArtists = async () => {
  loadingMore.value = true
  try {
    artistPage.value += 1
    const result = await loadMoreArtistsFromComposable(artistPage.value)
    allArtists.value = [...allArtists.value, ...result.artists]
    hasMoreArtists.value = result.hasMore
  } catch (e) {
    console.error('Failed to load more artists:', e)
  } finally {
    loadingMore.value = false
  }
}

// Pull to refresh - force refresh to bypass cache
usePullToRefresh(() => loadData(true))

onMounted(async () => {
  loading.value = true
  await loadData()
  loading.value = false
})
</script>
