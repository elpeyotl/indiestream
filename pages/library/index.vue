<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Pull to Refresh Indicator -->
    <PullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-refreshing="isRefreshing"
      :threshold="threshold"
    />

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-zinc-100">Your Library</h1>
      <p class="text-zinc-400 mt-1">Artists, albums, playlists, and tracks you've saved</p>
    </div>

    <!-- Native-style Tab Selector (Sticky) -->
    <div class="sticky top-[73px] z-40 -mx-4 px-4 py-3 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50 mb-6">
      <div class="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.key"
          @click="handleTabChange(index)"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start active:scale-95',
            activeTab === index
              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
          ]"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div>
      <!-- Playlists Tab -->
      <div v-if="activeTab === 0">
          <div v-if="loading" class="flex items-center justify-center py-20">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
          </div>

          <!-- Create Playlist Button -->
          <div v-if="!loading && (userPlaylists.length > 0 || tracks.length > 0)" class="flex justify-start mb-6">
            <UButton color="violet" variant="soft" @click="showCreatePlaylist = true">
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Create Playlist
            </UButton>
          </div>

          <!-- Empty State (no playlists and no liked tracks) -->
          <div v-if="!loading && userPlaylists.length === 0 && tracks.length === 0" class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-queue-list" class="w-10 h-10 text-violet-400" />
            </div>
            <h3 class="text-xl font-semibold text-zinc-100 mb-2">No playlists yet</h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              Create playlists to organize your favorite tracks and share them with friends.
            </p>
            <UButton color="violet" @click="showCreatePlaylist = true">
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Create Playlist
            </UButton>
          </div>

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
                      :ui="{ rounded: 'rounded-full' }"
                      class="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shrink-0"
                      @click.prevent.stop="playLikedSongs"
                    >
                      <UIcon name="i-heroicons-play-solid" class="w-6 h-6" />
                    </UButton>
                  </div>
                </div>
              </div>
            </NuxtLink>

            <!-- Regular Playlists -->
            <NuxtLink
              v-for="playlist in userPlaylists"
              :key="playlist.id"
              :to="`/playlist/${playlist.id}`"
              class="group"
            >
              <div class="relative mb-3 group-hover:scale-[1.02] transition-all">
                <PlaylistCover :covers="playlistCovers[playlist.id] || []" />
                <!-- Overlay with info and play button -->
                <div class="absolute inset-0 rounded-lg bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
                  <!-- Top badges -->
                  <div class="flex items-center gap-2">
                    <UIcon
                      v-if="playlist.is_public"
                      name="i-heroicons-globe-alt"
                      class="w-4 h-4 text-white/70"
                    />
                    <UBadge
                      v-if="playlist.role !== 'owner'"
                      :color="playlist.role === 'editor' ? 'yellow' : 'gray'"
                      variant="soft"
                      size="xs"
                    >
                      {{ playlist.role }}
                    </UBadge>
                  </div>
                  <!-- Bottom info and play button -->
                  <div class="flex items-end justify-between">
                    <div class="min-w-0 flex-1 mr-2">
                      <h3 class="font-semibold text-white text-lg truncate">{{ playlist.title }}</h3>
                      <p class="text-white/70 text-sm">{{ playlist.track_count }} {{ playlist.track_count === 1 ? 'track' : 'tracks' }}</p>
                    </div>
                    <UButton
                      v-if="playlist.track_count > 0"
                      color="violet"
                      size="lg"
                      :ui="{ rounded: 'rounded-full' }"
                      class="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shrink-0"
                      @click.prevent.stop="playPlaylistById(playlist.id)"
                    >
                      <UIcon name="i-heroicons-play-solid" class="w-6 h-6" />
                    </UButton>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Artists Tab -->
        <div v-if="activeTab === 1">
          <div v-if="loading" class="flex items-center justify-center py-20">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
          </div>

          <div v-else-if="artists.length === 0" class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-user-group" class="w-10 h-10 text-violet-400" />
            </div>
            <h3 class="text-xl font-semibold text-zinc-100 mb-2">No followed artists yet</h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              Follow your favorite artists to see them here. You'll be notified when they release new music.
            </p>
            <UButton color="violet" to="/discover">
              Discover Artists
            </UButton>
          </div>

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
        </div>

        <!-- Albums Tab -->
        <div v-else-if="activeTab === 2">
          <div v-if="loading" class="flex items-center justify-center py-20">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
          </div>

          <div v-else-if="albums.length === 0" class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-square-3-stack-3d" class="w-10 h-10 text-fuchsia-400" />
            </div>
            <h3 class="text-xl font-semibold text-zinc-100 mb-2">No saved albums yet</h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              Save albums to your library to access them quickly and show support for the artists.
            </p>
            <UButton color="violet" to="/discover">
              Discover Music
            </UButton>
          </div>

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
        </div>

        <!-- Tracks Tab -->
        <div v-else-if="activeTab === 3">
          <div v-if="loading" class="flex items-center justify-center py-20">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
          </div>

          <div v-else-if="tracks.length === 0" class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-heart" class="w-10 h-10 text-teal-400" />
            </div>
            <h3 class="text-xl font-semibold text-zinc-100 mb-2">No liked tracks yet</h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              Like tracks by clicking the heart icon while browsing or playing music.
            </p>
            <UButton color="violet" to="/discover">
              Discover Music
            </UButton>
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="(item, index) in tracks"
              :key="item.track.id"
              class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
            >
              <!-- Index / Play -->
              <div class="w-8 text-center shrink-0">
                <span class="text-sm text-zinc-500 group-hover:hidden">{{ index + 1 }}</span>
                <UIcon
                  name="i-heroicons-play"
                  class="w-4 h-4 text-zinc-100 hidden group-hover:inline cursor-pointer"
                  @click.prevent="playTrack(item)"
                />
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

              <!-- Add to playlist -->
              <AddToPlaylistMenu
                :track-id="item.track.id"
                :track-title="item.track.title"
                class="opacity-0 group-hover:opacity-60"
                @click.stop
              />

              <!-- Heart (always filled since it's in liked tracks) -->
              <UButton
                color="red"
                variant="ghost"
                size="xs"
                icon="i-heroicons-heart-solid"
                class="opacity-60 hover:opacity-100"
                @click.stop="handleUnlike(item.track.id)"
              />
            </div>
          </div>
        </div>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import type { SavedAlbum, LikedTrack, FollowedArtist } from '~/composables/useLibrary'
import type { Playlist } from '~/composables/usePlaylist'

definePageMeta({
  middleware: 'auth',
})

const { getStreamUrl } = useAlbum()
const { getSavedAlbums, getLikedTracks, getFollowedArtists, unlikeTrack } = useLibrary()
const { playTrackFromLibrary, playPlaylist } = usePlayer()
const { playlists: userPlaylists, fetchPlaylists, createPlaylist, getPlaylist } = usePlaylist()
const haptics = useHaptics()

const loading = ref(true)
const activeTab = ref(0)

// Handle tab change with haptic feedback
const handleTabChange = (index: number) => {
  if (activeTab.value !== index) {
    haptics.light()
    activeTab.value = index
  }
}

const artists = ref<FollowedArtist[]>([])
const albums = ref<SavedAlbum[]>([])
const tracks = ref<LikedTrack[]>([])

const artistAvatars = ref<Record<string, string>>({})
const albumCovers = ref<Record<string, string>>({})
const trackCovers = ref<Record<string, string>>({})
const playlistCovers = ref<Record<string, string[]>>({})

// Create playlist modal
const showCreatePlaylist = ref(false)
const newPlaylistTitle = ref('')
const newPlaylistDescription = ref('')
const creatingPlaylist = ref(false)

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
  { key: 'playlists', label: `Playlists (${userPlaylists.value.length})`, icon: 'i-heroicons-queue-list' },
  { key: 'artists', label: `Artists (${artists.value.length})`, icon: 'i-heroicons-user-group' },
  { key: 'albums', label: `Albums (${albums.value.length})`, icon: 'i-heroicons-square-3-stack-3d' },
  { key: 'tracks', label: `Liked Songs (${tracks.value.length})`, icon: 'i-heroicons-heart' },
])

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleUnlike = async (trackId: string) => {
  await unlikeTrack(trackId)
  tracks.value = tracks.value.filter(t => t.track.id !== trackId)
}

