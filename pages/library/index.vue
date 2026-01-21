<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-zinc-100">Your Library</h1>
      <p class="text-zinc-400 mt-1">Artists, albums, playlists, and tracks you've saved</p>
    </div>

    <!-- Tab Selector -->
    <PillTabs v-model="activeTab" :tabs="tabs" sticky>
      <template #playlists>
          <!-- Loading Skeleton -->
          <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div v-for="i in 5" :key="i">
              <USkeleton class="aspect-square rounded-lg mb-3" />
              <USkeleton class="h-5 w-3/4 mb-1" />
              <USkeleton class="h-4 w-1/2" />
            </div>
          </div>

          <!-- Create Playlist Button -->
          <div v-if="!loading && (userPlaylists.length > 0 || tracks.length > 0)" class="flex justify-start mb-6">
            <UButton color="violet" variant="soft" @click="showCreatePlaylist = true">
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Create Playlist
            </UButton>
          </div>

          <!-- Empty State (no playlists and no liked tracks) -->
          <EmptyState
            v-if="!loading && userPlaylists.length === 0 && tracks.length === 0"
            icon="i-heroicons-queue-list"
            title="No playlists yet"
            description="Create playlists to organize your favorite tracks and share them with friends."
            action-label="Create Playlist"
            action-icon="i-heroicons-plus"
            @action="showCreatePlaylist = true"
          />

          <!-- Playlist Grid (includes Liked Songs as first item) -->
          <div v-else-if="!loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <!-- Liked Songs Card (first in grid if there are liked tracks) -->
            <NuxtLink v-if="tracks.length > 0" to="/library/liked" class="group">
              <div class="relative mb-3 group-hover:scale-[1.02] transition-all">
                <!-- Use PlaylistCover with heart icon -->
                <PlaylistCover :covers="[]" icon="i-heroicons-heart-solid" />
                <!-- Overlay with info and play button -->
                <div class="absolute inset-0 rounded-lg bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
                  <div></div>
                  <!-- Bottom info and play button -->
                  <div class="flex items-end justify-between">
                    <div class="min-w-0 flex-1 mr-2">
                      <h3 class="font-semibold text-white text-lg truncate">Liked Songs</h3>
                      <p class="text-white/70 text-sm">{{ tracks.length }} {{ tracks.length === 1 ? 'song' : 'songs' }}</p>
                    </div>
                    <UButton
                      color="violet"
                      size="lg"
                      :icon="loadingPlayId === 'liked' ? undefined : 'i-heroicons-play-solid'"
                      :loading="loadingPlayId === 'liked'"
                      :ui="{ rounded: 'rounded-full', padding: { lg: 'p-3' } }"
                      :class="loadingPlayId === 'liked' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                      class="transition-opacity shadow-lg shrink-0"
                      @click.prevent.stop="playLikedSongs"
                    />
                  </div>
                </div>
              </div>
            </NuxtLink>

            <!-- Regular Playlists -->
            <PlaylistCard
              v-for="playlist in userPlaylists"
              :key="playlist.id"
              :playlist="playlist"
              :covers="playlistCovers[playlist.id] || []"
              :loading="loadingPlayId === playlist.id"
              overlay
              @play="(p) => playPlaylistById(p.id)"
            />
          </div>
      </template>

      <template #artists>
          <!-- Loading Skeleton -->
          <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div v-for="i in 5" :key="i" class="text-center">
              <USkeleton class="w-32 md:w-40 h-32 md:h-40 rounded-full mx-auto mb-3" />
              <USkeleton class="h-5 w-24 mx-auto mb-1" />
              <USkeleton class="h-4 w-16 mx-auto" />
            </div>
          </div>

          <EmptyState
            v-else-if="artists.length === 0"
            icon="i-heroicons-user-group"
            title="No followed artists yet"
            description="Follow your favorite artists to see them here. You'll be notified when they release new music."
            action-label="Discover Artists"
            action-to="/discover"
          />

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <NuxtLink
              v-for="item in artists"
              :key="item.band.id"
              :to="`/${item.band.slug}`"
              class="group text-center"
            >
              <div class="aspect-square rounded-full overflow-hidden bg-zinc-800 mb-3 mx-auto w-32 md:w-40 shadow-lg group-hover:shadow-xl transition-shadow ring-2 ring-transparent group-hover:ring-violet-500/50">
                <img
                  v-if="artistAvatars[item.band.id]"
                  v-fade-image
                  :src="artistAvatars[item.band.id]"
                  :alt="item.band.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-600">
                  <span class="text-3xl font-bold text-white">{{ item.band.name.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
              <h3 class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                {{ item.band.name }}
              </h3>
              <p class="text-sm text-zinc-500">
                {{ item.band.location || 'Artist' }}
              </p>
            </NuxtLink>
          </div>
      </template>

      <template #albums>
          <!-- Loading Skeleton -->
          <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <div v-for="i in 5" :key="i">
              <USkeleton class="aspect-square rounded-lg mb-3" />
              <USkeleton class="h-5 w-3/4 mb-1" />
              <USkeleton class="h-4 w-1/2" />
            </div>
          </div>

          <EmptyState
            v-else-if="albums.length === 0"
            icon="i-heroicons-square-3-stack-3d"
            title="No saved albums yet"
            description="Save albums to your library to access them quickly and show support for the artists."
            action-label="Discover Music"
            action-to="/discover"
          />

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <NuxtLink
              v-for="item in albums"
              :key="item.album.id"
              :to="`/${item.album.band.slug}/${item.album.slug}`"
              class="group"
            >
              <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <img
                  v-if="albumCovers[item.album.id]"
                  v-fade-image
                  :src="albumCovers[item.album.id]"
                  :alt="item.album.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
                </div>
              </div>
              <h3 class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
                {{ item.album.title }}
              </h3>
              <p class="text-sm text-zinc-400 truncate">
                {{ item.album.band.name }}
              </p>
            </NuxtLink>
          </div>
      </template>

      <template #tracks>
          <!-- Loading Skeleton -->
          <div v-if="loading" class="space-y-1">
            <div v-for="i in 8" :key="i" class="flex items-center gap-4 p-3">
              <USkeleton class="w-8 h-4" />
              <USkeleton class="w-10 h-10 rounded" />
              <div class="flex-1">
                <USkeleton class="h-5 w-40 mb-1" />
                <USkeleton class="h-4 w-24" />
              </div>
              <USkeleton class="hidden md:block h-4 w-32" />
              <USkeleton class="w-12 h-4" />
            </div>
          </div>

          <EmptyState
            v-else-if="tracks.length === 0"
            icon="i-heroicons-heart"
            title="No liked tracks yet"
            description="Like tracks by clicking the heart icon while browsing or playing music."
            action-label="Discover Music"
            action-to="/discover"
          />

          <div v-else class="space-y-1">
            <div
              v-for="(item, index) in tracks"
              :key="item.track.id"
              class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
            >
              <!-- Index / Play -->
              <div class="w-8 text-center shrink-0">
                <UIcon
                  v-if="loadingPlayId === item.track.id"
                  name="i-heroicons-arrow-path"
                  class="w-4 h-4 text-violet-400 animate-spin"
                />
                <template v-else>
                  <span class="text-sm text-zinc-500 group-hover:hidden">{{ index + 1 }}</span>
                  <UIcon
                    name="i-heroicons-play"
                    class="w-4 h-4 text-zinc-100 hidden group-hover:inline cursor-pointer"
                    @click.prevent="playTrack(item)"
                  />
                </template>
              </div>

              <!-- Cover -->
              <div class="w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
                <img
                  v-if="trackCovers[item.track.id]"
                  :src="trackCovers[item.track.id]"
                  :alt="item.track.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
                </div>
              </div>

              <!-- Track Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ item.track.title }}</p>
                <NuxtLink
                  :to="`/${item.track.album.band.slug}`"
                  class="text-sm text-zinc-400 hover:text-violet-400 truncate block"
                  @click.stop
                >
                  {{ item.track.album.band.name }}
                </NuxtLink>
              </div>

              <!-- Album -->
              <NuxtLink
                :to="`/${item.track.album.band.slug}/${item.track.album.slug}`"
                class="hidden md:block text-sm text-zinc-500 hover:text-zinc-300 truncate max-w-[200px]"
                @click.stop
              >
                {{ item.track.album.title }}
              </NuxtLink>

              <!-- Duration -->
              <span class="text-sm text-zinc-500 w-12 text-right">
                {{ formatDuration(item.track.duration_seconds) }}
              </span>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <!-- Heart (always filled since it's in liked tracks) -->
                <UButton
                  color="red"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-heart-solid"
                  class="opacity-60 hover:opacity-100"
                  @click.stop="handleUnlike(item.track.id)"
                />
                <!-- Desktop: Dropdown menu -->
                <TrackActionsMenu
                  :track="getPlayerTrack(item)"
                  :show-on-hover="true"
                  class="hidden md:block"
                />
                <!-- Mobile: Opens bottom sheet -->
                <UButton
                  color="gray"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-ellipsis-vertical"
                  class="md:hidden"
                  @click.stop="openActionsSheet(item)"
                />
              </div>
            </div>
          </div>
      </template>

      <template #history>
          <!-- Loading Skeleton -->
          <div v-if="loadingHistory" class="space-y-1">
            <div v-for="i in 8" :key="i" class="flex items-center gap-4 p-3">
              <USkeleton class="w-8 h-4" />
              <USkeleton class="w-10 h-10 rounded" />
              <div class="flex-1">
                <USkeleton class="h-5 w-40 mb-1" />
                <USkeleton class="h-4 w-24" />
              </div>
              <USkeleton class="hidden md:block h-4 w-32" />
              <USkeleton class="hidden sm:block h-4 w-20" />
            </div>
          </div>

          <EmptyState
            v-else-if="recentlyPlayed.length === 0"
            icon="i-heroicons-clock"
            title="No listening history"
            description="Start listening to music to see your history here."
            action-label="Discover Music"
            action-to="/discover"
          />

          <div v-else class="space-y-1">
            <div
              v-for="(track, index) in recentlyPlayed"
              :key="`${track.id}-${index}`"
              class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group cursor-pointer"
              @click="playHistoryTrack(track, index)"
            >
              <!-- Index / Play -->
              <div class="w-8 text-center shrink-0">
                <UIcon
                  v-if="loadingPlayId === `history-${track.id}`"
                  name="i-heroicons-arrow-path"
                  class="w-4 h-4 text-violet-400 animate-spin"
                />
                <template v-else>
                  <span class="text-sm text-zinc-500 group-hover:hidden">{{ index + 1 }}</span>
                  <UIcon
                    name="i-heroicons-play"
                    class="w-4 h-4 text-zinc-100 hidden group-hover:inline"
                  />
                </template>
              </div>

              <!-- Cover -->
              <div class="w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
                <img
                  v-if="track.coverUrl"
                  :src="track.coverUrl"
                  :alt="track.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
                </div>
              </div>

              <!-- Track Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ track.title }}</p>
                <NuxtLink
                  :to="`/${track.artistSlug}`"
                  class="text-sm text-zinc-400 hover:text-violet-400 truncate block"
                  @click.stop
                >
                  {{ track.artistName }}
                </NuxtLink>
              </div>

              <!-- Album -->
              <NuxtLink
                :to="`/${track.artistSlug}/${track.albumSlug}`"
                class="hidden md:block text-sm text-zinc-500 hover:text-zinc-300 truncate max-w-[200px]"
                @click.stop
              >
                {{ track.albumTitle }}
              </NuxtLink>

              <!-- Played time -->
              <span class="text-sm text-zinc-500 hidden sm:block">
                {{ formatRelativeTime(track.playedAt) }}
              </span>
            </div>
          </div>
      </template>
    </PillTabs>

    <!-- Create Playlist Modal -->
    <UModal v-model="showCreatePlaylist">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Create Playlist</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="showCreatePlaylist = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Name" required>
            <UInput
              v-model="newPlaylistTitle"
              placeholder="My Playlist"
              autofocus
            />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea
              v-model="newPlaylistDescription"
              placeholder="Add an optional description..."
              :rows="3"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="showCreatePlaylist = false"
            >
              Cancel
            </UButton>
            <UButton
              color="violet"
              :loading="creatingPlaylist"
              :disabled="!newPlaylistTitle.trim()"
              @click="handleCreatePlaylist"
            >
              Create
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Mobile Track Actions Sheet -->
    <TrackActionsSheet
      v-if="selectedTrack"
      v-model="showActionsSheet"
      :track="selectedTrack"
    />
  </div>
