<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Discover</h1>
      <p class="text-zinc-400">Find your next favorite artist</p>
    </div>

    <!-- New Releases Section (loads independently) -->
    <section class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">New Releases</h2>
      </div>
      <!-- Loading skeleton -->
      <div v-if="loadingReleases" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="i in 5" :key="`release-${i}`" class="space-y-2">
          <div class="w-full pb-[100%] relative">
            <div class="absolute inset-0 rounded-lg skeleton"></div>
          </div>
          <div class="h-5 skeleton w-full"></div>
          <div class="h-4 skeleton w-2/3"></div>
        </div>
      </div>
      <!-- Content -->
      <div v-else-if="newReleases.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
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
            <!-- Play button overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-2 right-2">
                <UButton
                  color="violet"
                  size="lg"
                  :icon="loadingPlayId === album.id ? undefined : 'i-heroicons-play-solid'"
                  :loading="loadingPlayId === album.id"
                  :ui="{ rounded: 'rounded-full', padding: { lg: 'p-3' } }"
                  class="shadow-lg"
                  @click.prevent.stop="playAlbum(album)"
                />
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

    <!-- Featured Playlists Section (loads independently) -->
    <section v-if="loadingPlaylists || featuredPlaylists.length > 0" class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <UIcon name="i-heroicons-star" class="w-5 h-5 text-violet-400" />
          Featured Playlists
        </h2>
      </div>
      <!-- Loading skeleton -->
      <div v-if="loadingPlaylists" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="i in 5" :key="`playlist-${i}`" class="space-y-2">
          <div class="w-full pb-[100%] relative">
            <div class="absolute inset-0 rounded-lg skeleton"></div>
          </div>
          <div class="h-5 skeleton w-3/4"></div>
          <div class="h-4 skeleton w-1/2"></div>
        </div>
      </div>
      <!-- Content -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <PlaylistCard
          v-for="playlist in featuredPlaylists"
          :key="playlist.id"
          :playlist="playlist"
          :covers="playlistCovers[playlist.id] || []"
          :loading="loadingPlayId === playlist.id"
          icon="i-heroicons-queue-list"
          @play="playFeaturedPlaylist"
        />
      </div>
    </section>

    <!-- Featured Artists Section (loads independently) -->
    <section v-if="loadingFeatured || featuredArtists.length > 0" class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Featured Artists</h2>
      </div>
      <!-- Loading skeleton -->
      <div v-if="loadingFeatured" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="`featured-${i}`" class="space-y-2">
          <div class="w-full pb-[100%] relative">
            <div class="absolute inset-0 rounded-full skeleton"></div>
          </div>
          <div class="h-5 skeleton w-3/4 mx-auto"></div>
          <div class="h-4 skeleton w-1/2 mx-auto"></div>
        </div>
      </div>
      <!-- Content -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <ArtistCard
          v-for="artist in featuredArtists"
          :key="artist.id"
          :artist="artist"
          :loading="loadingPlayId === artist.id"
          @play="playArtist"
        />
      </div>
    </section>

    <!-- Recently Played Section (for logged-in users, loads independently) -->
    <section v-if="user && (loadingRecentlyPlayed || recentlyPlayed.length > 0)" class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-violet-400" />
          Recently Played
        </h2>
        <NuxtLink to="/library?tab=history" class="text-sm text-violet-400 hover:text-violet-300">
          View All
        </NuxtLink>
      </div>
      <!-- Loading skeleton -->
      <div v-if="loadingRecentlyPlayed" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div v-for="i in 5" :key="`recent-${i}`" class="space-y-2">
          <div class="w-full pb-[100%] relative">
            <div class="absolute inset-0 rounded-lg skeleton"></div>
          </div>
          <div class="h-5 skeleton w-full"></div>
          <div class="h-4 skeleton w-2/3"></div>
        </div>
      </div>
      <!-- Content -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div
          v-for="track in recentlyPlayed.slice(0, 5)"
          :key="track.id"
          class="group card-interactive cursor-pointer"
          @click="playRecentTrack(track)"
        >
          <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300">
            <div class="absolute inset-0">
              <img
                v-if="track.coverUrl"
                v-fade-image
                :src="track.coverUrl"
                :alt="track.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
              </div>
            </div>
            <!-- Play overlay -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div class="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center">
                <UIcon name="i-heroicons-play" class="w-6 h-6 text-white ml-0.5" />
              </div>
            </div>
          </div>
          <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ track.title }}</p>
          <NuxtLink
            :to="`/${track.artistSlug}`"
            class="text-sm text-zinc-400 truncate block hover:text-violet-400"
            @click.stop
          >
            {{ track.artistName }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- All Artists Section (loads independently) -->
    <section class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">All Artists</h2>
        <NuxtLink to="/artists" class="text-sm text-violet-400 hover:text-violet-300">
          View All
        </NuxtLink>
      </div>
      <!-- Loading skeleton -->
      <div v-if="loadingAllArtists" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="`artist-${i}`" class="space-y-2">
          <div class="w-full pb-[100%] relative">
            <div class="absolute inset-0 rounded-full skeleton"></div>
          </div>
          <div class="h-5 skeleton w-3/4 mx-auto"></div>
          <div class="h-4 skeleton w-1/2 mx-auto"></div>
        </div>
      </div>
      <!-- Content -->
      <template v-else>
        <div v-if="allArtists.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <ArtistCard
            v-for="artist in allArtists"
            :key="artist.id"
            :artist="artist"
            :loading="loadingPlayId === artist.id"
            @play="playArtist"
          />
        </div>

        <!-- Load More -->
        <div v-if="hasMoreArtists" class="mt-8 text-center">
          <UButton color="gray" variant="outline" :loading="loadingMore" @click="loadMoreArtists">
            Load More Artists
          </UButton>
        </div>
      </template>
    </section>

    <!-- Empty State (only show when all main sections are loaded and empty) -->
    <div
      v-if="!loadingReleases && !loadingAllArtists && allArtists.length === 0 && newReleases.length === 0"
      class="text-center py-20"
    >
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-musical-note" class="w-10 h-10 text-violet-400" />
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
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'
import type { RecentlyPlayedTrack } from '~/composables/useRecentActivity'

interface FeaturedPlaylist {
  id: string
  title: string
  description: string | null
  track_count: number
  cover_key: string | null
  is_curated: boolean
  owner: {
    id: string
    display_name: string | null
  } | null
  previewTracks: Array<{
    id: string
    album: { cover_key: string | null }
  }>
}

const {
  getFeaturedArtists,
  getNewReleases,
  getAllArtists,
  loadMoreArtists: loadMoreArtistsFromComposable,
} = useDiscover()

const { getCachedCoverUrl, getAlbumById } = useAlbum()
const { fetchRecentlyPlayed, recentlyPlayed, loadingRecentlyPlayed } = useRecentActivity()
const user = useSupabaseUser()
const { setQueue, playPlaylist } = usePlayer()

// Independent loading states for each section
const loadingReleases = ref(true)
const loadingPlaylists = ref(true)
const loadingFeatured = ref(true)
const loadingAllArtists = ref(true)
const loadingPlayId = ref<string | null>(null)
const loadingMore = ref(false)

const featuredArtists = ref<Band[]>([])
const newReleases = ref<Album[]>([])
const allArtists = ref<Band[]>([])
const albumCovers = ref<Record<string, string>>({})
const featuredPlaylists = ref<FeaturedPlaylist[]>([])
const playlistCovers = ref<Record<string, string[]>>({})
const hasMoreArtists = ref(false)
const artistPage = ref(0)

// Load new releases independently
const loadNewReleases = async (forceRefresh = false) => {
  loadingReleases.value = true
  try {
    const releases = await getNewReleases(forceRefresh)
    newReleases.value = releases.albums
    albumCovers.value = releases.covers
  } catch (e) {
    console.error('Failed to load new releases:', e)
  } finally {
    loadingReleases.value = false
  }
}

// Load featured playlists independently
const loadFeaturedPlaylists = async () => {
  loadingPlaylists.value = true
  try {
    const data = await $fetch<{ playlists: FeaturedPlaylist[] }>('/api/playlists/featured')
    featuredPlaylists.value = data.playlists

    // Load cover images from preview tracks (for mosaic) - in parallel
    await Promise.all(
      data.playlists.map(async (playlist) => {
        const covers: string[] = []
        const seen = new Set<string>()

        for (const track of playlist.previewTracks || []) {
          if (track.album?.cover_key && !seen.has(track.album.cover_key)) {
            seen.add(track.album.cover_key)
            const url = await getCachedCoverUrl(track.album.cover_key)
            if (url) {
              covers.push(url)
              if (covers.length >= 4) break
            }
          }
        }

        playlistCovers.value[playlist.id] = covers
      })
    )
  } catch (e) {
    console.error('Failed to load featured playlists:', e)
  } finally {
    loadingPlaylists.value = false
  }
}

// Load featured artists independently
const loadFeaturedArtists = async (forceRefresh = false) => {
  loadingFeatured.value = true
  try {
    featuredArtists.value = await getFeaturedArtists(forceRefresh)
  } catch (e) {
    console.error('Failed to load featured artists:', e)
  } finally {
    loadingFeatured.value = false
  }
}

// Load all artists independently
const loadAllArtistsSection = async (forceRefresh = false) => {
  loadingAllArtists.value = true
  try {
    const artists = await getAllArtists(forceRefresh)
    allArtists.value = artists.artists
    hasMoreArtists.value = artists.hasMore
    artistPage.value = 0
  } catch (e) {
    console.error('Failed to load all artists:', e)
  } finally {
    loadingAllArtists.value = false
  }
}

// Load recently played for logged-in users
const loadRecentlyPlayed = async () => {
  if (user.value) {
    await fetchRecentlyPlayed(10)
  }
}

// Load all data - each section loads independently in parallel
const loadData = async (forceRefresh = false) => {
  // Start all loads in parallel - each section will show as soon as it's ready
  loadNewReleases(forceRefresh)
  loadFeaturedPlaylists()
  loadFeaturedArtists(forceRefresh)
  loadAllArtistsSection(forceRefresh)
  loadRecentlyPlayed()
}

// Play a recently played track
const playRecentTrack = (track: RecentlyPlayedTrack) => {
  const playableTracks = recentlyPlayed.value.filter(t => t.audioKey)
  if (playableTracks.length === 0) return

  const queue = playableTracks.map(t => ({
    id: t.id,
    title: t.title,
    artist: t.artistName,
    artistSlug: t.artistSlug,
    albumTitle: t.albumTitle,
    albumSlug: t.albumSlug,
    coverUrl: t.coverUrl || null,
    duration: t.duration,
    audioKey: t.audioKey!,
  }))

  const trackIndex = queue.findIndex(t => t.id === track.id)
  setQueue(queue, trackIndex >= 0 ? trackIndex : 0)
}

// Play an album
const playAlbum = async (album: Album) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = album.id

  try {
    const fullAlbum = await getAlbumById(album.id)
    if (!fullAlbum?.tracks?.length) return

    let coverUrl: string | null = albumCovers.value[album.id] || null
    if (!coverUrl && fullAlbum.cover_key) {
      coverUrl = await getCachedCoverUrl(fullAlbum.cover_key)
    }

    const playableTracks = fullAlbum.tracks
      .filter(t => t.audio_key)
      .map(t => ({
        id: t.id,
        title: t.title,
        duration_seconds: t.duration_seconds,
        audio_key: t.audio_key,
        coverUrl,
        album: {
          id: fullAlbum.id,
          title: fullAlbum.title,
          slug: fullAlbum.slug,
          band: fullAlbum.band || { id: album.band_id, name: album.band?.name || '', slug: album.band?.slug || '' },
        },
      }))

    if (playableTracks.length > 0) {
      await playPlaylist(playableTracks, 0)
    }
  } catch (e) {
    console.error('Failed to play album:', e)
  } finally {
    loadingPlayId.value = null
  }
}