const playTrack = (item: LikedTrack) => {
  // Play track from library - implementation in usePlayer
  playTrackFromLibrary(item.track, trackCovers.value[item.track.id] || null)
}

// Play all liked songs as a playlist
const playLikedSongs = () => {
  if (tracks.value.length === 0) return

  const playableTracks = tracks.value.map((item) => ({
    ...item.track,
    coverUrl: trackCovers.value[item.track.id] || null,
  }))

  playPlaylist(playableTracks, 0)
}

// Play a playlist by ID (fetches tracks and plays)
const playPlaylistById = async (playlistId: string) => {
  try {
    const playlist = await getPlaylist(playlistId)
    if (!playlist?.playlist_tracks?.length) return

    // Load cover URLs for tracks
    const playableTracks = await Promise.all(
      playlist.playlist_tracks.map(async (item) => {
        let coverUrl: string | null = null
        if (item.track.album.cover_key) {
          try {
            coverUrl = await getStreamUrl(item.track.album.cover_key)
          } catch (e) {
            console.error('Failed to load cover:', e)
          }
        } else if (item.track.album.cover_url) {
          coverUrl = item.track.album.cover_url
        }
        return {
          ...item.track,
          coverUrl,
        }
      })
    )

    playPlaylist(playableTracks, 0)
  } catch (e) {
    console.error('Failed to play playlist:', e)
  }
}

