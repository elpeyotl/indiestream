<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8 border-b-2 border-zinc-800 pb-6">
      <h1 class="text-3xl font-black uppercase tracking-tighter text-white mb-2">ARTISTS</h1>
      <p class="text-zinc-400 font-mono text-sm">Discover independent artists on Fairtune</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-8">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search artists..."
        class="w-full sm:w-64 px-4 py-2 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
        @input="debouncedSearch"
      />

      <!-- Genre Filter -->
      <select
        v-model="selectedGenreValue"
        class="w-full sm:w-48 px-4 py-2 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors appearance-none cursor-pointer"
        @change="handleGenreChange"
      >
        <option v-for="option in genreOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <!-- Sort -->
      <select
        v-model="sortByValue"
        class="w-full sm:w-48 px-4 py-2 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors appearance-none cursor-pointer"
        @change="handleSortChange"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading || isSearching" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      <div v-for="i in 12" :key="i" class="text-center">
        <div class="w-full aspect-square bg-zinc-900 border-2 border-zinc-800 mb-3" />
        <div class="h-5 w-3/4 mx-auto bg-zinc-800 mb-1" />
        <div class="h-4 w-1/2 mx-auto bg-zinc-800" />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !isSearching" class="text-center py-20 bg-zinc-950 border-2 border-zinc-800">
      <div class="w-16 h-16 mx-auto mb-4 border-2 border-red-500 flex items-center justify-center">
        <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-400" />
      </div>
      <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-2">FAILED TO LOAD</h2>
      <p class="text-zinc-400 font-mono text-sm mb-6">Something went wrong. Please try again.</p>
      <button
        class="px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
        @click="loadArtists(true)"
      >
        Retry
      </button>
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
      <div v-else class="text-center py-20 bg-zinc-950 border-2 border-zinc-800">
        <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
          <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-fuchsia-500" />
        </div>
        <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-2">NO ARTISTS FOUND</h2>
        <p class="text-zinc-400 font-mono text-sm mb-6">
          {{ searchQuery ? `No artists match "${searchQuery}"` : 'No artists available yet' }}
        </p>
        <button
          v-if="searchQuery"
          class="px-6 py-3 border-2 border-fuchsia-500 text-fuchsia-500 font-bold uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
          @click="clearSearch"
        >
          Clear Search
        </button>
      </div>

      <!-- Load More -->
      <div v-if="hasMore && artists.length > 0" class="mt-12 text-center">
        <button
          class="px-6 py-3 border-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight rounded-none hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading...' : 'Load More Artists' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'

definePageMeta({
  layout: 'brutalist'
})

const client = useSupabaseClient()
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore
const bandStore = useBandStore()
const { resolveAvatarUrls } = bandStore
const playerStore = usePlayerStore()
const { setQueue } = playerStore

const loadingMore = ref(false)
const loadingPlayId = ref<string | null>(null)
const artists = ref<Band[]>([])
const searchQuery = ref('')
const selectedGenreValue = ref('')
const selectedGenre = computed(() => genreOptions.value.find(o => o.value === selectedGenreValue.value))
const sortByValue = ref('newest')
const sortBy = computed(() => sortOptions.find(o => o.value === sortByValue.value) || sortOptions[0])
const hasMore = ref(false)
const page = ref(0)
const pageSize = 24

// Check if any filters are active (search, genre, or non-default sort)
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' ||
    selectedGenreValue.value !== '' ||
    sortByValue.value !== 'newest'
})

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'A-Z', value: 'name' },
]

const genreOptions = ref<{ label: string; value: string }[]>([
  { label: 'All Genres', value: '' },
])

const handleGenreChange = () => {
  loadArtists(true)
}

const handleSortChange = () => {
  loadArtists(true)
}

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
    if (selectedGenreValue.value) {
      query = query.contains('genres', [selectedGenreValue.value])
    }

    // Sorting
    if (sortByValue.value === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortByValue.value === 'name') {
      query = query.order('name', { ascending: true })
    }

    // Pagination
    query = query.range(page.value * pageSize, (page.value + 1) * pageSize - 1)

    const { data, error: queryError } = await query

    if (queryError) throw queryError

    const newArtists = (data || []) as any[]
    await resolveAvatarUrls(newArtists)
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