</template>

<script setup lang="ts">
import type { SavedAlbum, LikedTrack, FollowedArtist } from '~/composables/useLibrary'
import type { PlayerTrack } from '~/composables/usePlayer'
import type { RecentlyPlayedTrack } from '~/composables/useRecentActivity'

definePageMeta({
  middleware: 'auth',
})

const { getStreamUrl, getCachedCoverUrl } = useAlbum()
const { getSavedAlbums, getLikedTracks, getFollowedArtists, unlikeTrack } = useLibrary()
const { playTrackFromLibrary, playPlaylist, isLoading: playerLoading, setQueue } = usePlayer()
const { playlists: userPlaylists, fetchPlaylists, createPlaylist, getPlaylist } = usePlaylist()
const { fetchRecentlyPlayed, recentlyPlayed } = useRecentActivity()
const route = useRoute()
const loadingHistory = ref(false)
const activeTab = ref(0)

const artistAvatars = ref<Record<string, string>>({})
const albumCovers = ref<Record<string, string>>({})
const trackCovers = ref<Record<string, string>>({})
const playlistCovers = ref<Record<string, string[]>>({})
const loadingPlayId = ref<string | null>(null) // Track which playlist/liked is loading

// Create playlist modal
const showCreatePlaylist = ref(false)
const newPlaylistTitle = ref('')
const newPlaylistDescription = ref('')
const creatingPlaylist = ref(false)