const loadLibrary = async () => {
  loading.value = true

  try {
    // Load all library data in parallel
    const [artistsData, albumsData, tracksData] = await Promise.all([
      getFollowedArtists(),
      getSavedAlbums(),
      getLikedTracks(),
      fetchPlaylists(),
    ])

    artists.value = artistsData
    albums.value = albumsData
    tracks.value = tracksData

    // Load images
    await Promise.all([
      loadArtistAvatars(),
      loadAlbumCovers(),
      loadTrackCovers(),
      loadPlaylistCovers(),
    ])
  } catch (e) {
    console.error('Failed to load library:', e)
  } finally {
    loading.value = false
  }
}

const loadArtistAvatars = async () => {
  for (const item of artists.value) {
    if (item.band.avatar_key) {
      try {
        artistAvatars.value[item.band.id] = await getStreamUrl(item.band.avatar_key)
      } catch (e) {
        console.error('Failed to load avatar:', e)
      }
    } else if (item.band.avatar_url) {
      artistAvatars.value[item.band.id] = item.band.avatar_url
    }
  }
}

const loadAlbumCovers = async () => {
  for (const item of albums.value) {
    if (item.album.cover_key) {
      try {
        albumCovers.value[item.album.id] = await getStreamUrl(item.album.cover_key)
      } catch (e) {
        console.error('Failed to load cover:', e)
      }
    } else if (item.album.cover_url) {
      albumCovers.value[item.album.id] = item.album.cover_url
    }
  }
}

const loadTrackCovers = async () => {
  for (const item of tracks.value) {
    if (item.track.album.cover_key) {
      try {
        trackCovers.value[item.track.id] = await getStreamUrl(item.track.album.cover_key)
      } catch (e) {
        console.error('Failed to load cover:', e)
      }
    } else if (item.track.album.cover_url) {
      trackCovers.value[item.track.id] = item.track.album.cover_url
    }
  }
}

const loadPlaylistCovers = async () => {
  // Load covers for all playlists in parallel
  await Promise.all(
    userPlaylists.value.map(async (playlist) => {
      try {
        const response = await $fetch<{ covers: Array<{ url?: string; key?: string }> }>(
          `/api/playlists/${playlist.id}/covers`
        )

        // Convert cover keys to URLs
        const coverUrls: string[] = []
        for (const cover of response.covers) {
          if (cover.key) {
            try {
              coverUrls.push(await getStreamUrl(cover.key))
            } catch (e) {
              console.error('Failed to get stream URL for cover:', e)
            }
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

// Pull to refresh
const { pullDistance, isRefreshing, threshold } = usePullToRefresh({
  onRefresh: loadLibrary
})

onMounted(() => {
  loadLibrary()
})
</script>
