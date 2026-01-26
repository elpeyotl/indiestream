<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Hero Banner -->
    <div class="relative h-48 md:h-64 lg:h-80 overflow-hidden -mx-4 -mt-8">
      <!-- Banner Image (random artist avatar) with blur filter -->
      <div
        v-if="bannerUrl"
        class="absolute inset-0 bg-cover bg-center scale-110 blur-md"
        :style="{ backgroundImage: `url(${bannerUrl})` }"
      />
      <!-- Fallback: Gradient based on genre name -->
      <div
        v-else
        class="absolute inset-0"
        :style="{ background: genreGradient }"
      />
      <!-- Overlay gradients for readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
      <div class="absolute inset-0 bg-gradient-to-r from-zinc-950/50 via-transparent to-zinc-950/50" />
    </div>

    <!-- Genre Info (overlapping banner) -->
    <div class="relative -mt-20 z-10 mb-6">
      <NuxtLink to="/genres" class="inline-flex items-center gap-1 text-white/70 hover:text-fuchsia-500 mb-4 transition-colors font-bold uppercase tracking-tight">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        All Genres
      </NuxtLink>
      <h1 class="text-4xl font-black uppercase tracking-tighter text-white mb-2">{{ displayGenre }}</h1>
      <p class="text-white/70 font-mono">{{ filteredArtists.length }} {{ filteredArtists.length === 1 ? 'artist' : 'artists' }}</p>
    </div>

    <!-- Controls: Search, Sort, Shuffle -->
    <div class="flex flex-wrap items-center gap-3 mb-6 border-b-2 border-zinc-800 pb-6">
      <!-- Search Input -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search artists..."
        class="w-full sm:w-64 px-4 py-2 bg-black border-2 border-zinc-800 text-white font-mono text-sm focus:border-fuchsia-500 focus:outline-none transition-colors"
      />

      <!-- Sort Dropdown -->
      <select
        v-model="sortOption"
        class="px-4 py-2 bg-black border-2 border-zinc-800 text-white font-mono text-sm focus:border-fuchsia-500 focus:outline-none transition-colors appearance-none cursor-pointer"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <!-- Shuffle Play Button -->
      <button
        class="px-4 py-2 bg-fuchsia-600 text-white font-bold uppercase tracking-tight text-sm shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all inline-flex items-center gap-2 disabled:opacity-50"
        :disabled="shuffleLoading"
        @click="playShuffled"
      >
        <UIcon name="i-heroicons-play" class="w-4 h-4" />
        Shuffle
      </button>
    </div>

    <!-- Loading -->
    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Artists Grid using ArtistCard component -->
      <div v-if="filteredArtists.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <ArtistCard
          v-for="artist in filteredArtists"
          :key="artist.id"
          :artist="artist"
          :loading="playingArtistId === artist.id"
          rounded
          @play="playArtist"
        />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="searchQuery && artists.length > 0"
        icon="i-heroicons-magnifying-glass"
        title="No Artists Found"
        :description="`No artists match '${searchQuery}'`"
        action-label="Clear Search"
        @action="searchQuery = ''"
      />

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

definePageMeta({
  layout: 'brutalist'
})

const route = useRoute()
const client = useSupabaseClient()
const albumStore = useAlbumStore()
const playerStore = usePlayerStore()
const { getCachedCoverUrl } = albumStore
const { setQueue } = playerStore

const genreSlug = computed(() => route.params.genre as string)

