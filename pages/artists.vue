<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Artists</h1>
      <p class="text-zinc-400">Discover independent artists on Indiestream</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-8">
      <!-- Search -->
      <UInput
        v-model="searchQuery"
        placeholder="Search artists..."
        icon="i-heroicons-magnifying-glass"
        class="w-full sm:w-64"
        @input="debouncedSearch"
      />

      <!-- Genre Filter -->
      <USelectMenu
        v-model="selectedGenre"
        :options="genreOptions"
        placeholder="All Genres"
        class="w-full sm:w-48"
        @change="loadArtists(true)"
      />

      <!-- Sort -->
      <USelectMenu
        v-model="sortBy"
        :options="sortOptions"
        class="w-full sm:w-48"
        @change="loadArtists(true)"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Artists Grid -->
      <div v-if="artists.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <NuxtLink
          v-for="artist in artists"
          :key="artist.id"
          :to="`/${artist.slug}`"
          class="group"
        >
          <div class="aspect-square rounded-xl overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-all group-hover:ring-2 group-hover:ring-violet-500/50">
            <img
              v-if="artist.avatar_url"
              :src="artist.avatar_url"
              :alt="artist.name"
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
          <h3 class="font-semibold text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
            {{ artist.name }}
          </h3>
          <div class="flex items-center gap-2 text-sm text-zinc-500">
            <span>{{ formatNumber(artist.total_streams) }} streams</span>
            <UIcon
              v-if="artist.is_verified"
              name="i-heroicons-check-badge"
              class="w-4 h-4 text-violet-400"
            />
          </div>
          <div v-if="artist.genres?.length" class="flex flex-wrap gap-1 mt-2">
            <UBadge
              v-for="genre in artist.genres.slice(0, 2)"
              :key="genre"
              color="gray"
              variant="soft"
              size="xs"
            >
              {{ genre }}
            </UBadge>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-user-group" class="w-10 h-10 text-violet-400" />
        </div>
        <h2 class="text-2xl font-bold text-zinc-100 mb-2">No Artists Found</h2>
        <p class="text-zinc-400 mb-6">
          {{ searchQuery ? `No artists match "${searchQuery}"` : 'No artists available yet' }}
        </p>
        <UButton v-if="searchQuery" color="violet" variant="outline" @click="clearSearch">
          Clear Search
        </UButton>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && artists.length > 0" class="mt-12 text-center">
        <UButton
          color="gray"
          variant="outline"
          size="lg"
          :loading="loadingMore"
          @click="loadMore"
        >
          Load More Artists
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'

const client = useSupabaseClient()
const { getStreamUrl } = useAlbum()

const loading = ref(true)
const loadingMore = ref(false)
const artists = ref<Band[]>([])
const searchQuery = ref('')
const selectedGenre = ref<string | null>(null)
const sortBy = ref('streams')
const hasMore = ref(false)
const page = ref(0)
const pageSize = 24

const sortOptions = [
  { label: 'Most Streams', value: 'streams' },
  { label: 'Newest', value: 'newest' },
  { label: 'A-Z', value: 'name' },
]

const genreOptions = ref<{ label: string; value: string }[]>([
  { label: 'All Genres', value: '' },
])

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadArtists(true)
  }, 300)
}

const clearSearch = () => {
  searchQuery.value = ''
  loadArtists(true)
}

const loadArtists = async (reset = false) => {
  if (reset) {
    page.value = 0
    artists.value = []
    loading.value = true
  }

  try {
    let query = client
      .from('bands')
      .select('id, name, slug, theme_color, avatar_key, avatar_url, total_streams, is_verified, genres')

    // Search filter
    if (searchQuery.value.trim()) {
      query = query.ilike('name', `%${searchQuery.value}%`)
    }

    // Genre filter
    if (selectedGenre.value) {
      query = query.contains('genres', [selectedGenre.value])
    }

    // Sorting
    if (sortBy.value === 'streams') {
      query = query.order('total_streams', { ascending: false })
    } else if (sortBy.value === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy.value === 'name') {
      query = query.order('name', { ascending: true })
    }

    // Pagination
    query = query.range(page.value * pageSize, (page.value + 1) * pageSize - 1)

    const { data, error } = await query

    if (error) throw error

    // Load avatar URLs from keys (or use direct URL if no key)
    const newArtists = (data || []) as any[]
    for (const artist of newArtists) {
      if (artist.avatar_key) {
        try {
          artist.avatar_url = await getStreamUrl(artist.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar:', e)
        }
      }
      // avatar_url from DB is used as fallback if no avatar_key
    }
    artists.value = reset ? (newArtists as Band[]) : [...artists.value, ...(newArtists as Band[])]
    hasMore.value = newArtists.length === pageSize
  } catch (e) {
    console.error('Failed to load artists:', e)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  page.value += 1
  await loadArtists()
}

const loadGenres = async () => {
  try {
    // Get unique genres from all bands
    const { data, error } = await client
      .from('bands')
      .select('genres')

    if (error) throw error

    const allGenres = new Set<string>()
    for (const band of (data || [])) {
      if (band.genres) {
        for (const genre of band.genres) {
          allGenres.add(genre)
        }
      }
    }

    genreOptions.value = [
      { label: 'All Genres', value: '' },
      ...Array.from(allGenres).sort().map(g => ({ label: g, value: g })),
    ]
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}

onMounted(async () => {
  await Promise.all([
    loadArtists(true),
    loadGenres(),
  ])
})
</script>
