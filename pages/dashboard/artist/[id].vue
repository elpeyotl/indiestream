<template>
  <div v-if="band" class="container mx-auto px-4 py-8">
    <!-- Pending Approval Banner -->
    <div v-if="band.status === 'pending'" class="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 class="font-semibold text-orange-200">Profile Pending Approval</h3>
          <p class="text-sm text-orange-200/80 mt-1">
            Your artist profile is being reviewed by our team. You'll receive a notification once it's approved.
            Until then, your profile won't be visible to other users and you won't be able to upload music.
          </p>
        </div>
      </div>
    </div>

    <!-- Suspended Banner -->
    <div v-if="band.status === 'suspended'" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 class="font-semibold text-red-200">Profile Suspended</h3>
          <p class="text-sm text-red-200/80 mt-1">
            Your artist profile has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-16 h-16 rounded-xl overflow-hidden shrink-0"
            :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
          >
            <img
              v-if="band.avatar_url"
              :src="band.avatar_url"
              :alt="band.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-2xl font-bold text-white">
                {{ band.name.charAt(0).toUpperCase() }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-zinc-100">{{ band.name }}</h1>
              <UBadge v-if="band.status === 'pending'" color="orange" variant="subtle" size="xs">
                Pending
              </UBadge>
              <UIcon
                v-if="band.is_verified"
                name="i-heroicons-check-badge"
                class="w-6 h-6 text-violet-400"
              />
            </div>
            <NuxtLink
              v-if="band.status === 'active'"
              :to="`/${band.slug}`"
              class="text-sm text-violet-400 hover:text-violet-300"
              target="_blank"
            >
              fairstream.fm/{{ band.slug }}
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 inline" />
            </NuxtLink>
            <span v-else class="text-sm text-zinc-500">
              fairstream.fm/{{ band.slug }} (not visible until approved)
            </span>
          </div>
        </div>
      </div>

      <UButton
        color="violet"
        :to="band.status === 'active' ? '/dashboard/artist/upload' : undefined"
        :disabled="band.status !== 'active'"
        :title="band.status !== 'active' ? 'You can upload music once your profile is approved' : ''"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Upload Music
      </UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(band.total_streams) }}</p>
          <p class="text-sm text-zinc-400">Total Streams</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-teal-400">${{ (band.total_earnings_cents / 100).toFixed(2) }}</p>
          <p class="text-sm text-zinc-400">Total Earnings</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ albums.length }}</p>
          <p class="text-sm text-zinc-400">Releases</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">{{ formatNumber(band.follower_count || 0) }}</p>
          <p class="text-sm text-zinc-400">Followers</p>
        </div>
      </UCard>
    </div>

    <!-- Tabs -->
    <PillTabs v-model="currentTab" :tabs="tabs">
      <template #releases>
        <DashboardArtistReleasesTab
          :albums="albums"
          :album-covers="albumCovers"
          :band-slug="band.slug"
          :band-status="band.status"
          @edit-album="openEditAlbum"
          @delete-album="confirmDeleteAlbum"
        />
      </template>

      <template #analytics>
        <DashboardArtistAnalyticsTab
          :band-id="band.id"
          :album-covers="albumCovers"
        />
      </template>

      <template #earnings>
        <DashboardArtistEarningsTab :band-id="band.id" />
      </template>

      <template #settings>
        <DashboardArtistSettingsTab
          :band="band"
          @saved="handleBandSaved"
          @delete="confirmDelete"
        />
      </template>
    </PillTabs>

    <!-- Delete Artist Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Artist Profile</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ band.name }}</strong>? This will permanently delete all your releases, tracks, and analytics data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deleting" @click="handleDelete">
              Delete Forever
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Album Modal -->
    <AlbumEditModal
      v-model="showEditAlbumModal"
      :album="albumToEdit"
      :tracks="editAlbumTracks"
      :cover-url="albumToEdit ? (albumCovers[albumToEdit.id] || albumToEdit.cover_url || null) : null"
      :band-name="band.name"
      :band-id="band.id"
      :saving="savingAlbum"
      :uploading-cover="uploadingAlbumCover"
      @save="handleSaveAlbum"
      @cover-select="handleAlbumCoverSelect"
      @add-track="triggerAddTrack"
      @delete-track="confirmDeleteTrack"
      @tracks-reorder="handleTracksReorder"
    />

    <!-- Hidden file input for adding tracks -->
    <input
      ref="addTrackInput"
      type="file"
      accept="audio/*"
      multiple
      class="hidden"
      @change="onAddTracksSelect"
    />

    <!-- Delete Track Confirmation Modal -->
    <UModal v-model="showDeleteTrackModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Track</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ trackToDelete?.title }}</strong>? This will permanently delete the track and its listening data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteTrackModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingTrack" @click="handleDeleteTrack">
              Delete Track
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Album Confirmation Modal -->
    <UModal v-model="showDeleteAlbumModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Album</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ albumToDelete?.title }}</strong>? This will permanently delete the album and all its tracks.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteAlbumModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingAlbum" @click="handleDeleteAlbum">
              Delete Album
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>

  <!-- Loading State -->
  <div v-else-if="loading" class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-center py-24">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'
