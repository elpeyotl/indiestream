<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
      <h1 class="text-3xl font-bold text-zinc-100">{{ state.isEditMode ? 'Edit Release' : 'Upload Music' }}</h1>
      <p class="text-zinc-400 mt-2">{{ state.isEditMode ? 'Update your release details and tracks' : 'Create a new release and upload your tracks' }}</p>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="editLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-violet-400 animate-spin" />
      <span class="ml-3 text-zinc-400">Loading album data...</span>
    </div>

    <!-- Select Artist (not shown in edit mode or while loading) -->
    <div v-if="!editLoading && !state.selectedBand" class="mb-8">
      <UploadArtistSelector
        :bands="bands"
        :loading="bandsLoading"
        @select="state.selectedBand = $event"
      />
    </div>

    <!-- Upload Form -->
    <div v-else-if="!editLoading">
      <!-- Selected Artist Header -->
      <div class="flex items-center gap-4 mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div
          class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
          :style="{ background: `linear-gradient(135deg, ${state.selectedBand!.theme_color} 0%, #c026d3 100%)` }"
        >
          <img v-if="state.selectedBand!.avatar_url" :src="state.selectedBand!.avatar_url" :alt="state.selectedBand!.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-lg font-bold text-white">{{ state.selectedBand!.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="flex-1">
          <p class="text-sm text-zinc-400">Uploading as</p>
          <h3 class="font-semibold text-zinc-100">{{ state.selectedBand!.name }}</h3>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="state.selectedBand = null">
          Change
        </UButton>
      </div>

      <!-- Step 1: Album Info -->
      <UploadAlbumDetailsStep
        v-if="state.step === 1"
        :band-name="state.selectedBand!.name"
        :stripe-connected="stripeConnected"
        @continue="state.step = 2"
      />

      <!-- Step 2: Upload Tracks -->
      <UploadTracksStep
        v-if="state.step === 2"
        @back="state.step = 1"
        @upload="startUpload"
        @open-deezer="openDeezerModal"
        @search-musicbrainz="searchMusicBrainz"
        @generate-isrc="generateIsrc"
        @release-isrc="releaseIsrc"
      />

      <!-- Step 3: Success -->
      <UploadSuccessStep
        v-if="state.step === 3"
        :album-title="state.albumForm.title"
        :view-url="`/${state.selectedBand?.slug}/${state.createdAlbum?.slug}`"
        :moderation-enabled="moderationEnabled"
        :is-edit-mode="state.isEditMode"
        @reset="resetWizard"
      />
    </div>

    <!-- Deezer Lookup Modal -->
    <UploadDeezerLookupModal
      v-model="deezerModalOpen"
      :initial-query="deezerInitialQuery"
      :artist-name="state.selectedBand?.name || ''"
      @isrc-found="handleIsrcFound"
    />
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const bandStore = useBandStore()
const { getUserBands, getBandById, resolveAvatarUrls } = bandStore
const albumStore = useAlbumStore()
const { createAlbum, createTrack, updateTrack, updateAlbum, deleteTrack, getUploadUrl, setTrackCredits, getStreamUrl, getAlbumById, getCreditsForTracks } = albumStore
const { state, toast, uploadFileWithProgress, uploadProcessedCover, getAudioDuration, resetWizard, loadAlbumForEdit } = useUploadWizard()
const { moderationEnabled, loadModerationSetting } = useModerationFilter()
const stripeConnectStore = useStripeConnectStore()
const { fetchConnectStatus } = stripeConnectStore
const user = useSupabaseUser()

// Stripe Connect status
const stripeConnected = ref(false)

// Deezer modal
const deezerModalOpen = ref(false)
const deezerModalTrackIndex = ref<number | null>(null)
const deezerInitialQuery = ref('')

// Check for edit mode query param
const editAlbumId = computed(() => route.query.edit as string | undefined)

// Load bands for create mode using useLazyAsyncData
const { data: bands, pending: bandsLoading } = await useLazyAsyncData(
  'upload-bands',
  async () => {
    // Skip if in edit mode
    if (editAlbumId.value) return []

    const loadedBands = await getUserBands()
    await resolveAvatarUrls(loadedBands)
    // Only show active bands (pending/suspended can't upload)
    return loadedBands.filter(b => b.status === 'active')
  },
  {
    server: false,
    default: () => [] as Band[],
  }
)

// Load album for edit mode using useLazyAsyncData
const { pending: editLoading } = await useLazyAsyncData(
  `upload-edit-${editAlbumId.value || 'none'}`,
  async () => {
    // Skip if not in edit mode
    if (!editAlbumId.value) return null

    // Fetch album with tracks (no moderation filter for owner)
    const album = await getAlbumById(editAlbumId.value, false, true)
    if (!album) {
      toast.add({ title: 'Album not found', color: 'red' })
      navigateTo('/dashboard')
      return null
    }

    // Get band data
    const band = await getBandById(album.band_id)
    if (!band) {
      toast.add({ title: 'Artist not found', color: 'red' })
      navigateTo('/dashboard')
      return null
    }

    // Load band avatar
    await resolveAvatarUrls([band])

    // Load cover URL
    let coverUrl: string | null = null
    if (album.cover_key) {
      try {
        coverUrl = await getStreamUrl(album.cover_key)
      } catch (e) {
        console.error('Failed to load cover:', e)
      }
    }

    // Load track credits
    const trackIds = (album.tracks || []).map(t => t.id)
    const credits = trackIds.length > 0 ? await getCreditsForTracks(trackIds) : {}

    // Load into wizard state
    await loadAlbumForEdit(album, band, coverUrl, credits as any)

    return { album, band }
  },
  {
    server: false,
    watch: [editAlbumId],
  }
)

// Load moderation setting and check Stripe Connect status on mount
onMounted(async () => {
  loadModerationSetting()
  // Check Stripe Connect status
  try {
    const status = await fetchConnectStatus()
    stripeConnected.value = status?.status === 'active'
  } catch (e) {
    console.error('Failed to fetch Stripe Connect status:', e)
  }
})

// Deezer modal
const openDeezerModal = (trackIndex: number) => {
  deezerModalTrackIndex.value = trackIndex
  deezerInitialQuery.value = state.value.tracks[trackIndex]?.title || ''
  deezerModalOpen.value = true
}

const handleIsrcFound = (isrc: string) => {
  if (deezerModalTrackIndex.value !== null && state.value.tracks[deezerModalTrackIndex.value]) {
    state.value.tracks[deezerModalTrackIndex.value].isrc = isrc
  }
}

// MusicBrainz search
const searchMusicBrainz = async (trackIndex: number) => {
  const track = state.value.tracks[trackIndex]
  if (!track?.title) return

  track.fetchingIswc = true

  try {
    const result = await $fetch<{
      count: number
      results: Array<{
        musicbrainzWorkId: string
        title: string
        iswc: string | null
        composers: Array<{ name: string; role: string }>
      }>
    }>('/api/musicbrainz/search-work', {
      params: {
        title: track.title,
        artist: state.value.selectedBand?.name,
      },
    })

    if (result.results.length > 0 && result.results[0].iswc) {
      const work = result.results[0]
      track.iswc = work.iswc || ''
      track.musicbrainz_work_id = work.musicbrainzWorkId

      // Optionally add composers if found and no credits exist
      if (work.composers.length > 0 && track.credits.length === 0) {
        for (const composer of work.composers) {
          track.credits.push({
            role: composer.role === 'lyricist' ? 'author' : 'composer',
            name: composer.name,
            ipi_number: '',
          })
        }
        track.showCredits = true
      }

      toast.add({ title: 'ISWC found', description: `ISWC: ${work.iswc}`, color: 'green' })
    } else {
      toast.add({ title: 'No results', description: 'No matching work found in MusicBrainz', color: 'amber' })
    }
  } catch (e: any) {
    toast.add({ title: 'Search failed', description: e.data?.message || 'Failed to search MusicBrainz', color: 'red' })
  } finally {
    track.fetchingIswc = false
  }
}

// Generate platform ISRC for a track
const generateIsrc = async (trackIndex: number) => {
  const track = state.value.tracks[trackIndex]
  if (!track || !state.value.selectedBand) return

  track.generatingIsrc = true

  try {
    const result = await $fetch<{ isrc: string; platformAssigned: boolean }>('/api/tracks/generate-isrc', {
      method: 'POST',
      body: {
        bandId: state.value.selectedBand.id,
        // If track already has an ID (edit mode), pass it
        trackId: track.id || undefined,
      },
    })

    track.isrc = result.isrc
    track.isrc_platform_assigned = result.platformAssigned

    toast.add({
      title: 'ISRC generated',
      description: `Assigned: ${result.isrc}`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    toast.add({
      title: 'Failed to generate ISRC',
      description: e.data?.message || e.message || 'Please try again',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    track.generatingIsrc = false
  }
}

// Release a platform-assigned ISRC so user can enter their own
const releaseIsrc = async (trackIndex: number) => {
  const track = state.value.tracks[trackIndex]
  if (!track || !track.isrc_platform_assigned) return

  // If track has an ID (saved to DB), call API to release
  if (track.id) {
    try {
      await $fetch('/api/tracks/release-isrc', {
        method: 'POST',
        body: { trackId: track.id },
      })
    } catch (e: any) {
      toast.add({
        title: 'Failed to release ISRC',
        description: e.data?.message || e.message || 'Please try again',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return
    }
  }

  // Clear local state
  track.isrc = ''
  track.isrc_platform_assigned = false

  toast.add({
    title: 'ISRC released',
    description: 'You can now enter your own ISRC code',
    color: 'green',
  })
}

// Upload (handles both create and edit modes)
const startUpload = async () => {
  // Prevent double-click / double submission
  if (state.value.uploading) return
  if (!state.value.selectedBand || state.value.tracks.length === 0) return

  // For new uploads, cover is required. For edits, it's optional (keep existing)
  if (!state.value.isEditMode && !state.value.coverFile) return

  state.value.uploading = true

  // Get rights confirmation state from shared state
  const aiDeclaration = state.value.aiDeclaration
  const originalContentConfirmed = state.value.originalContentConfirmed

  try {
    let album: any

    if (state.value.isEditMode && state.value.editAlbumId) {
      // EDIT MODE: Update existing album
      album = { id: state.value.editAlbumId }

      // Update album metadata
      await updateAlbum(album.id, {
        title: state.value.albumForm.title,
        description: state.value.albumForm.description || undefined,
        release_type: state.value.albumForm.release_type,
        release_date: state.value.albumForm.release_date || undefined,
        label_name: state.value.albumForm.label_name || undefined,
        // Purchase settings
        purchasable: state.value.albumForm.purchasable,
        price_cents: state.value.albumForm.price_cents,
        pay_what_you_want: state.value.albumForm.pay_what_you_want,
        minimum_price_cents: state.value.albumForm.minimum_price_cents,
      })

      // Upload new cover if provided
      if (state.value.coverFile) {
        const coverKey = await uploadProcessedCover(state.value.coverFile, state.value.selectedBand.id, album.id)
        await updateAlbum(album.id, { cover_key: coverKey })
      }

      // Get existing track IDs to detect deletions
      const existingTrackIds = new Set(
        state.value.tracks.filter(t => t.id).map(t => t.id!)
      )

      // Delete tracks that were removed (tracks that were in createdAlbum but not in current tracks)
      if (state.value.createdAlbum?.tracks) {
        for (const oldTrack of state.value.createdAlbum.tracks) {
          if (!existingTrackIds.has(oldTrack.id)) {
            await deleteTrack(oldTrack.id)
          }
        }
      }

      // Process tracks (update existing, create new)
      for (let i = 0; i < state.value.tracks.length; i++) {
        const track = state.value.tracks[i]

        if (track.id) {
          // Update existing track
          await updateTrack(track.id, {
            title: track.title,
            track_number: i + 1,
            isrc: track.isrc || undefined,
            iswc: track.iswc || undefined,
            is_cover: track.is_cover,
            spotify_track_id: track.spotify_track_id || undefined,
            musicbrainz_work_id: track.musicbrainz_work_id || undefined,
          })

          // Update credits
          if (track.credits.length > 0) {
            const validCredits = track.credits.filter(c => c.name.trim())
            await setTrackCredits(track.id, validCredits as any)
          }
        } else if (track.file) {
          // New track - create and upload
          track.uploading = true

          try {
            // Get duration first
            const duration = await getAudioDuration(track.file)

            const dbTrack = await createTrack({
              album_id: album.id,
              band_id: state.value.selectedBand!.id,
              title: track.title,
              track_number: i + 1,
              duration_seconds: Math.round(duration),
              isrc: track.isrc || undefined,
              iswc: track.iswc || undefined,
              is_cover: track.is_cover,
              spotify_track_id: track.spotify_track_id || undefined,
              musicbrainz_work_id: track.musicbrainz_work_id || undefined,
              isrc_platform_assigned: track.isrc_platform_assigned || undefined,
            })

            // Create track credits
            if (track.credits.length > 0) {
              const validCredits = track.credits.filter(c => c.name.trim())
              if (validCredits.length > 0) {
                await setTrackCredits(dbTrack.id, validCredits as any)
              }
            }

            // Upload audio
            const { uploadUrl, key } = await getUploadUrl(
              'audio',
              state.value.selectedBand!.id,
              album.id,
              track.file.name,
              track.file.type,
              dbTrack.id
            )

            await uploadFileWithProgress(uploadUrl, track.file, (progress) => {
              track.progress = progress
            })

            // Get file extension for original format
            const ext = track.file.name.split('.').pop()?.toLowerCase() || 'flac'
            await updateTrack(dbTrack.id, {
              audio_key: key, // Keep for backwards compatibility
              original_audio_key: key, // Store as original lossless
              original_format: ext,
              transcoding_status: 'pending', // Will be transcoded by worker
            })

            track.id = dbTrack.id
            track.uploaded = true
          } catch (e: any) {
            track.error = e.message || 'Upload failed'
            console.error('Track upload failed:', e)
          } finally {
            track.uploading = false
          }
        }
      }

      // Check if this was a draft that needs to be published
      const wasUnpublished = !state.value.createdAlbum?.is_published
      const allTracksUploaded = state.value.tracks.every(t => t.uploaded || t.id)

      if (wasUnpublished && allTracksUploaded) {
        // Publish the album (triggers moderation)
        await updateAlbum(album.id, {
          is_published: true,
          rights_confirmed: true,
          rights_confirmed_at: new Date().toISOString(),
          rights_confirmed_by: user.value?.id,
          original_content_confirmed: originalContentConfirmed,
          p_line: state.value.albumForm.p_line || `℗ ${new Date().getFullYear()} ${state.value.albumForm.label_name || state.value.selectedBand?.name}`,
          c_line: state.value.albumForm.c_line || `© ${new Date().getFullYear()} ${state.value.albumForm.label_name || state.value.selectedBand?.name}`,
        })

        // Notify followers of new release
        $fetch(`/api/albums/${album.id}/notify-followers`, { method: 'POST' })
          .then((result: any) => {
            if (result.notified > 0) {
              console.log(`[New Release] Notified ${result.notified} followers`)
            }
          })
          .catch((err) => {
            console.error('Failed to notify followers:', err)
          })

        if (moderationEnabled.value) {
          toast.add({ title: 'Upload complete!', description: `"${state.value.albumForm.title}" is pending review`, color: 'green', icon: 'i-heroicons-check-circle' })
        } else {
          toast.add({ title: 'Release published!', description: `"${state.value.albumForm.title}" is now live`, color: 'green', icon: 'i-heroicons-check-circle' })
        }
      } else {
        toast.add({ title: 'Changes saved!', description: `"${state.value.albumForm.title}" has been updated`, color: 'green', icon: 'i-heroicons-check-circle' })
      }

      state.value.step = 3

    } else {
      // CREATE MODE: Create new album
      album = await createAlbum({
        band_id: state.value.selectedBand.id,
        title: state.value.albumForm.title,
        description: state.value.albumForm.description || undefined,
        release_type: state.value.albumForm.release_type,
        release_date: state.value.albumForm.release_date || undefined,
        label_name: state.value.albumForm.label_name || undefined,
        // Purchase settings
        purchasable: state.value.albumForm.purchasable,
        price_cents: state.value.albumForm.price_cents,
        pay_what_you_want: state.value.albumForm.pay_what_you_want,
        minimum_price_cents: state.value.albumForm.minimum_price_cents,
      })

      // Upload and process cover art
      const coverKey = await uploadProcessedCover(state.value.coverFile!, state.value.selectedBand.id, album.id)
      await updateAlbum(album.id, { cover_key: coverKey })

      // Create tracks and upload audio files
      for (let i = 0; i < state.value.tracks.length; i++) {
        const track = state.value.tracks[i]
        if (!track.file) continue

        track.uploading = true

        try {
          // Get duration first
          const duration = await getAudioDuration(track.file)

          const dbTrack = await createTrack({
            album_id: album.id,
            band_id: state.value.selectedBand!.id,
            title: track.title,
            track_number: i + 1,
            duration_seconds: Math.round(duration),
            isrc: track.isrc || undefined,
            iswc: track.iswc || undefined,
            is_cover: track.is_cover,
            spotify_track_id: track.spotify_track_id || undefined,
            musicbrainz_work_id: track.musicbrainz_work_id || undefined,
            isrc_platform_assigned: track.isrc_platform_assigned || undefined,
          })

          // Create track credits
          if (track.credits.length > 0) {
            const validCredits = track.credits.filter(c => c.name.trim())
            if (validCredits.length > 0) {
              await setTrackCredits(dbTrack.id, validCredits as any)
            }
          }

          // Upload audio
          const { uploadUrl, key } = await getUploadUrl(
            'audio',
            state.value.selectedBand!.id,
            album.id,
            track.file.name,
            track.file.type,
            dbTrack.id
          )

          await uploadFileWithProgress(uploadUrl, track.file, (progress) => {
            track.progress = progress
          })

          // Get file extension for original format
          const ext = track.file.name.split('.').pop()?.toLowerCase() || 'flac'
          await updateTrack(dbTrack.id, {
            audio_key: key, // Keep for backwards compatibility
            original_audio_key: key, // Store as original lossless
            original_format: ext,
            transcoding_status: 'pending', // Will be transcoded by worker
          })

          track.uploaded = true
        } catch (e: any) {
          track.error = e.message || 'Upload failed'
          console.error('Track upload failed:', e)
        } finally {
          track.uploading = false
        }
      }

      // Only publish if ALL tracks uploaded successfully
      const allTracksUploaded = state.value.tracks.every(t => t.uploaded)
      if (allTracksUploaded) {
        await updateAlbum(album.id, {
          is_published: true,
          rights_confirmed: true,
          rights_confirmed_at: new Date().toISOString(),
          rights_confirmed_by: user.value?.id,
          original_content_confirmed: originalContentConfirmed,
          p_line: `℗ ${new Date().getFullYear()} ${state.value.albumForm.label_name || state.value.selectedBand?.name}`,
          c_line: `© ${new Date().getFullYear()} ${state.value.albumForm.label_name || state.value.selectedBand?.name}`,
        })
        state.value.createdAlbum = album
        if (moderationEnabled.value) {
          toast.add({ title: 'Upload complete!', description: `"${state.value.albumForm.title}" is pending review`, color: 'green', icon: 'i-heroicons-check-circle' })
        } else {
          toast.add({ title: 'Release published!', description: `"${state.value.albumForm.title}" is now live`, color: 'green', icon: 'i-heroicons-check-circle' })
        }

        // Notify followers
        $fetch(`/api/albums/${album.id}/notify-followers`, { method: 'POST' })
          .then((result: any) => {
            if (result.notified > 0) {
              console.log(`[New Release] Notified ${result.notified} followers`)
            }
          })
          .catch((err) => {
            console.error('Failed to notify followers:', err)
          })
        state.value.step = 3
      } else {
        state.value.createdAlbum = album
        toast.add({ title: 'Partial upload', description: 'Some tracks failed. Album saved as draft.', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
      }
    }

  } catch (e: any) {
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload release', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    console.error('Upload failed:', e)
  } finally {
    state.value.uploading = false
  }
}
</script>
