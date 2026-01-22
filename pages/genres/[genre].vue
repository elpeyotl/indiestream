<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header with gradient background -->
    <div
      class="relative -mx-4 -mt-8 px-4 pt-12 pb-8 mb-8"
      :style="{ background: genreGradient }"
    >
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
      <div class="relative">
        <NuxtLink to="/genres" class="inline-flex items-center gap-1 text-white/70 hover:text-white mb-4 transition-colors">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          All Genres
        </NuxtLink>
        <h1 class="text-4xl font-bold text-white mb-2">{{ displayGenre }}</h1>
        <p class="text-white/70">{{ artists.length }} {{ artists.length === 1 ? 'artist' : 'artists' }}</p>
      </div>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Artists Grid -->
      <div v-if="artists.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <NuxtLink
          v-for="artist in artists"
          :key="artist.id"
          :to="`/${artist.slug}`"
          class="group"
        >
          <div class="relative w-full pb-[100%] rounded-xl overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-all group-hover:ring-2 group-hover:ring-violet-500/50">
            <div class="absolute inset-0">
              <NuxtImg
                v-if="artist.avatar_url"
                :src="artist.avatar_url"
                :alt="artist.name"
                :width="192"
                :height="192"
                format="webp"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
              >
                <span class="text-5xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
              </div>
            </div>
          </div>
          <h3 class="font-semibold text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
            {{ artist.name }}
          </h3>
          <div class="flex items-center gap-2 text-sm text-zinc-500">
            <span>{{ formatNumber(artist.total_streams || 0) }} streams</span>
            <UIcon
              v-if="artist.is_verified"
              name="i-heroicons-check-badge"
              class="w-4 h-4 text-violet-400"
            />
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else
        icon="i-heroicons-user-group"
        title="No Artists Found"
        description="No artists have been tagged with this genre yet"
        action-label="Browse All Genres"
        @action="navigateTo('/genres')"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'

const route = useRoute()
const client = useSupabaseClient()
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore

const genreSlug = computed(() => route.params.genre as string)

// Convert slug back to display name
const displayGenre = computed(() => {
  // Capitalize each word
  return genreSlug.value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
})

// Generate gradient based on genre name
const genreGradient = computed(() => {
  const gradients = [
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
  ]

  let hash = 0
  for (let i = 0; i < displayGenre.value.length; i++) {
    hash = displayGenre.value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Fetch artists using useLazyAsyncData for SSR
const { data: artists, pending: loading } = await useLazyAsyncData(
  `genre-${route.params.genre}`,
  async () => {
    // Query bands that have this genre (case-insensitive search)
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, avatar_key, avatar_url, total_streams, is_verified, genres')
      .eq('status', 'active')
      .order('total_streams', { ascending: false })

    if (error) throw error

    // Filter by genre (case-insensitive match)
    const filteredArtists = (data || []).filter(band => {
      if (!band.genres || !Array.isArray(band.genres)) return false
      return band.genres.some((g: string) =>
        g.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === genreSlug.value
      )
    })

    // Load avatar URLs in parallel (using cached helper)
    await Promise.all(
      filteredArtists.map(async (artist) => {
        if (artist.avatar_key) {
          const url = await getCachedCoverUrl(artist.avatar_key)
          if (url) artist.avatar_url = url
        }
      })
    )

    return filteredArtists as Band[]
  },
  {
    default: () => [] as Band[],
    watch: [() => route.params.genre],
  }
)

// Update page title
useHead({
  title: () => `${displayGenre.value} Artists - Fairstream`,
})
</script>