// Convert slug back to display name
const displayGenre = computed(() => {
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

// Search and sort state
const searchQuery = ref('')
const shuffleLoading = ref(false)
const playingArtistId = ref<string | null>(null)

// Banner state - pick a random artist's avatar
const bannerUrl = ref<string | null>(null)

// Sort options
const sortOptions = [
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
  { value: 'newest', label: 'Newest' },
]

// Persist sort preference in localStorage
function getPersistedSort(): string {
  if (import.meta.client) {
    const saved = localStorage.getItem('genre-sort')
    // Migrate old 'streams' preference to 'name-asc'
    if (saved === 'streams') return 'name-asc'
    return saved || 'name-asc'
  }
  return 'name-asc'
}

const sortOption = ref(getPersistedSort())

watch(sortOption, (val) => {
  if (import.meta.client) {
    localStorage.setItem('genre-sort', val)
  }
})

// Fetch artists using useLazyAsyncData for SSR
const { data: artists, pending: loading } = await useLazyAsyncData(
  `genre-${route.params.genre}`,
  async () => {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, avatar_key, avatar_url, total_streams, is_verified, genres, created_at')
      .eq('status', 'active')
      .order('total_streams', { ascending: false })

    if (error) throw error

    // Filter by genre (case-insensitive match)
    const bandsData = (data || []) as any[]
    const filteredArtists = bandsData.filter(band => {
      if (!band.genres || !Array.isArray(band.genres)) return false
      return band.genres.some((g: string) =>
        g.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === genreSlug.value
      )
    })

    // Load avatar URLs in parallel
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

// After fetching artists, pick a random one for the banner
watch(artists, async (value) => {
  if (value?.length) {
    // Filter artists with avatars
    const artistsWithAvatars = value.filter(a => a.avatar_key || a.avatar_url)
    if (artistsWithAvatars.length > 0) {
      // Pick random artist
      const randomArtist = artistsWithAvatars[Math.floor(Math.random() * artistsWithAvatars.length)]
      // Get the avatar URL
      if (randomArtist.avatar_url) {
        bannerUrl.value = randomArtist.avatar_url
      } else if (randomArtist.avatar_key) {
        bannerUrl.value = await getCachedCoverUrl(randomArtist.avatar_key)
      }
    }
  }
}, { immediate: true })

// Filtered and sorted artists
const filteredArtists = computed(() => {
  let result = artists.value || []

  // Filter by search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(query))
  }

  // Sort
  switch (sortOption.value) {
    case 'name-desc':
      return [...result].sort((a, b) => b.name.localeCompare(a.name))
    case 'newest':
      return [...result].sort((a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    default: // 'name-asc'
      return [...result].sort((a, b) => a.name.localeCompare(b.name))
  }
})

// Shuffle play - plays random tracks from this genre
const playShuffled = async () => {
  shuffleLoading.value = true
  try {
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
    }>>(`/api/genres/${genreSlug.value}/tracks`, {
      query: { shuffle: 'true', limit: 30 },
    })

    if (tracks?.length) {
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
      await setQueue(queue, 0)
    }
  } catch (e) {
    console.error('Failed to play shuffled:', e)
  } finally {
    shuffleLoading.value = false
  }
}

// Play a specific artist's tracks
const playArtist = async (artist: Band) => {
  playingArtistId.value = artist.id
  try {
    // Fetch artist's tracks
    const { data: albums } = await client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        cover_key,
        tracks (
          id,
          title,
          audio_key,
          duration,
          track_number
        )
      `)
      .eq('band_id', artist.id)
      .eq('is_published', true)

    if (!albums?.length) return

    // Build queue from all tracks
    const allTracks: Array<{
      id: string
      title: string
      artist: string
      artistSlug: string
      albumTitle: string
      albumSlug: string
      coverUrl: string | null
      duration: number
      audioKey: string
    }> = []

    const albumsData = albums as any[]
    for (const album of albumsData) {
      const coverUrl = await getCachedCoverUrl(album.cover_key)
      for (const track of (album.tracks || [])) {
        if (track.audio_key) {
          allTracks.push({
            id: track.id,
            title: track.title,
            artist: artist.name,
            artistSlug: artist.slug,
            albumTitle: album.title,
            albumSlug: album.slug,
            coverUrl,
            duration: track.duration || 0,
            audioKey: track.audio_key,
          })
        }
      }
    }

    if (allTracks.length > 0) {
      await setQueue(allTracks, 0)
    }
  } catch (e) {
    console.error('Failed to play artist:', e)
  } finally {
    playingArtistId.value = null
  }
}

// Update page title
useHead({
  title: () => `${displayGenre.value} Artists - Fairtune`,
})
</script>
