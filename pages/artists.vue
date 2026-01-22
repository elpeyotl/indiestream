<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Artists</h1>
      <p class="text-zinc-400">Discover independent artists on Fairtune</p>
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

    <!-- Loading Skeleton -->
    <div v-if="loading || isSearching" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <div v-for="i in 12" :key="i" class="text-center">
        <USkeleton class="w-full aspect-square rounded-full mb-3" />
        <USkeleton class="h-5 w-3/4 mx-auto mb-1" />
        <USkeleton class="h-4 w-1/2 mx-auto" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !isSearching" class="text-center py-20">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-400" />
      </div>
      <h2 class="text-xl font-semibold text-zinc-100 mb-2">Failed to Load Artists</h2>
      <p class="text-zinc-400 mb-6">Something went wrong. Please try again.</p>
      <UButton color="violet" @click="loadArtists(true)">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Retry
      </UButton>
    </div>

    <template v-else>
      <!-- Artists Grid -->
      <div v-if="artists.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <ArtistCard
          v-for="artist in artists"
          :key="artist.id"
          :artist="artist"
          :loading="loadingPlayId === artist.id"
          large
          rounded
          show-genres
          @play="playArtist"
        />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else
        icon="i-heroicons-user-group"
        title="No Artists Found"
        :description="searchQuery ? `No artists match &quot;${searchQuery}&quot;` : 'No artists available yet'"
        :action-label="searchQuery ? 'Clear Search' : undefined"
        @action="clearSearch"
      />

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
import type { Band } from '~/stores/band'

const client = useSupabaseClient()
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore
const playerStore = usePlayerStore()
const { setQueue } = playerStore

const loadingMore = ref(false)
const loadingPlayId = ref<string | null>(null)
const artists = ref<Band[]>([])
const searchQuery = ref('')
const selectedGenre = ref<{ label: string; value: string } | null>(null)
const sortBy = ref<{ label: string; value: string }>({ label: 'Newest', value: 'newest' })
const hasMore = ref(false)
const page = ref(0)
const pageSize = 24

// Check if any filters are active (search, genre, or non-default sort)
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' ||
    selectedGenre.value?.value ||
    sortBy.value.value !== 'newest'
})

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'A-Z', value: 'name' },
]

const genreOptions = ref<{ label: string; value: string }[]>([
  { label: 'All Genres', value: '' },
])

// Fetch initial artists and genres using Nuxt's useLazyAsyncData
const { data: initialData, pending: loading, error: fetchError } = await useLazyAsyncData(
  'artists-page',
  async () => {
    // Fetch artists
    const { data: artistsData, error: artistsError } = await client
      .from('bands')
      .select('id, name, slug, theme_color, avatar_key, avatar_url, total_streams, is_verified, genres')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(0, pageSize - 1)

    if (artistsError) throw artistsError

    // Load avatar URLs from keys (using cache)
    const loadedArtists = (artistsData || []) as any[]
    await Promise.all(
      loadedArtists.map(async (artist) => {
        if (artist.avatar_key) {
          const url = await getCachedCoverUrl(artist.avatar_key)
          if (url) artist.avatar_url = url
        }
      })
    )

    // Fetch genres
    const { data: genresData, error: genresError } = await client
      .from('bands')
      .select('genres')
      .eq('status', 'active')

    if (genresError) throw genresError

    const allGenres = new Set<string>()
    for (const band of (genresData || []) as { genres: string[] | null }[]) {
      if (band.genres) {
        for (const genre of band.genres) {
          allGenres.add(genre)
        }
      }
    }

    return {
      artists: loadedArtists as Band[],
      genres: Array.from(allGenres).sort(),
    }
  },
  {
    default: () => ({
      artists: [] as Band[],
      genres: [] as string[],
    }),
  }
)

// Apply initial data and watch for updates
watch(initialData, (data) => {
  if (data && !hasActiveFilters.value && page.value === 0) {
    artists.value = data.artists
    genreOptions.value = [
      { label: 'All Genres', value: '' },
      ...data.genres.map(g => ({ label: g, value: g })),
    ]
    hasMore.value = data.artists.length === pageSize
  }
}, { immediate: true })

// Computed error state
const error = computed(() => !!fetchError.value)

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

// Play random tracks from an artist
const playArtist = async (artist: Band) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = artist.id

  try {
    // Fetch random tracks from this artist
    const tracks = await $fetch<Array<{
      id: string
      title: string
      audioKey: string
      duration: number
      albumTitle: string
      albumSlug: string
      coverKey: string | null
    }>>(`/api/artists/${artist.id}/tracks`, {
      query: { shuffle: 'true', limit: 20 },
    })

    if (!tracks?.length) return

    // Build queue with cover URLs (using cache)
    const queue = await Promise.all(
      tracks.map(async (t) => ({
        id: t.id,
        title: t.title,
        artist: artist.name,
        artistSlug: artist.slug,
        albumTitle: t.albumTitle,
        albumSlug: t.albumSlug,
        coverUrl: await getCachedCoverUrl(t.coverKey),
        duration: t.duration,
        audioKey: t.audioKey,
      }))
    )

    if (queue.length > 0) {
      await setQueue(queue, 0)
    }
  } catch (e) {
    console.error('Failed to play artist:', e)
  } finally {
    loadingPlayId.value = null
  }
}

// Flag for tracking if we're doing a filtered search
const isSearching = ref(false)

const loadArtists = async (reset = false) => {
  if (reset) {
    page.value = 0
    artists.value = []
    isSearching.value = true
  }

  try {
    let query = client
      .from('bands')
      .select('id, name, slug, theme_color, avatar_key, avatar_url, total_streams, is_verified, genres')
      .eq('status', 'active') // Only show approved artists

    // Search filter
    if (searchQuery.value.trim()) {
      query = query.ilike('name', `%${searchQuery.value}%`)
    }

    // Genre filter
    if (selectedGenre.value?.value) {
      query = query.contains('genres', [selectedGenre.value.value])
    }

    // Sorting
    if (sortBy.value.value === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy.value.value === 'name') {
      query = query.order('name', { ascending: true })
    }

    // Pagination
    query = query.range(page.value * pageSize, (page.value + 1) * pageSize - 1)

    const { data, error: queryError } = await query

    if (queryError) throw queryError

    // Load avatar URLs from keys (using cache)
    const newArtists = (data || []) as any[]
    for (const artist of newArtists) {
      if (artist.avatar_key) {
        const url = await getCachedCoverUrl(artist.avatar_key)
        if (url) artist.avatar_url = url
      }
      // avatar_url from DB is used as fallback if no avatar_key
    }
    artists.value = reset ? (newArtists as Band[]) : [...artists.value, ...(newArtists as Band[])]
    hasMore.value = newArtists.length === pageSize
  } catch (e) {
    console.error('Failed to load artists:', e)
  } finally {
    isSearching.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  page.value += 1
  await loadArtists()
}

// SEO
useHead({
  title: 'Browse Artists | Fairtune',
  meta: [
    { name: 'description', content: 'Explore independent artists on Fairtune. Discover new music and support artists directly with your streams.' },
  ],
})

</script>
