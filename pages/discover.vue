<template>
  <div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- Hero Impact Section -->
    <HomeHeroImpact
      :is-logged-in="!!user"
      :is-subscribed="isSubscribed"
      :stats="impactStats"
      :loading="impactLoading"
      :has-impact="impactData?.hasImpact || false"
    />

    <!-- New From Your Artists -->
    <section
      v-if="user && (newFromArtistsLoading || newFromArtists.length > 0)"
      class="mb-12"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">
          New From Your Artists
        </h2>
        <NuxtLink
          to="/library/following"
          class="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
        >
          See all
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
      <HomeScrollRow v-if="newFromArtistsLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <USkeleton class="aspect-square rounded-lg mb-3" />
          <USkeleton class="h-4 w-3/4 mb-2" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </HomeScrollRow>
      <HomeScrollRow v-else>
        <div
          v-for="album in newFromArtists"
          :key="album.id"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
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
      </HomeScrollRow>
    </section>

    <!-- Continue Listening -->
    <section
      v-if="user && (recentActivityLoading || uniqueRecentAlbums.length > 0)"
      class="mb-12"
    >
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Continue Listening</h2>
      </div>
      <HomeScrollRow v-if="recentActivityLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <USkeleton class="aspect-square rounded-lg mb-3" />
          <USkeleton class="h-4 w-3/4 mb-2" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </HomeScrollRow>
      <HomeScrollRow v-else>
        <div
          v-for="album in uniqueRecentAlbums"
          :key="album.slug"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <AlbumCard
            :album="album"
            :cover-url="album.coverUrl"
            @play="() => navigateTo(`/${album.band?.slug}/${album.slug}`)"
          />
        </div>
      </HomeScrollRow>
    </section>

    <!-- Fresh This Week -->
    <section class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold text-zinc-100">Fresh This Week</h2>
          <p class="text-sm text-zinc-500">
            New arrivals, chronological. No algorithm.
          </p>
        </div>
        <NuxtLink
          to="/new-releases"
          class="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
        >
          See all
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
      <HomeScrollRow v-if="freshReleasesLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <USkeleton class="aspect-square rounded-lg mb-3" />
          <USkeleton class="h-4 w-3/4 mb-2" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </HomeScrollRow>
      <HomeScrollRow v-else>
        <div
          v-for="album in freshReleases"
          :key="album.id"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <AlbumCard
            :album="album"
            :cover-url="albumCovers[album.id]"
            :loading="loadingPlayId === album.id"
            @play="playAlbum"
          />
        </div>
      </HomeScrollRow>
    </section>

    <!-- Featured Albums (admin-curated) -->
    <section
      v-if="featuredAlbumsLoading || featuredAlbums.length > 0"
      class="mb-12"
    >
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Featured Albums</h2>
        <p class="text-sm text-zinc-500">
          {{ featuredAlbumsBlurb }}
        </p>
      </div>
      <HomeScrollRow v-if="featuredAlbumsLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <USkeleton class="aspect-square rounded-lg mb-3" />
          <USkeleton class="h-4 w-3/4 mb-2" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </HomeScrollRow>
      <HomeScrollRow v-else>
        <div
          v-for="album in featuredAlbums"
          :key="album.id"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <AlbumCard
            :album="album"
            :cover-url="albumCovers[album.id]"
            :loading="loadingPlayId === album.id"
            @play="playAlbum"
          />
        </div>
      </HomeScrollRow>
    </section>

    <!-- Featured Artists -->
    <section
      v-if="featuredArtistsLoading || featuredArtists.length > 0"
      class="mb-12"
    >
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Featured Artists</h2>
      </div>
      <HomeScrollRow v-if="featuredArtistsLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <USkeleton class="aspect-square rounded-full mb-2" />
          <USkeleton class="h-4 w-3/4 mb-2" />
        </div>
      </HomeScrollRow>
      <HomeScrollRow v-else>
        <div
          v-for="artist in featuredArtists"
          :key="artist.id"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <ArtistCard
            :artist="artist"
            :loading="loadingPlayId === artist.id"
            rounded
            @play="playArtist"
          />
        </div>
      </HomeScrollRow>
    </section>

    <!-- Curated Playlists -->
    <section
      v-if="curatedPlaylistsLoading || curatedPlaylists.length > 0"
      class="mb-12"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <UIcon name="i-heroicons-star" class="w-5 h-5 text-amber-400" />
          Curated Playlists
        </h2>
        <NuxtLink
          to="/playlists"
          class="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
        >
          See all
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
      <HomeScrollRow v-if="curatedPlaylistsLoading">
        <div
          v-for="i in 5"
          :key="i"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <USkeleton class="aspect-square rounded-lg mb-3" />
          <USkeleton class="h-4 w-3/4 mb-2" />
          <USkeleton class="h-3 w-1/2" />
        </div>
      </HomeScrollRow>
      <HomeScrollRow v-else>
        <div
          v-for="playlist in curatedPlaylists"
          :key="playlist.id"
          class="w-40 flex-shrink-0 snap-start md:w-auto"
        >
          <PlaylistCard
            :playlist="playlist"
            :covers="playlistCovers[playlist.id] || []"
            :loading="loadingPlayId === playlist.id"
            @play="playPlaylist"
          />
        </div>
      </HomeScrollRow>
    </section>

    <!-- Browse Genres -->
    <section class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Browse Genres</h2>
        <NuxtLink
          to="/genres"
          class="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
        >
          See all
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
      <div
        v-if="featuredGenresLoading"
        class="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        <USkeleton v-for="i in 6" :key="i" class="h-40 rounded-xl" />
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <FeaturedGenreCard
          v-for="genre in featuredGenres"
          :key="genre.slug"
          :genre="genre"
          :avatar-url="genreAvatars[genre.slug]"
        />
      </div>
    </section>

    <!-- Empty State -->
    <div v-if="showEmptyState" class="text-center py-20">
      <div
        class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center"
      >
        <UIcon
          name="i-heroicons-musical-note"
          class="w-10 h-10 text-violet-400"
        />
      </div>
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">No Music Yet</h2>
      <p class="text-zinc-400 mb-6">Be the first to upload your music!</p>
      <UButton color="violet" to="/dashboard/artist/new">
        Create Artist Profile
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database'
import type { Band } from '~/stores/band'
import type { RecentlyPlayedTrack } from '~/stores/recentActivity'

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