import type { Album, Track, TrackCredit } from '~/composables/useAlbum'
import type { EditableTrack, AlbumEditForm } from '~/components/AlbumEditModal.vue'
import { useArtistDashboard } from '~/composables/useArtistDashboard'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { toast, formatNumber } = useArtistDashboard()
const { getBandById, updateBand, deleteBand } = useBand()
const { getBandAlbums, getStreamUrl, deleteAlbum, updateAlbum, updateTrack, deleteTrack, getCreditsForTracks, setTrackCredits, createTrack, getUploadUrl } = useAlbum()

// Core state
const band = ref<Band | null>(null)
const albums = ref<Album[]>([])
const albumCovers = ref<Record<string, string>>({})
const loading = ref(true)

// Delete artist state
const deleting = ref(false)
const showDeleteModal = ref(false)

// Album edit state
const showEditAlbumModal = ref(false)
const albumToEdit = ref<Album | null>(null)
const editAlbumTracks = ref<EditableTrack[]>([])
const savingAlbum = ref(false)
const uploadingAlbumCover = ref(false)
const originalTrackCredits = ref<Record<string, string>>({})

// Track management state
const addTrackInput = ref<HTMLInputElement | null>(null)
const addingTracks = ref(false)
const showDeleteTrackModal = ref(false)
const deletingTrack = ref(false)
const trackToDelete = ref<EditableTrack | null>(null)

// Album delete state
const showDeleteAlbumModal = ref(false)
const deletingAlbum = ref(false)
const albumToDelete = ref<Album | null>(null)

// Tab state
const tabs = [
  { label: 'Releases', slot: 'releases', icon: 'i-heroicons-musical-note' },
  { label: 'Analytics', slot: 'analytics', icon: 'i-heroicons-chart-bar' },
  { label: 'Earnings', slot: 'earnings', icon: 'i-heroicons-banknotes' },
  { label: 'Settings', slot: 'settings', icon: 'i-heroicons-cog-6-tooth' },
]

const currentTab = ref(0)

const tabSlotToIndex: Record<string, number> = {
  'releases': 0,
  'analytics': 1,
  'earnings': 2,
  'settings': 3,
}

watch(currentTab, (newTab) => {
  const tabName = tabs[newTab]?.slot
  if (tabName && route.query.tab !== tabName) {
    router.replace({ query: { ...route.query, tab: tabName } })
  }
})

const initTabFromUrl = () => {
  const tabParam = route.query.tab as string
  if (tabParam && tabSlotToIndex[tabParam] !== undefined) {
    currentTab.value = tabSlotToIndex[tabParam]
  }
}

// Band saved handler
const handleBandSaved = (updatedBand: Band) => {
  band.value = updatedBand
}

