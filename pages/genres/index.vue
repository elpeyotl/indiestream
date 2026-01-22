<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header + Search -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Browse by Genre</h1>
      <p class="text-zinc-400 mb-4">Explore music across different styles and sounds</p>
      <UInput
        v-model="searchQuery"
        placeholder="Search genres..."
        icon="i-heroicons-magnifying-glass"
        size="lg"
        :ui="{ wrapper: 'max-w-md' }"
      />
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-8">
      <div>
        <USkeleton class="h-5 w-24 mb-3" />
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <USkeleton v-for="i in 6" :key="i" class="h-40 rounded-xl" />
        </div>
      </div>
      <div>
        <USkeleton class="h-5 w-24 mb-3" />
        <div class="flex flex-wrap gap-2">
          <USkeleton v-for="i in 12" :key="i" class="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-20">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-400" />
      </div>
      <h2 class="text-xl font-semibold text-zinc-100 mb-2">Failed to Load Genres</h2>
      <p class="text-zinc-400 mb-6">Something went wrong. Please try again.</p>
      <UButton color="violet" @click="loadGenres">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Retry
      </UButton>
    </div>

    <!-- Content -->
    <div v-else-if="genres.length > 0" class="space-y-8">
      <!-- Featured Section -->
      <section v-if="featuredGenres.length > 0">
        <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Featured</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NuxtLink
            v-for="genre in featuredGenres"
            :key="genre.slug"
            :to="`/genres/${genre.slug}`"
            class="group relative h-40 rounded-xl overflow-hidden"
          >
            <!-- Background: Single hero image or gradient fallback -->
            <div class="absolute inset-0">
              <img
                v-if="genreAvatars[genre.slug]?.[0]"
                :src="genreAvatars[genre.slug][0]"
                :alt="genre.name"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div v-else class="h-full w-full" :style="{ background: getGenreGradient(genre.name) }" />
            </div>

            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/70 transition-colors" />

            <!-- Content -->
            <div class="relative h-full flex flex-col justify-end p-4">
              <h3 class="font-bold text-white text-lg drop-shadow-lg">{{ genre.name }}</h3>
              <p class="text-white/80 text-sm drop-shadow">{{ genre.artistCount }} {{ genre.artistCount === 1 ? 'artist' : 'artists' }}</p>
            </div>

            <!-- Play button -->
            <button
              class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg hover:bg-violet-400 hover:scale-105"
              @click.prevent.stop="playGenre(genre)"
            >
              <UIcon v-if="loadingPlayId === genre.slug" name="i-heroicons-arrow-path" class="w-5 h-5 text-white animate-spin" />
              <UIcon v-else name="i-heroicons-play-solid" class="w-5 h-5 text-white ml-0.5" />
            </button>
          </NuxtLink>
        </div>
      </section>

      <!-- All Genres (Tag Cloud) -->
      <section v-if="regularGenres.length > 0">
        <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">All Genres</h2>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="genre in visibleRegularGenres"
            :key="genre.slug"
            :to="`/genres/${genre.slug}`"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            {{ genre.name }}
            <span class="text-zinc-500">{{ genre.artistCount }}</span>
          </NuxtLink>
        </div>

        <!-- Show All Button -->
        <button
          v-if="hasMoreTags && !showAllTags"
          class="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          @click="showAllTags = true"
        >
          Show all {{ regularGenres.length }} genres
        </button>
      </section>

      <!-- No Results -->
      <div v-if="searchQuery && filteredGenres.length === 0" class="text-center py-12">
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-3 text-zinc-600" />
        <p class="text-zinc-400">No genres found for "{{ searchQuery }}"</p>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else
      icon="i-heroicons-musical-note"
      title="No Genres Yet"
      description="Artists haven't added genres to their profiles yet"
    />
  </div>
</template>

<script setup lang="ts">
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore
const playerStore = usePlayerStore()
const { setQueue } = playerStore

interface Genre {
  name: string
  slug: string
  artistCount: number
  avatarKeys: string[]
}

const FEATURED_THRESHOLD = 10
const INITIAL_TAG_COUNT = 20

const loadingPlayId = ref<string | null>(null)
const genreAvatars = ref<Record<string, string[]>>({})
const searchQuery = ref('')
const showAllTags = ref(false)

// Fetch all genres
const { data: genresData, pending: loadingGenres, error: fetchError, refresh } = await useLazyFetch<{ genres: Genre[] }>('/api/genres', {
  key: 'genres-page',
  default: () => ({ genres: [] }),
})