interface Playlist {
  id: string
  title: string
  description?: string | null
  cover_key?: string | null
  track_count: number
  is_curated?: boolean
  owner?: { id: string; display_name?: string | null }
  previewTracks?: Array<{ album?: { cover_key?: string | null } | null }>
}

interface FeaturedGenre {
  slug: string
  name: string
  artistCount?: number
  avatarKeys?: string[]
}

interface ImpactStats {
  monthlyEarnings: number
  artistsSupported: number
  hoursListened: number
  streamCount: number
  tipsCents?: number
  purchasesCents?: number
  tipCount?: number
  purchaseCount?: number
}

interface ImpactResponse {
  isLoggedIn: boolean
  isSubscribed: boolean
  stats: ImpactStats | null
  hasImpact: boolean
}

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()
const subscriptionStore = useSubscriptionStore()
const { isSubscribed } = storeToRefs(subscriptionStore)
const recentActivityStore = useRecentActivityStore()
const { recentlyPlayed, loadingRecentlyPlayed: recentActivityLoading } =
  storeToRefs(recentActivityStore)
const { fetchRecentlyPlayed } = recentActivityStore
const bandStore = useBandStore()
const { resolveAvatarUrls } = bandStore
const albumStore = useAlbumStore()
const { getCachedCoverUrl, getAlbumById } = albumStore
const playerStore = usePlayerStore()

const loadingPlayId = ref<string | null>(null)
const albumCovers = ref<Record<string, string>>({})
const playlistCovers = ref<Record<string, string[]>>({})
const genreAvatars = ref<Record<string, string>>({})

// Deduplicate recently played by album
const uniqueRecentAlbums = computed(() => {
  const seen = new Set<string>()
  const albums: Array<{
    id: string
    title: string
    slug: string
    band?: { name: string; slug: string }
    coverUrl?: string | null
  }> = []

  for (const track of recentlyPlayed.value as RecentlyPlayedTrack[]) {
    const key = `${track.artistSlug}/${track.albumSlug}`
    if (!seen.has(key) && track.albumSlug && track.albumTitle) {
      seen.add(key)
      albums.push({
        id: track.id, // Use track id as placeholder
        title: track.albumTitle,
        slug: track.albumSlug,
        band: { name: track.artistName, slug: track.artistSlug },
        coverUrl: track.coverUrl,
      })
    }
  }
  return albums.slice(0, 6)
})