// Delete artist functions
const confirmDelete = () => {
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!band.value) return

  deleting.value = true
  try {
    await deleteBand(band.value.id)
    toast.add({ title: 'Artist profile deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    router.push('/dashboard')
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete artist profile', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// Album edit functions
const openEditAlbum = async (album: Album) => {
  albumToEdit.value = album

  // Deep copy tracks for editing with credits
  const tracks = album.tracks || []
  const trackIds = tracks.map(t => t.id)

  // Load credits for all tracks
  let creditsMap: Record<string, TrackCredit[]> = {}
  if (trackIds.length > 0) {
    try {
      creditsMap = await getCreditsForTracks(trackIds)
    } catch (e) {
      console.error('Failed to load track credits:', e)
    }
  }

  // Map tracks with their credits
  editAlbumTracks.value = tracks.map(t => ({
    ...t,
    credits: (creditsMap[t.id] || []).map(c => ({
      role: c.role,
      name: c.name,
      ipi_number: c.ipi_number || '',
    })),
    showCredits: false,
  }))

  // Store original credits for comparison (to detect changes that trigger re-review)
  originalTrackCredits.value = {}
  for (const track of editAlbumTracks.value) {
    const normalizedCredits = track.credits
      .filter(c => c.name.trim())
      .map(c => ({ role: c.role, name: c.name.trim(), ipi_number: c.ipi_number?.trim() || '' }))
      .sort((a, b) => a.name.localeCompare(b.name))
    originalTrackCredits.value[track.id] = JSON.stringify(normalizedCredits)
  }

  showEditAlbumModal.value = true
}

const handleAlbumCoverSelect = async (file: File) => {
  if (!albumToEdit.value || !band.value) return

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'File too large', description: 'Image must be smaller than 5MB', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  uploadingAlbumCover.value = true

  try {
    // Upload and process image (resizes to 600x600 square)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'cover')
    formData.append('key', `covers/${band.value.id}/${albumToEdit.value.id}/cover.jpg`)

    const { key } = await $fetch<{ key: string }>('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    // Update album with new cover key
    await updateAlbum(albumToEdit.value.id, { cover_key: key })

    // Update local state
    albumToEdit.value.cover_key = key
    const newCoverUrl = await getStreamUrl(key)
    albumToEdit.value.cover_url = newCoverUrl

    // Update in albums array
    const index = albums.value.findIndex(a => a.id === albumToEdit.value!.id)
    if (index !== -1) {
      albums.value[index].cover_key = key
      albums.value[index].cover_url = newCoverUrl
      albumCovers.value[albumToEdit.value.id] = newCoverUrl
    }

    toast.add({ title: 'Cover updated', color: 'green', icon: 'i-heroicons-check-circle' })
  } catch (e: any) {
    console.error('Album cover upload failed:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload cover', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    uploadingAlbumCover.value = false
  }
}

const handleSaveAlbum = async (form: AlbumEditForm, tracks: EditableTrack[]) => {
  if (!albumToEdit.value || !form.title.trim()) return

  // Check if album is being published (was not published, now is)
  const isBeingPublished = !albumToEdit.value.is_published && form.is_published

  savingAlbum.value = true
  let tracksResetToReview = 0

  try {
    // Update album details
    const updated = await updateAlbum(albumToEdit.value.id, {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      release_type: form.release_type,
      release_date: form.release_date || undefined,
      is_published: form.is_published,
      label_name: form.label_name.trim() || undefined,
      p_line: form.p_line.trim() || undefined,
      c_line: form.c_line.trim() || undefined,
    })

    // Update tracks using the API (handles re-review logic)
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const newTrackNumber = i + 1
      const originalTrack = albumToEdit.value.tracks?.find(t => t.id === track.id)

      const trackNumberChanged = originalTrack && originalTrack.track_number !== newTrackNumber
      const contentChanged = originalTrack && (
        originalTrack.title !== track.title ||
        originalTrack.is_explicit !== track.is_explicit ||
        originalTrack.isrc !== track.isrc ||
        originalTrack.iswc !== track.iswc ||
        originalTrack.is_cover !== track.is_cover
      )

      // Check if credits changed
      const validCredits = track.credits.filter(c => c.name.trim())
      const currentCreditsNormalized = validCredits
        .map(c => ({ role: c.role, name: c.name.trim(), ipi_number: c.ipi_number?.trim() || '' }))
        .sort((a, b) => a.name.localeCompare(b.name))
      const currentCreditsJson = JSON.stringify(currentCreditsNormalized)
      const originalCreditsJson = originalTrackCredits.value[track.id] || '[]'
      const creditsChanged = currentCreditsJson !== originalCreditsJson

      if (contentChanged || creditsChanged) {
        const result = await $fetch<{ success: boolean; track: any; wasResetToReview: boolean }>(`/api/tracks/${track.id}`, {
          method: 'PATCH',
          body: {
            title: track.title,
            is_explicit: track.is_explicit,
            isrc: track.isrc || null,
            iswc: track.iswc || null,
            is_cover: track.is_cover,
            track_number: newTrackNumber,
          },
        })

        if (result.track) {
          track.moderation_status = result.track.moderation_status
          track.moderation_notes = result.track.moderation_notes
        }

        if (result.wasResetToReview) {
          tracksResetToReview++
        }
      } else if (trackNumberChanged) {
        await updateTrack(track.id, { track_number: newTrackNumber })
      }

      // Save credits
      await setTrackCredits(track.id, validCredits.map(c => ({
        role: c.role,
        name: c.name.trim(),
        ipi_number: c.ipi_number?.trim() || undefined,
      })))
    }

    // Update local albums array
    const index = albums.value.findIndex(a => a.id === albumToEdit.value!.id)
    if (index !== -1) {
      const tracksForStorage = tracks.map(({ showCredits, ...track }) => track)
      albums.value[index] = { ...albums.value[index], ...updated, tracks: tracksForStorage as Track[] }
    }

    // Notify followers if album was just published
    if (isBeingPublished) {
      $fetch(`/api/albums/${albumToEdit.value.id}/notify-followers`, { method: 'POST' })
        .then((result: any) => {
          if (result.notified > 0) {
            toast.add({
              title: 'Followers notified',
              description: `${result.notified} follower(s) were notified of the new release`,
              color: 'blue',
              icon: 'i-heroicons-bell',
            })
          }
        })
        .catch((err) => {
          console.error('Failed to notify followers:', err)
        })
    }

    if (tracksResetToReview > 0) {
      toast.add({
        title: 'Album updated',
        description: `${tracksResetToReview} track${tracksResetToReview > 1 ? 's' : ''} sent for re-review`,
        color: 'yellow',
        icon: 'i-heroicons-clock',
      })
    } else {
      toast.add({ title: 'Album updated', color: 'green', icon: 'i-heroicons-check-circle' })
    }
    showEditAlbumModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Update failed', description: e.message || 'Failed to update album', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    savingAlbum.value = false
  }
}

const handleTracksReorder = (reorderedTracks: EditableTrack[]) => {
  editAlbumTracks.value = reorderedTracks
}

// Add tracks
const triggerAddTrack = () => {
  addTrackInput.value?.click()
}

const onAddTracksSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0 || !albumToEdit.value || !band.value) return

  addingTracks.value = true

  try {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'))

    for (const file of audioFiles) {
      const title = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const nextTrackNumber = editAlbumTracks.value.length + 1

      // Get upload URL
      const audioKey = `audio/${band.value.id}/${albumToEdit.value.id}/${Date.now()}-${file.name}`
      const uploadUrl = await getUploadUrl(audioKey, file.type)

      // Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      // Create track record
      const newTrack = await createTrack({
        album_id: albumToEdit.value.id,
        title,
        track_number: nextTrackNumber,
        audio_key: audioKey,
        is_explicit: false,
        is_cover: false,
      })

      // Add to editable tracks
      editAlbumTracks.value.push({
        ...newTrack,
        credits: [],
        showCredits: false,
      })
    }

    toast.add({
      title: `${audioFiles.length} track${audioFiles.length > 1 ? 's' : ''} added`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to add tracks:', e)
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to add tracks', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    addingTracks.value = false
    if (addTrackInput.value) {
      addTrackInput.value.value = ''
    }
  }
}

// Track delete functions
const confirmDeleteTrack = (track: EditableTrack) => {
  trackToDelete.value = track
  showDeleteTrackModal.value = true
}

const handleDeleteTrack = async () => {
  if (!trackToDelete.value) return

  deletingTrack.value = true
  try {
    await deleteTrack(trackToDelete.value.id)

    editAlbumTracks.value = editAlbumTracks.value.filter(t => t.id !== trackToDelete.value!.id)
    editAlbumTracks.value.forEach((t, idx) => {
      t.track_number = idx + 1
    })

    if (albumToEdit.value) {
      const albumIndex = albums.value.findIndex(a => a.id === albumToEdit.value!.id)
      if (albumIndex !== -1 && albums.value[albumIndex].tracks) {
        albums.value[albumIndex].tracks = albums.value[albumIndex].tracks!.filter(t => t.id !== trackToDelete.value!.id)
      }
    }

    toast.add({ title: 'Track deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    showDeleteTrackModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete track', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    deletingTrack.value = false
  }
}

// Album delete functions
const confirmDeleteAlbum = (album: Album) => {
  albumToDelete.value = album
  showDeleteAlbumModal.value = true
}

const handleDeleteAlbum = async () => {
  if (!albumToDelete.value) return

  deletingAlbum.value = true
  try {
    await deleteAlbum(albumToDelete.value.id)
    albums.value = albums.value.filter(a => a.id !== albumToDelete.value!.id)
    toast.add({ title: 'Album deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    showDeleteAlbumModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete album', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    deletingAlbum.value = false
  }
}

onMounted(async () => {
  initTabFromUrl()

  try {
    const id = route.params.id as string
    band.value = await getBandById(id)

    // Check for Stripe Connect return
    if (route.query.connected === 'true') {
      toast.add({
        title: 'Stripe Connected',
        description: 'Your payout account is being set up. It may take a moment to verify.',
        icon: 'i-heroicons-check-circle',
        color: 'green',
      })
      router.replace({ query: { ...route.query, connected: undefined, tab: 'earnings' } })
    }

    if (route.query.refresh === 'true') {
      router.replace({ query: { ...route.query, refresh: undefined, tab: 'earnings' } })
    }

    if (band.value) {
      // Load avatar URL from key if available
      if (band.value.avatar_key) {
        try {
          band.value.avatar_url = await getStreamUrl(band.value.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar:', e)
        }
      }

      // Load banner URL from key if available
      if (band.value.banner_key) {
        try {
          band.value.banner_url = await getStreamUrl(band.value.banner_key)
        } catch (e) {
          console.error('Failed to load banner:', e)
        }
      }

      // Load albums (including unpublished drafts, no moderation filtering)
      albums.value = await getBandAlbums(band.value.id, true, false)

      // Load cover URLs
      for (const album of albums.value) {
        if (album.cover_key) {
          try {
            albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
          } catch (e) {
            console.error('Failed to load cover:', e)
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to load band:', e)
  } finally {
    loading.value = false
  }
})
</script>