// Track actions sheet
const showActionsSheet = ref(false)
const selectedTrack = ref<PlayerTrack | null>(null)

// Fetch library data using Nuxt's useLazyAsyncData with caching
const nuxtApp = useNuxtApp()
const { data: libraryData, pending: loading, refresh: refreshLibrary } = await useLazyAsyncData(
  'user-library',
  async () => {
    const [artistsData, albumsData, tracksData] = await Promise.all([
      getFollowedArtists(),
      getSavedAlbums(),
      getLikedTracks(),
      fetchPlaylists(),
    ])
    return {
      artists: artistsData,
      albums: albumsData,
      tracks: tracksData,
    }
  },
  {
    server: false,
    default: () => ({
      artists: [] as FollowedArtist[],
      albums: [] as SavedAlbum[],
      tracks: [] as LikedTrack[],
    }),
    // Return cached data if available to avoid skeleton on revisit
    getCachedData: (key) => nuxtApp.payload.data[key] || nuxtApp.static.data[key],
  }
)

// Computed accessors for library data
const artists = computed(() => libraryData.value?.artists ?? [])
const albums = computed(() => libraryData.value?.albums ?? [])
const tracks = computed(() => libraryData.value?.tracks ?? [])

const handleCreatePlaylist = async () => {
  if (!newPlaylistTitle.value.trim()) return

  creatingPlaylist.value = true
  const playlist = await createPlaylist(newPlaylistTitle.value, newPlaylistDescription.value)
  creatingPlaylist.value = false

  if (playlist) {
    showCreatePlaylist.value = false
    newPlaylistTitle.value = ''
    newPlaylistDescription.value = ''
    // Navigate to the new playlist
    navigateTo(`/playlist/${playlist.id}`)
  }
}