// === DATA FETCHING ===

// 1. Impact Stats (client-only to ensure user session is available)
const { data: impactData, pending: impactLoading } = await useLazyAsyncData(
  'home-impact',
  async (): Promise<ImpactResponse> => {
    if (!user.value)
      return { isLoggedIn: false, isSubscribed: false, stats: null, hasImpact: false }
    try {
      return await $fetch<ImpactResponse>('/api/user/impact')
    } catch {
      return { isLoggedIn: true, isSubscribed: false, stats: null, hasImpact: false }
    }
  },
  { watch: [user], server: false },
)
const impactStats = computed(() => impactData.value?.stats || null)

// 2. New From Your Artists (client-only to ensure user session is available)
const { data: newFromArtistsData, pending: newFromArtistsLoading } =
  await useLazyAsyncData(
    'home-new-from-artists',
    async () => {
      if (!user.value) return []
      try {
        const result = await $fetch<{ albums: Album[] }>(
          '/api/user/feed/new-releases',
        )
        return result.albums || []
      } catch {
        return []
      }
    },
    { watch: [user], server: false },
  )
const newFromArtists = computed(() => newFromArtistsData.value || [])

// 3. Fresh This Week
const { data: freshReleasesData, pending: freshReleasesLoading } =
  await useLazyAsyncData('home-fresh-releases', async () => {
    try {
      const result = await $fetch<{ albums: Album[] }>('/api/releases/recent')
      return result.albums || []
    } catch {
      return []
    }
  })
const freshReleases = computed(() => freshReleasesData.value || [])

// 4. Featured Albums
const { data: featuredAlbumsData, pending: featuredAlbumsLoading } =
  await useLazyAsyncData('home-featured-albums', async () => {
    try {
      const result = await $fetch<{ albums: Album[]; blurb: string | null }>(
        '/api/albums/featured',
      )
      return { albums: result.albums || [], blurb: result.blurb }
    } catch {
      return { albums: [], blurb: null }
    }
  })
const featuredAlbums = computed(() => featuredAlbumsData.value?.albums || [])
const featuredAlbumsBlurb = computed(
  () => featuredAlbumsData.value?.blurb || 'Hand-picked by humans, not machines.',
)

// 5. Featured Artists
const { data: featuredArtistsData, pending: featuredArtistsLoading } =
  await useLazyAsyncData('home-featured-artists', async () => {
    try {
      const { data, error } = await client
        .from('bands')
        .select(
          'id, name, slug, theme_color, total_streams, is_verified, avatar_key, avatar_url',
        )
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('total_streams', { ascending: false })
        .limit(8)

      if (error) return []
      const artists = (data || []) as any[]
      await resolveAvatarUrls(artists)
      return artists as Band[]
    } catch {
      return []
    }
  })
const featuredArtists = computed(() => featuredArtistsData.value || [])

// 6. Curated Playlists
const { data: curatedPlaylistsData, pending: curatedPlaylistsLoading } =
  await useLazyAsyncData('home-curated-playlists', async () => {
    try {
      const result = await $fetch<{ playlists: Playlist[] }>(
        '/api/playlists/featured',
      )
      return result.playlists || []
    } catch {
      return []
    }
  })
const curatedPlaylists = computed(() => curatedPlaylistsData.value || [])

// 7. Featured Genres
const { data: featuredGenresData, pending: featuredGenresLoading } =
  await useLazyAsyncData('home-featured-genres', async () => {
    try {
      const result = await $fetch<{ featuredGenres: FeaturedGenre[] }>(
        '/api/genres/featured',
      )
      return result.featuredGenres || []
    } catch {
      return []
    }
  })
const featuredGenres = computed(() => featuredGenresData.value || [])

// Load cover URLs for albums
const loadAlbumCovers = async (albums: Album[]) => {
  for (const album of albums) {
    if (album.cover_key && !albumCovers.value[album.id]) {
      const url = await getCachedCoverUrl(album.cover_key)
      if (url) albumCovers.value[album.id] = url
    } else if (album.cover_url && !albumCovers.value[album.id]) {
      albumCovers.value[album.id] = album.cover_url
    }
  }
}

