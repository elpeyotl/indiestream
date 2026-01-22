<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <!-- Back Button (Desktop only - mobile shows in header) -->
    <div class="hidden md:block mb-4">
      <BackButton />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <!-- Not Found -->
    <div v-else-if="!playlist" class="text-center py-20">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-zinc-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">Playlist not found</h2>
      <p class="text-zinc-400 mb-6">This playlist may have been deleted or you don't have access.</p>
      <UButton color="violet" to="/library">Back to Library</UButton>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex flex-col md:flex-row gap-6 mb-8">
        <!-- Playlist Cover -->
        <div class="w-48 h-48 md:w-56 md:h-56 shrink-0 mx-auto md:mx-0">
          <PlaylistCover :covers="playlistCoverUrls" class="shadow-xl" />
        </div>

        <!-- Info -->
        <div class="flex-1 flex flex-col justify-end text-center md:text-left">
          <div class="flex items-center gap-2 justify-center md:justify-start mb-2">
            <span class="text-sm text-zinc-400 uppercase tracking-wider">Playlist</span>
            <UBadge v-if="playlist.is_public" color="green" variant="soft" size="xs">
              Public
            </UBadge>
            <UBadge v-if="playlist.role !== 'owner'" :color="playlist.role === 'editor' ? 'yellow' : 'gray'" variant="soft" size="xs">
              {{ playlist.role }}
            </UBadge>
          </div>

          <h1 class="text-3xl md:text-4xl font-bold text-zinc-100 mb-2">{{ playlist.title }}</h1>

          <p v-if="playlist.description" class="text-zinc-400 mb-4">{{ playlist.description }}</p>

          <div class="flex items-center gap-4 text-sm text-zinc-400 justify-center md:justify-start">
            <span>{{ playlist.track_count }} {{ playlist.track_count === 1 ? 'track' : 'tracks' }}</span>
            <span v-if="totalDuration">{{ formatTotalDuration(totalDuration) }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 mt-6 justify-center md:justify-start">
            <PlayAllButton
              v-if="playlist.playlist_tracks?.length > 0"
              :loading="loadingPlay"
              @click="playAll"
            />

            <UButton
              v-if="playlist.role === 'owner'"
              color="gray"
              variant="outline"
              @click="showEditModal = true"
            >
              <UIcon name="i-heroicons-pencil" class="w-4 h-4 mr-1" />
              Edit
            </UButton>

            <UButton
              v-if="playlist.role === 'owner'"
              color="gray"
              variant="ghost"
              @click="handleShare"
            >
              <UIcon name="i-heroicons-share" class="w-4 h-4 mr-1" />
              Share
            </UButton>

            <UDropdown
              v-if="playlist.role === 'owner'"
              :items="menuItems"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
            </UDropdown>
          </div>
        </div>
      </div>

      <!-- Collaborators -->
      <div v-if="collaborators.length > 1" class="mb-6">
        <div class="flex items-center gap-2">
          <span class="text-sm text-zinc-400">Collaborators:</span>
          <div class="flex -space-x-2">
            <div
              v-for="collab in collaborators.slice(0, 5)"
              :key="collab.user_id"
              class="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center overflow-hidden"
              :title="`${collab.display_name} (${collab.role})`"
            >
              <img v-fade-image
                v-if="collab.avatar_url"
                :src="collab.avatar_url"
                :alt="collab.display_name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-xs font-medium text-zinc-300">
                {{ collab.display_name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </div>
          </div>
          <UButton
            v-if="playlist.role === 'owner'"
            color="gray"
            variant="ghost"
            size="xs"
            @click="showCollaboratorsModal = true"
          >
            Manage
          </UButton>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="playlist.playlist_tracks?.length === 0" class="text-center py-16 bg-zinc-900/30 rounded-lg">
        <UIcon name="i-heroicons-musical-note" class="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-zinc-100 mb-2">No tracks yet</h3>
        <p class="text-zinc-400 mb-4">
          {{ playlist.canEdit ? 'Add tracks to your playlist by browsing music.' : 'This playlist is empty.' }}
        </p>
        <UButton v-if="playlist.canEdit" color="violet" to="/discover">
          Discover Music
        </UButton>
      </div>

      <!-- Track List -->
      <div v-else class="space-y-1">
        <div
          v-for="(item, index) in playlist.playlist_tracks"
          :key="item.id"
          class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
          :draggable="playlist.canEdit"
          @dragstart="dragStart(index)"
          @dragover.prevent="dragOver(index)"
          @drop="dragDrop(index)"
        >
          <!-- Drag Handle / Index -->
          <div class="w-8 text-center shrink-0 flex items-center justify-center">
            <UIcon
              v-if="playlist.canEdit"
              name="i-heroicons-bars-3"
              class="w-4 h-4 text-zinc-500 cursor-grab hidden group-hover:block"
            />
            <span class="text-sm text-zinc-500" :class="{ 'group-hover:hidden': playlist.canEdit }">{{ index + 1 }}</span>
          </div>

          <!-- Cover (clickable to play) -->
          <div
            class="w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden relative cursor-pointer group/cover"
            @click.stop="playFromIndex(index)"
          >
            <img v-fade-image
              v-if="trackCovers[item.track.id]"
              :src="trackCovers[item.track.id]"
              :alt="item.track.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
            </div>
            <!-- Loading/Play overlay -->
            <div
              class="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity"
              :class="loadingTrackIndex === index ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'"
            >
              <UIcon
                :name="loadingTrackIndex === index ? 'i-heroicons-arrow-path' : 'i-heroicons-play'"
                :class="loadingTrackIndex === index ? 'animate-spin' : ''"
                class="w-5 h-5 text-white"
              />
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
            <!-- Heart button (always visible when liked) -->
            <UButton
              :color="isTrackLiked(item.track.id) ? 'red' : 'gray'"
              variant="ghost"
              size="xs"
              :icon="isTrackLiked(item.track.id) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
              :class="isTrackLiked(item.track.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'"
              @click.stop="toggleTrackLike(item.track.id)"
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
            <!-- Remove (for playlist editors) -->
            <UButton
              v-if="playlist.canEdit"
              color="gray"
              variant="ghost"
              size="xs"
              icon="i-heroicons-x-mark"
              class="opacity-0 group-hover:opacity-100"
              @click.stop="handleRemoveTrack(item.track.id)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <UModal v-model="showEditModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Edit Playlist</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="showEditModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Name" required>
            <UInput v-model="editTitle" />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea v-model="editDescription" :rows="3" />
          </UFormGroup>

          <UFormGroup label="Visibility">
            <UToggle v-model="editIsPublic" />
            <span class="ml-2 text-sm text-zinc-400">
              {{ editIsPublic ? 'Public - Anyone with the link can view' : 'Private - Only you and collaborators' }}
            </span>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              color="red"
              variant="ghost"
              @click="handleDelete"
            >
              Delete Playlist
            </UButton>
            <div class="flex gap-3">
              <UButton color="gray" variant="ghost" @click="showEditModal = false">
                Cancel
              </UButton>
              <UButton color="violet" :loading="saving" @click="handleSave">
                Save
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Collaborators Modal -->
    <UModal v-model="showCollaboratorsModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Manage Collaborators</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="showCollaboratorsModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- User Search -->
          <div>
            <div class="flex gap-2 mb-2">
              <div class="relative flex-1">
                <UInput
                  v-model="userSearchQuery"
                  placeholder="Search users by name..."
                  @input="searchUsers"
                  @keydown.escape="userSearchResults = []"
                >
                  <template #leading>
                    <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-zinc-400" />
                  </template>
                </UInput>
                <!-- Search results dropdown -->
                <div
                  v-if="userSearchResults.length > 0"
                  class="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <button
                    v-for="user in userSearchResults"
                    :key="user.id"
                    type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                    @click="selectUserToInvite(user)"
                  >
                    <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        v-if="user.avatar_url"
                        :src="user.avatar_url"
                        :alt="user.display_name"
                        class="w-full h-full object-cover"
                      />
                      <span v-else class="text-xs font-medium text-zinc-300">
                        {{ user.display_name?.charAt(0)?.toUpperCase() || '?' }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-zinc-100 truncate">{{ user.display_name }}</p>
                      <p v-if="user.email_hint" class="text-xs text-zinc-500 truncate">{{ user.email_hint }}</p>
                    </div>
                  </button>
                </div>
              </div>
              <USelectMenu
                v-model="inviteRole"
                :options="[{ value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]"
                value-attribute="value"
                option-attribute="label"
                class="w-28"
              />
            </div>
            <!-- Selected user to invite -->
            <div v-if="selectedUser" class="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
              <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  v-if="selectedUser.avatar_url"
                  :src="selectedUser.avatar_url"
                  :alt="selectedUser.display_name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs font-medium text-zinc-300">
                  {{ selectedUser.display_name?.charAt(0)?.toUpperCase() || '?' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-100 truncate">{{ selectedUser.display_name }}</p>
              </div>
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="selectedUser = null"
              />
              <UButton
                color="violet"
                size="sm"
                :loading="inviting"
                @click="handleInvite"
              >
                Add
              </UButton>
            </div>
            <p v-else class="text-xs text-zinc-500 mt-1">
              Search for a user to add as a collaborator. They'll be notified and see this playlist in their library.
            </p>
          </div>

          <!-- Current Collaborators -->
          <div class="space-y-2">
            <p class="text-sm font-medium text-zinc-400">Current Collaborators</p>
            <div
              v-for="collab in collaborators"
              :key="collab.user_id"
              class="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50"
            >
              <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                <img v-fade-image
                  v-if="collab.avatar_url"
                  :src="collab.avatar_url"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs font-medium text-zinc-300">
                  {{ collab.display_name?.charAt(0)?.toUpperCase() || '?' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-100 truncate">{{ collab.display_name }}</p>
                <p class="text-xs text-zinc-500 capitalize">{{ collab.role }}</p>
              </div>
              <UButton
                v-if="!collab.is_owner"
                color="gray"
                variant="ghost"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="handleRemoveCollaborator(collab.user_id)"
              />
            </div>
          </div>
        </div>
      </UCard>
    </UModal>

    <!-- Share Modal -->
    <UModal v-model="showShareModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Share Playlist</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="showShareModal = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-zinc-400">Anyone with this link can view and play this playlist.</p>

          <div class="flex gap-2">
            <UInput
              :model-value="shareUrl"
              readonly
              class="flex-1"
            />
            <UButton
              color="violet"
              @click="copyShareUrl"
            >
              <UIcon name="i-heroicons-clipboard" class="w-4 h-4 mr-1" />
              Copy
            </UButton>
          </div>
        </div>
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
import { storeToRefs } from 'pinia'
import type { PlaylistWithTracks, Collaborator } from '~/stores/playlist'
import type { PlayerTrack } from '~/stores/player'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore
const playlistStore = usePlaylistStore()
const {
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  removeTrack,
  reorderTracks,
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
  generateShareLink,
} = playlistStore
const playerStore = usePlayerStore()
const { isLoading: playerLoading } = storeToRefs(playerStore)
const { playPlaylist } = playerStore
const libraryStore = useLibraryStore()
const { isTrackLiked, toggleTrackLike, fetchLikedTrackIds } = libraryStore

// Use a simple getter for playlistId since it's used in many places
const getPlaylistId = () => route.params.id as string
const collaborators = ref<Collaborator[]>([])
const trackCovers = ref<Record<string, string>>({})

// Fetch playlist using useLazyAsyncData (SSR enabled for public playlists)
const { data: playlist, pending: loading, refresh: refreshPlaylist } = await useLazyAsyncData(
  `playlist-${route.params.id}`,
  async () => {
    const data = await getPlaylist(getPlaylistId())
    return data
  },
  {
    watch: [() => route.params.id],
  }
)

// Load collaborators and track covers when playlist loads
watch(playlist, async (newPlaylist) => {
  if (!newPlaylist) return

  // Load collaborators
  collaborators.value = await getCollaborators(getPlaylistId())

  // Load track covers
  await loadTrackCovers()

  // Fetch liked status for all tracks
  if (newPlaylist.playlist_tracks?.length) {
    const trackIds = newPlaylist.playlist_tracks.map(item => item.track.id)
    await fetchLikedTrackIds(trackIds)
  }

  // Sync edit form values
  editTitle.value = newPlaylist.title
  editDescription.value = newPlaylist.description || ''
  editIsPublic.value = newPlaylist.is_public
}, { immediate: true })

// Edit modal
const showEditModal = ref(false)
const editTitle = ref('')
const editDescription = ref('')
const editIsPublic = ref(false)
const saving = ref(false)

// Collaborators modal
const showCollaboratorsModal = ref(false)
const inviteRole = ref('editor')
const inviting = ref(false)

// User search for collaborators
interface SearchUser {
  id: string
  display_name: string
  avatar_url: string | null
  email_hint: string | null
}
const userSearchQuery = ref('')
const userSearchResults = ref<SearchUser[]>([])
const selectedUser = ref<SearchUser | null>(null)
let searchTimeout: NodeJS.Timeout | null = null

// Share modal
const showShareModal = ref(false)
const shareUrl = ref('')

// Drag and drop
const draggedIndex = ref<number | null>(null)

// Loading states for play
const loadingPlay = ref(false)
const loadingTrackIndex = ref<number | null>(null)

// Track actions sheet
const showActionsSheet = ref(false)
const selectedTrack = ref<PlayerTrack | null>(null)

const totalDuration = computed(() => {
  if (!playlist.value?.playlist_tracks) return 0
  return playlist.value.playlist_tracks.reduce(
    (sum, item) => sum + (item.track.duration_seconds || 0),
    0
  )
})

// Get first 4 unique cover URLs for the playlist mosaic
const playlistCoverUrls = computed(() => {
  if (!playlist.value?.playlist_tracks) return []

  const covers: string[] = []
  const seen = new Set<string>()

  for (const item of playlist.value.playlist_tracks) {
    const coverUrl = trackCovers.value[item.track.id]
    if (coverUrl && !seen.has(coverUrl)) {
      seen.add(coverUrl)
      covers.push(coverUrl)
      if (covers.length >= 4) break
    }
  }

  return covers
})

const menuItems = computed(() => [
  [{
    label: 'Manage collaborators',
    icon: 'i-heroicons-user-group',
    click: () => { showCollaboratorsModal.value = true },
  }],
  [{
    label: 'Delete playlist',
    icon: 'i-heroicons-trash',
    click: handleDelete,
  }],
])

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTotalDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hr ${mins} min`
  }
  return `${mins} min`
}

const loadTrackCovers = async () => {
  if (!playlist.value?.playlist_tracks) return

  for (const item of playlist.value.playlist_tracks) {
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

// Convert playlist track item to PlayerTrack format for menus
const getPlayerTrack = (item: { track: { id: string; title: string; duration_seconds: number; audio_key: string | null; album: { title: string; slug: string; band: { name: string; slug: string } } } }): PlayerTrack => {
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
const openActionsSheet = async (item: { track: { id: string; title: string; duration_seconds: number; audio_key: string | null; album: { title: string; slug: string; band: { name: string; slug: string } } } }) => {
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

const playAll = async () => {
  if (!playlist.value?.playlist_tracks || loadingPlay.value) return
  loadingPlay.value = true
  try {
    const tracks = playlist.value.playlist_tracks.map((item) => ({
      ...item.track,
      coverUrl: trackCovers.value[item.track.id] || null,
    }))
    await playPlaylist(tracks, 0)
  } finally {
    loadingPlay.value = false
  }
}

const playFromIndex = async (index: number) => {
  if (!playlist.value?.playlist_tracks || loadingTrackIndex.value !== null) return
  loadingTrackIndex.value = index
  try {
    const tracks = playlist.value.playlist_tracks.map((item) => ({
      ...item.track,
      coverUrl: trackCovers.value[item.track.id] || null,
    }))
    await playPlaylist(tracks, index)
  } finally {
    loadingTrackIndex.value = null
  }
}

const handleSave = async () => {
  saving.value = true
  const success = await updatePlaylist(getPlaylistId(), {
    title: editTitle.value,
    description: editDescription.value,
    is_public: editIsPublic.value,
  })
  saving.value = false

  if (success && playlist.value) {
    playlist.value.title = editTitle.value
    playlist.value.description = editDescription.value
    playlist.value.is_public = editIsPublic.value
    showEditModal.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this playlist?')) return

  const success = await deletePlaylist(getPlaylistId())
  if (success) {
    router.push('/library')
  }
}

const handleRemoveTrack = async (trackId: string) => {
  const success = await removeTrack(getPlaylistId(), trackId)
  if (success && playlist.value) {
    playlist.value.playlist_tracks = playlist.value.playlist_tracks.filter(
      (item) => item.track.id !== trackId
    )
    playlist.value.track_count--
  }
}

const handleShare = async () => {
  if (playlist.value?.share_token) {
    const config = useRuntimeConfig()
    shareUrl.value = `${config.public.appUrl || window.location.origin}/playlist/share/${playlist.value.share_token}`
  } else {
    const url = await generateShareLink(getPlaylistId())
    if (url) {
      shareUrl.value = url
      if (playlist.value) {
        playlist.value.is_public = true
      }
    }
  }
  showShareModal.value = true
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    toast.add({ title: 'Link copied!', color: 'green' })
  } catch (e) {
    toast.add({ title: 'Failed to copy', color: 'red' })
  }
}

// Search for users to invite
const searchUsers = async () => {
  const query = userSearchQuery.value.trim()
  if (query.length < 2) {
    userSearchResults.value = []
    return
  }

  // Debounce search
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    try {
      const results = await $fetch<SearchUser[]>('/api/users/search', {
        query: { q: query },
      })
      // Filter out users who are already collaborators
      const existingIds = new Set(collaborators.value.map(c => c.user_id))
      userSearchResults.value = results.filter(u => !existingIds.has(u.id))
    } catch (e) {
      console.error('Failed to search users:', e)
      userSearchResults.value = []
    }
  }, 300)
}

const selectUserToInvite = (user: SearchUser) => {
  selectedUser.value = user
  userSearchQuery.value = ''
  userSearchResults.value = []
}

const handleInvite = async () => {
  if (!selectedUser.value) return

  inviting.value = true
  const success = await inviteCollaborator(
    getPlaylistId(),
    selectedUser.value.id,
    inviteRole.value as 'editor' | 'viewer',
    selectedUser.value.display_name
  )
  inviting.value = false

  if (success) {
    selectedUser.value = null
    collaborators.value = await getCollaborators(getPlaylistId())
  }
}

const handleRemoveCollaborator = async (userId: string) => {
  const success = await removeCollaborator(getPlaylistId(), userId)
  if (success) {
    collaborators.value = collaborators.value.filter((c) => c.user_id !== userId)
  }
}

// Drag and drop handlers
const dragStart = (index: number) => {
  draggedIndex.value = index
}

const dragOver = (index: number) => {
  // Visual feedback could be added here
}

const dragDrop = async (targetIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return
  if (!playlist.value?.playlist_tracks) return

  const tracks = [...playlist.value.playlist_tracks]
  const [draggedItem] = tracks.splice(draggedIndex.value, 1)
  tracks.splice(targetIndex, 0, draggedItem)

  // Update positions
  const updatedTracks = tracks.map((item, index) => ({
    id: item.id,
    position: index + 1,
  }))

  // Optimistic update
  playlist.value.playlist_tracks = tracks.map((item, index) => ({
    ...item,
    position: index + 1,
  }))

  // Save to server
  await reorderTracks(getPlaylistId(), updatedTracks)

  draggedIndex.value = null
}

// SEO - dynamic based on playlist data
useHead(() => ({
  title: playlist.value ? `${playlist.value.title} | Fairtune` : 'Playlist | Fairtune',
  meta: [
    {
      name: 'description',
      content: playlist.value?.description || `Listen to this playlist on Fairtune`,
    },
  ],
}))

</script>