// Play a featured playlist
const playFeaturedPlaylist = async (playlist: FeaturedPlaylist) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = playlist.id

  try {
    const data = await $fetch<{
      id: string
      title: string
      playlist_tracks: Array<{
        track: {
          id: string
          title: string
          duration_seconds: number
          audio_key: string | null
          album: {
            id: string
            title: string
            slug: string
            cover_key: string | null
            band: { id: string; name: string; slug: string }
          }
        }
      }>
    }>(`/api/playlists/${playlist.id}`)

    if (!data?.playlist_tracks?.length) return

    const playableTracks = await Promise.all(
      data.playlist_tracks
        .filter(item => item.track?.audio_key)
        .map(async (item) => ({
          id: item.track.id,
          title: item.track.title,
          duration_seconds: item.track.duration_seconds,
          audio_key: item.track.audio_key,
          coverUrl: await getCachedCoverUrl(item.track.album?.cover_key),
          album: {
            id: item.track.album.id,
            title: item.track.album.title,
            slug: item.track.album.slug,
            band: item.track.album.band,
          },
        }))
    )

    if (playableTracks.length > 0) {
      await playPlaylist(playableTracks, 0)
    }
  } catch (e) {
    console.error('Failed to play playlist:', e)
  } finally {
    loadingPlayId.value = null
  }
}

// Play random tracks from an artist
const playArtist = async (artist: Band) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = artist.id

  try {
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

onMounted(() => {
  loadData()
})
</script>