// Load covers when data changes (client-side only to avoid hydration mismatch)
const loadPlaylistCovers = async (playlists: Playlist[]) => {
  for (const playlist of playlists) {
    if (playlistCovers.value[playlist.id]) continue

    // If playlist has its own cover, use that
    if (playlist.cover_key) {
      const url = await getCachedCoverUrl(playlist.cover_key)
      if (url) playlistCovers.value[playlist.id] = [url]
      continue
    }

    // Otherwise build mosaic from preview tracks' album covers
    if (playlist.previewTracks?.length) {
      const coverUrls: string[] = []
      for (const track of playlist.previewTracks) {
        if (track.album?.cover_key) {
          const url = await getCachedCoverUrl(track.album.cover_key)
          if (url) coverUrls.push(url)
        }
      }
      if (coverUrls.length > 0) {
        playlistCovers.value[playlist.id] = coverUrls
      }
    }
  }
}

const loadGenreAvatars = async (genres: FeaturedGenre[]) => {
  for (const genre of genres) {
    if (genre.avatarKeys?.length && !genreAvatars.value[genre.slug]) {
      const url = await getCachedCoverUrl(genre.avatarKeys[0])
      if (url) genreAvatars.value[genre.slug] = url
    }
  }
}

// Watch for data changes (without immediate to avoid SSR issues)
watch([newFromArtists, freshReleases, featuredAlbums], () => {
  loadAlbumCovers([
    ...newFromArtists.value,
    ...freshReleases.value,
    ...featuredAlbums.value,
  ])
})

watch(curatedPlaylists, (playlists) => {
  loadPlaylistCovers(playlists)
})

watch(featuredGenres, (genres) => {
  loadGenreAvatars(genres)
})

// Empty state
const showEmptyState = computed(() => {
  if (freshReleasesLoading.value || featuredArtistsLoading.value) return false
  return freshReleases.value.length === 0 && featuredArtists.value.length === 0
})

// Play handlers
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

const playArtist = async (artist: Band) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = artist.id
  try {
    const { tracks } = await $fetch<{ tracks: any[] }>(
      `/api/artists/${artist.id}/tracks`,
      {
        query: { shuffle: true, limit: 20 },
      },
    )
    if (tracks?.length) {
      const queue = tracks.map((t: any) => ({
        id: t.id,
        title: t.title,
        artist: artist.name,
        artistSlug: artist.slug,
        albumTitle: t.album?.title || '',
        albumSlug: t.album?.slug || '',
        coverUrl: artist.avatar_url || null,
        duration: t.duration_seconds,
        audioKey: t.audio_key,
      }))
      await playerStore.setQueue(queue, 0)
    }
  } finally {
    loadingPlayId.value = null
  }
}

const playPlaylist = async (playlist: { id: string }) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = playlist.id
  try {
    const data = await $fetch<{ playlist_tracks: any[] }>(
      `/api/playlists/${playlist.id}`,
    )
    if (data.playlist_tracks?.length) {
      const queue = data.playlist_tracks
        .filter((pt: any) => pt.track?.audio_key)
        .map((pt: any) => ({
          id: pt.track.id,
          title: pt.track.title,
          artist: pt.track.album?.band?.name || '',
          artistSlug: pt.track.album?.band?.slug || '',
          albumTitle: pt.track.album?.title || '',
          albumSlug: pt.track.album?.slug || '',
          coverUrl: null as string | null,
          duration: pt.track.duration_seconds,
          audioKey: pt.track.audio_key,
        }))
      await playerStore.setQueue(queue, 0)
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

// Load recently played
onMounted(() => {
  if (user.value) fetchRecentlyPlayed(10)

  // Load covers on client-side only (after hydration)
  loadAlbumCovers([
    ...newFromArtists.value,
    ...freshReleases.value,
    ...featuredAlbums.value,
  ])
  loadPlaylistCovers(curatedPlaylists.value)
  loadGenreAvatars(featuredGenres.value)
})

watch(user, (newUser) => {
  if (newUser) fetchRecentlyPlayed(10)
})

// Pull to refresh
usePullToRefresh(async () => {
  if (user.value) await fetchRecentlyPlayed(10, true)
})

// SEO
useHead({
  title: 'Your Scene | Fairtune',
  meta: [
    {
      name: 'description',
      content:
        'Discover independent artists and new music releases on Fairtune. Stream music that directly supports artists.',
    },
  ],
})
</script>