const tabs = computed(() => [
  { slot: 'playlists', label: `Playlists (${userPlaylists.value.length})`, icon: 'i-heroicons-queue-list' },
  { slot: 'artists', label: `Artists (${artists.value.length})`, icon: 'i-heroicons-user-group' },
  { slot: 'albums', label: `Albums (${albums.value.length})`, icon: 'i-heroicons-square-3-stack-3d' },
  { slot: 'tracks', label: `Liked Songs (${tracks.value.length})`, icon: 'i-heroicons-heart' },
  { slot: 'history', label: 'History', icon: 'i-heroicons-clock' },
])

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Play a track from history
const playHistoryTrack = async (track: RecentlyPlayedTrack, index: number) => {
  if (loadingPlayId.value) return
  if (!track.audioKey) return // Can't play without audio

  loadingPlayId.value = `history-${track.id}`

  try {
    // Filter to only tracks with audioKey
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

    // Find the index in the filtered queue
    const queueIndex = queue.findIndex(t => t.id === track.id)
    await setQueue(queue, queueIndex >= 0 ? queueIndex : 0)
  } finally {
    loadingPlayId.value = null
  }
}

const handleUnlike = async (trackId: string) => {
  await unlikeTrack(trackId)
  // Refresh to get updated tracks list
  await refreshLibrary()
}

const playTrack = async (item: LikedTrack) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = item.track.id
  try {
    await playTrackFromLibrary(item.track, trackCovers.value[item.track.id] || null)
  } finally {
    loadingPlayId.value = null
  }
}

// Convert liked track to PlayerTrack format for menus
const getPlayerTrack = (item: LikedTrack): PlayerTrack => {
  return {
    id: item.track.id,
    title: item.track.title,
    artist: item.track.album.band.name,
    artistSlug: item.track.album.band.slug,
    albumTitle: item.track.album.title,
    albumSlug: item.track.album.slug,
    coverUrl: trackCovers.value[item.track.id] || null,
    audioUrl: '', // Will be fetched lazily when needed
    audioKey: item.track.audio_key || undefined,
    duration: item.track.duration_seconds,
  }
}

// Open mobile actions sheet
const openActionsSheet = async (item: LikedTrack) => {
  const playerTrack = getPlayerTrack(item)
  if (item.track.audio_key) {
    try {
      playerTrack.audioUrl = await getStreamUrl(item.track.audio_key)
    } catch (e) {
      console.error('Failed to get stream URL:', e)
    }
  }
  selectedTrack.value = playerTrack
  showActionsSheet.value = true
}

