<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Pull to Refresh Indicator -->
    <PullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-refreshing="isRefreshing"
      :threshold="threshold"
    />

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Discover</h1>
      <p class="text-zinc-400">Find your next favorite artist</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
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
            class="group"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
              <img
                v-if="artist.avatar_url"
                :src="artist.avatar_url"
                :alt="artist.name"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <p class="text-sm text-zinc-500">{{ formatNumber(artist.total_streams) }} streams</p>
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
            class="group"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
              <div class="absolute inset-0">
                <img
                  v-if="albumCovers[album.id]"
                  :src="albumCovers[album.id]"
                  :alt="album.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            class="group"
          >
            <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
              <img
                v-if="artist.avatar_url"
                :src="artist.avatar_url"
                :alt="artist.name"
                class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <p class="text-sm text-zinc-500">{{ formatNumber(artist.total_streams) }} streams</p>
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

const client = useSupabaseClient()
const { getStreamUrl } = useAlbum()

const loading = ref(true)
const loadingMore = ref(false)

const featuredArtists = ref<Band[]>([])
const newReleases = ref<Album[]>([])
const allArtists = ref<Band[]>([])
const albumCovers = ref<Record<string, string>>({})
const hasMoreArtists = ref(false)
const artistPage = ref(0)
const pageSize = 12

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const loadFeaturedArtists = async () => {
  try {
    // Featured = verified artists with most streams
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, is_verified, avatar_key, avatar_url')
      .eq('is_verified', true)
      .order('total_streams', { ascending: false })
      .limit(6)

    if (error) throw error

    // Load avatar URLs from keys (or use direct URL if no key)
    const artists = (data || []) as any[]
    for (const artist of artists) {
      if (artist.avatar_key) {
        try {
          artist.avatar_url = await getStreamUrl(artist.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar:', e)
        }
      }
      // avatar_url from DB is used as fallback if no avatar_key
    }
    featuredArtists.value = artists as Band[]
  } catch (e) {
    console.error('Failed to load featured artists:', e)
  }
}

const loadNewReleases = async () => {
  try {
    const { data, error } = await client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        release_type,
        release_date,
        cover_key,
        cover_url,
        band:bands!inner (
          id,
          name,
          slug
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    newReleases.value = (data || []).map(album => ({
      ...album,
      band: Array.isArray(album.band) ? album.band[0] : album.band
    }))

    // Load cover URLs (use direct URL as fallback if no key)
    for (const album of newReleases.value) {
      if (album.cover_key) {
        try {
          albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
        } catch (e) {
          console.error('Failed to load cover:', e)
        }
      } else if (album.cover_url) {
        albumCovers.value[album.id] = album.cover_url
      }
    }
  } catch (e) {
    console.error('Failed to load new releases:', e)
  }
}

const loadAllArtists = async (reset = false) => {
  if (reset) {
    artistPage.value = 0
    allArtists.value = []
  }

  try {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, avatar_key, avatar_url')
      .order('total_streams', { ascending: false })
      .range(artistPage.value * pageSize, (artistPage.value + 1) * pageSize - 1)

    if (error) throw error

    // Load avatar URLs from keys (or use direct URL if no key)
    const artists = (data || []) as any[]
    for (const artist of artists) {
      if (artist.avatar_key) {
        try {
          artist.avatar_url = await getStreamUrl(artist.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar:', e)
        }
      }
      // avatar_url from DB is used as fallback if no avatar_key
    }
    allArtists.value = reset ? (artists as Band[]) : [...allArtists.value, ...(artists as Band[])]
    hasMoreArtists.value = artists.length === pageSize
  } catch (e) {
    console.error('Failed to load artists:', e)
  }
}

const loadMoreArtists = async () => {
  loadingMore.value = true
  artistPage.value += 1
  await loadAllArtists()
  loadingMore.value = false
}

const refreshData = async () => {
  await Promise.all([
    loadFeaturedArtists(),
    loadNewReleases(),
    loadAllArtists(true),
  ])
}

// Pull to refresh
const { pullDistance, isRefreshing, threshold } = usePullToRefresh({
  onRefresh: refreshData
})

onMounted(async () => {
  loading.value = true
  await refreshData()
  loading.value = false
})
</script>
