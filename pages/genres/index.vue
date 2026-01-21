<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Browse by Genre</h1>
      <p class="text-zinc-400">Explore music across different styles and sounds</p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <USkeleton v-for="i in 15" :key="i" class="h-32 rounded-xl" />
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

    <!-- Genre Grid -->
    <div v-else-if="genres.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <NuxtLink
        v-for="genre in genres"
        :key="genre.slug"
        :to="`/genres/${genre.slug}`"
        class="group relative h-32 rounded-xl overflow-hidden"
      >
        <!-- Background: Avatar collage or gradient fallback -->
        <div class="absolute inset-0">
          <!-- 4-image grid collage -->
          <div v-if="genreAvatars[genre.slug]?.length >= 4" class="grid grid-cols-2 grid-rows-2 h-full w-full">
            <img
              v-for="(url, idx) in genreAvatars[genre.slug].slice(0, 4)"
              :key="idx"
              :src="url"
              :alt="genre.name"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- 2-image split -->
          <div v-else-if="genreAvatars[genre.slug]?.length >= 2" class="grid grid-cols-2 h-full w-full">
            <img
              v-for="(url, idx) in genreAvatars[genre.slug].slice(0, 2)"
              :key="idx"
              :src="url"
              :alt="genre.name"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- Single image -->
          <div v-else-if="genreAvatars[genre.slug]?.length === 1" class="h-full w-full">
            <img
              :src="genreAvatars[genre.slug][0]"
              :alt="genre.name"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- Gradient fallback -->
          <div v-else class="h-full w-full" :style="{ background: getGenreGradient(genre.name) }" />
        </div>

        <!-- Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/70 group-hover:via-black/30 transition-colors" />

        <!-- Content -->
        <div class="relative h-full flex flex-col justify-end p-4">
          <h3 class="font-bold text-white text-lg drop-shadow-lg">{{ genre.name }}</h3>
          <p class="text-white/80 text-sm drop-shadow">{{ genre.artistCount }} {{ genre.artistCount === 1 ? 'artist' : 'artists' }}</p>
        </div>

        <!-- Play button (bottom right) -->
        <button
          class="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg hover:bg-violet-400 hover:scale-105"
          @click.prevent.stop="playGenre(genre)"
        >
          <UIcon v-if="loadingPlayId === genre.slug" name="i-heroicons-arrow-path" class="w-5 h-5 text-white animate-spin" />
          <UIcon v-else name="i-heroicons-play-solid" class="w-5 h-5 text-white ml-0.5" />
        </button>
      </NuxtLink>
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
const { getCachedCoverUrl } = useAlbum()
const { setQueue } = usePlayer()

interface Genre {
  name: string
  slug: string
  artistCount: number
  avatarKeys: string[]
}

const loadingPlayId = ref<string | null>(null)
const genreAvatars = ref<Record<string, string[]>>({})

// Fetch genres using Nuxt's useLazyFetch
const { data: genresData, pending: loading, error: fetchError, refresh } = await useLazyFetch<{ genres: Genre[] }>('/api/genres', {
  key: 'genres-page',
  default: () => ({ genres: [] }),
})

// Computed accessors
const genres = computed(() => genresData.value?.genres ?? [])
const error = computed(() => !!fetchError.value)

// Load avatars when genres data changes
watch(genres, async (newGenres) => {
  if (newGenres.length > 0) {
    await loadAvatars(newGenres)
  }
}, { immediate: true })

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

const loadAvatars = async (genreList: Genre[]) => {
  // Load avatar URLs for all genres in parallel
  const avatarPromises = genreList.map(async (genre) => {
    if (!genre.avatarKeys?.length) return

    const urls: string[] = []
    for (const key of genre.avatarKeys) {
      const url = await getCachedCoverUrl(key)
      if (url) urls.push(url)
    }
    if (urls.length > 0) {
      genreAvatars.value[genre.slug] = urls
    }
  })

  await Promise.all(avatarPromises)
}

const loadGenres = () => refresh()

// SEO
useHead({
  title: 'Browse Genres | FairStream',
  meta: [
    { name: 'description', content: 'Explore music by genre on FairStream. Discover independent artists across rock, electronic, hip-hop, jazz, and more.' },
  ],
})
</script>