// Play all liked songs as a playlist
const playLikedSongs = async () => {
  if (tracks.value.length === 0 || loadingPlayId.value) return
  loadingPlayId.value = 'liked'
  try {
    const playableTracks = tracks.value.map((item) => ({
      ...item.track,
      coverUrl: trackCovers.value[item.track.id] || null,
    }))

    await playPlaylist(playableTracks, 0)
  } finally {
    loadingPlayId.value = null
  }
}

// Play a playlist by ID (fetches tracks and plays)
const playPlaylistById = async (playlistId: string) => {
  if (loadingPlayId.value) return
  loadingPlayId.value = playlistId
  try {
    const playlist = await getPlaylist(playlistId)
    if (!playlist?.playlist_tracks?.length) return

    // Load cover URLs for tracks (using cache)
    const playableTracks = await Promise.all(
      playlist.playlist_tracks.map(async (item) => {
        let coverUrl: string | null = null
        if (item.track.album.cover_key) {
          coverUrl = await getCachedCoverUrl(item.track.album.cover_key)
        } else if (item.track.album.cover_url) {
          coverUrl = item.track.album.cover_url
        }
        return {
          ...item.track,
          coverUrl,
        }
      })
    )

    await playPlaylist(playableTracks, 0)
  } catch (e) {
    console.error('Failed to play playlist:', e)
  } finally {
    loadingPlayId.value = null
  }
}

// Image loading functions - defined before the watch that uses them
const loadArtistAvatars = async () => {
  const currentArtists = artists.value
  await Promise.all(
    currentArtists.map(async (item) => {
      if (item.band.avatar_key) {
        const url = await getCachedCoverUrl(item.band.avatar_key)
        if (url) artistAvatars.value[item.band.id] = url
      } else if (item.band.avatar_url) {
        artistAvatars.value[item.band.id] = item.band.avatar_url
      }
    })
  )
}

const loadAlbumCovers = async () => {
  const currentAlbums = albums.value
  await Promise.all(
    currentAlbums.map(async (item) => {
      if (item.album.cover_key) {
        const url = await getCachedCoverUrl(item.album.cover_key)
        if (url) albumCovers.value[item.album.id] = url
      } else if (item.album.cover_url) {
        albumCovers.value[item.album.id] = item.album.cover_url
      }
    })
  )
}

const loadTrackCovers = async () => {
  const currentTracks = tracks.value
  await Promise.all(
    currentTracks.map(async (item) => {
      if (item.track.album.cover_key) {
        const url = await getCachedCoverUrl(item.track.album.cover_key)
        if (url) trackCovers.value[item.track.id] = url
      } else if (item.track.album.cover_url) {
        trackCovers.value[item.track.id] = item.track.album.cover_url
      }
    })
  )
}

const loadPlaylistCovers = async () => {
  // Load covers for all playlists in parallel
  await Promise.all(
    userPlaylists.value.map(async (playlist) => {
      try {
        const response = await $fetch<{ covers: Array<{ url?: string; key?: string }> }>(
          `/api/playlists/${playlist.id}/covers`
        )

        // Convert cover keys to URLs (using cache)
        const coverUrls: string[] = []
        for (const cover of response.covers) {
          if (cover.key) {
            const url = await getCachedCoverUrl(cover.key)
            if (url) coverUrls.push(url)
          } else if (cover.url) {
            coverUrls.push(cover.url)
          }
        }

        playlistCovers.value[playlist.id] = coverUrls
      } catch (e) {
        console.error('Failed to load playlist covers:', e)
        playlistCovers.value[playlist.id] = []
      }
    })
  )
}

// Load all images when library data changes
const loadAllImages = () => {
  loadArtistAvatars()
  loadAlbumCovers()
  loadTrackCovers()
  loadPlaylistCovers()
}

// Watch for library data changes to load images
watch(libraryData, () => {
  if (libraryData.value) {
    loadAllImages()
  }
}, { immediate: true })

// Load history when tab is selected
const loadHistory = async () => {
  if (recentlyPlayed.value.length > 0) return // Already loaded
  loadingHistory.value = true
  try {
    await fetchRecentlyPlayed(20)
  } finally {
    loadingHistory.value = false
  }
}

// Watch for tab changes to load history lazily
watch(activeTab, (newTab) => {
  // History tab is index 4
  if (newTab === 4) {
    loadHistory()
  }
})

// Handle URL query param for deep linking (e.g., /library?tab=history)
onMounted(() => {
  const tabParam = route.query.tab as string
  if (tabParam === 'history') {
    activeTab.value = 4
  }
})

// Pull to refresh
usePullToRefresh(refreshLibrary)
</script>