// Fetch admin-curated featured genres
const { data: featuredData, pending: loadingFeatured } = await useLazyFetch<{ featuredGenres: Genre[] }>('/api/genres/featured', {
  key: 'featured-genres',
  default: () => ({ featuredGenres: [] }),
})

const loading = computed(() => loadingGenres.value || loadingFeatured.value)

// Computed accessors
const genres = computed(() => genresData.value?.genres ?? [])
const error = computed(() => !!fetchError.value)

// Filter genres by search query
const filteredGenres = computed(() => {
  if (!searchQuery.value.trim()) return genres.value
  const query = searchQuery.value.toLowerCase()
  return genres.value.filter(g => g.name.toLowerCase().includes(query))
})

// Featured genres: use admin-curated list if available, fallback to threshold-based
const featuredGenres = computed(() => {
  // If admin has curated featured genres, use those
  const curatedFeatured = featuredData.value?.featuredGenres || []
  if (curatedFeatured.length > 0) {
    // Filter by search query if active
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      return curatedFeatured.filter(g => g.name.toLowerCase().includes(query))
    }
    return curatedFeatured
  }
  // Fallback to threshold-based selection
  return filteredGenres.value.filter(g => g.artistCount >= FEATURED_THRESHOLD).slice(0, 6)
})

const regularGenres = computed(() => {
  const featuredSlugs = new Set(featuredGenres.value.map(g => g.slug))
  return filteredGenres.value.filter(g => !featuredSlugs.has(g.slug))
})

// Visible tags with "show all" toggle
const visibleRegularGenres = computed(() =>
  showAllTags.value ? regularGenres.value : regularGenres.value.slice(0, INITIAL_TAG_COUNT)
)

const hasMoreTags = computed(() => regularGenres.value.length > INITIAL_TAG_COUNT)

// Load avatar URLs for featured genres only (for performance)
const loadAvatars = async (genreList: Genre[]) => {
  const avatarPromises = genreList.map(async (genre) => {
    if (!genre.avatarKeys?.length) return

    // Only load 1 avatar (hero image)
    const url = await getCachedCoverUrl(genre.avatarKeys[0])
    if (url) {
      genreAvatars.value[genre.slug] = [url]
    }
  })

  await Promise.all(avatarPromises)
}

// Load avatars when featured genres change
watch(featuredGenres, async (newFeatured) => {
  if (newFeatured.length > 0) {
    await loadAvatars(newFeatured)
  }
}, { immediate: true })

// Also load avatars for threshold-based featured genres from all genres
watch(genres, async (newGenres) => {
  // Only if no curated featured genres
  if (!featuredData.value?.featuredGenres?.length && newGenres.length > 0) {
    const thresholdFeatured = newGenres.filter(g => g.artistCount >= FEATURED_THRESHOLD).slice(0, 6)
    await loadAvatars(thresholdFeatured)
  }
}, { immediate: true })

// Reset showAllTags when search changes
watch(searchQuery, () => {
  showAllTags.value = false
})

// Generate consistent gradient colors based on genre name
const getGenreGradient = (name: string): string => {
  const gradients = [
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', // violet-pink
    'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', // cyan-violet
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', // amber-red
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)', // emerald-cyan
    'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)', // pink-amber
    'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', // blue-violet
    'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)', // red-pink
    'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)', // violet-cyan
  ]

  // Use hash of name to pick consistent gradient
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

const playGenre = async (genre: Genre) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = genre.slug

  try {
    // Fetch random tracks from this genre
    const tracks = await $fetch<Array<{
      id: string
      title: string
      audioKey: string
      duration: number
      albumTitle: string
      albumSlug: string
      coverKey: string | null
      artistName: string
      artistSlug: string
    }>>(`/api/genres/${genre.slug}/tracks`, {
      query: { shuffle: 'true', limit: 20 },
    })

    if (!tracks?.length) return

    // Build queue with cover URLs
    const queue = await Promise.all(
      tracks.map(async (t) => ({
        id: t.id,
        title: t.title,
        artist: t.artistName,
        artistSlug: t.artistSlug,
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
    console.error('Failed to play genre:', e)
  } finally {
    loadingPlayId.value = null
  }
}

const loadGenres = () => refresh()

// SEO
useHead({
  title: 'Browse Genres | Fairtune',
  meta: [
    { name: 'description', content: 'Explore music by genre on Fairtune. Discover independent artists across rock, electronic, hip-hop, jazz, and more.' },
  ],
})
</script>
