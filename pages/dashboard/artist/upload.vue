<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
      <h1 class="text-3xl font-bold text-zinc-100">Upload Music</h1>
      <p class="text-zinc-400 mt-2">Create a new release and upload your tracks</p>
    </div>

    <!-- Select Artist -->
    <div v-if="!state.selectedBand" class="mb-8">
      <UploadArtistSelector
        :bands="bands"
        :loading="bandsLoading"
        @select="state.selectedBand = $event"
      />
    </div>

    <!-- Upload Form -->
    <div v-else>
      <!-- Selected Artist Header -->
      <div class="flex items-center gap-4 mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div
          class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
          :style="{ background: `linear-gradient(135deg, ${state.selectedBand.theme_color} 0%, #c026d3 100%)` }"
        >
          <img v-if="state.selectedBand.avatar_url" :src="state.selectedBand.avatar_url" :alt="state.selectedBand.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-lg font-bold text-white">{{ state.selectedBand.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="flex-1">
          <p class="text-sm text-zinc-400">Uploading as</p>
          <h3 class="font-semibold text-zinc-100">{{ state.selectedBand.name }}</h3>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="state.selectedBand = null">
          Change
        </UButton>
      </div>

      <!-- Step 1: Album Info -->
      <UploadAlbumDetailsStep
        v-if="state.step === 1"
        :band-name="state.selectedBand.name"
        @continue="state.step = 2"
      />

      <!-- Step 2: Upload Tracks -->
      <UploadTracksStep
        v-if="state.step === 2"
        @back="state.step = 1"
        @upload="startUpload"
        @open-deezer="openDeezerModal"
        @search-musicbrainz="searchMusicBrainz"
      />

      <!-- Step 3: Success -->
      <UploadSuccessStep
        v-if="state.step === 3"
        :album-title="state.albumForm.title"
        :view-url="`/${state.selectedBand?.slug}/${state.createdAlbum?.slug}`"
        :moderation-enabled="moderationEnabled"
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
import type { Band } from '~/composables/useBand'

definePageMeta({
  middleware: 'auth',
})

const { getUserBands } = useBand()
const { createAlbum, createTrack, updateTrack, updateAlbum, getUploadUrl, setTrackCredits, getStreamUrl } = useAlbum()
const { state, toast, uploadFileWithProgress, uploadProcessedCover, getAudioDuration, resetWizard } = useUploadWizard()
const { moderationEnabled, loadModerationSetting } = useModerationFilter()
const user = useSupabaseUser()

// Local state (not persisted)
const bands = ref<Band[]>([])
const bandsLoading = ref(true)

// Deezer modal
const deezerModalOpen = ref(false)
const deezerModalTrackIndex = ref<number | null>(null)
const deezerInitialQuery = ref('')

// Load bands and moderation setting
onMounted(async () => {
  // Load moderation setting in parallel
  loadModerationSetting()

  try {
    const loadedBands = await getUserBands()
    // Load avatar URLs from keys
    for (const band of loadedBands) {
      if (band.avatar_key) {
        try {
          band.avatar_url = await getStreamUrl(band.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar for band:', band.name, e)
        }
      }
    }
    // Only show active bands (pending/suspended can't upload)
    bands.value = loadedBands.filter(b => b.status === 'active')
  } catch (e) {
    console.error('Failed to load bands:', e)
  } finally {
    bandsLoading.value = false
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

// Upload
const startUpload = async () => {
  // Prevent double-click / double submission
  if (state.value.uploading) return
  if (!state.value.selectedBand || !state.value.coverFile || state.value.tracks.length === 0) return

  state.value.uploading = true

  // Get rights confirmation state from shared state
  const aiDeclaration = state.value.aiDeclaration
  const originalContentConfirmed = state.value.originalContentConfirmed

  try {
    // 1. Create the album in database
    const album = await createAlbum({
      band_id: state.value.selectedBand.id,
      title: state.value.albumForm.title,
      description: state.value.albumForm.description || undefined,
      release_type: state.value.albumForm.release_type,
      release_date: state.value.albumForm.release_date || undefined,
      label_name: state.value.albumForm.label_name || undefined,
    })

    // 2. Upload and process cover art (resizes to 600x600 square)
    const coverKey = await uploadProcessedCover(state.value.coverFile, state.value.selectedBand.id, album.id)

    // Update album with cover key
    await updateAlbum(album.id, { cover_key: coverKey })

    // 3. Create tracks and upload audio files
    for (let i = 0; i < state.value.tracks.length; i++) {
      const track = state.value.tracks[i]
      track.uploading = true

      try {
        // Create track in database with rights metadata
        const dbTrack = await createTrack({
          album_id: album.id,
          band_id: state.value.selectedBand!.id,
          title: track.title,
          track_number: i + 1,
          isrc: track.isrc || undefined,
          iswc: track.iswc || undefined,
          is_cover: track.is_cover,
          spotify_track_id: track.spotify_track_id || undefined,
          musicbrainz_work_id: track.musicbrainz_work_id || undefined,
          ai_declaration: aiDeclaration,
        })

        // Create track credits if any
        if (track.credits.length > 0) {
          const validCredits = track.credits.filter(c => c.name.trim())
          if (validCredits.length > 0) {
            await setTrackCredits(dbTrack.id, validCredits)
          }
        }

        // Get presigned URL and upload
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

        // Update track with audio key and duration
        const duration = await getAudioDuration(track.file)
        await updateTrack(dbTrack.id, {
          audio_key: key,
          duration_seconds: Math.round(duration),
        })

        track.uploaded = true
      } catch (e: any) {
        track.error = e.message || 'Upload failed'
        console.error('Track upload failed:', e)
      } finally {
        track.uploading = false
      }
    }

    // 4. Only publish if ALL tracks uploaded successfully
    const allTracksUploaded = state.value.tracks.every(t => t.uploaded)
    if (allTracksUploaded) {
      // Mark rights as confirmed and publish
      await updateAlbum(album.id, {
        is_published: true,
        rights_confirmed: true,
        rights_confirmed_at: new Date().toISOString(),
        rights_confirmed_by: user.value?.id,
        // Content protection declarations
        original_content_confirmed: originalContentConfirmed,
        // Generate P-line and C-line
        p_line: `℗ ${new Date().getFullYear()} ${state.value.albumForm.label_name || state.value.selectedBand?.name}`,
        c_line: `© ${new Date().getFullYear()} ${state.value.albumForm.label_name || state.value.selectedBand?.name}`,
      })
      state.value.createdAlbum = album
      if (moderationEnabled.value) {
        toast.add({ title: 'Upload complete!', description: `"${state.value.albumForm.title}" is pending review`, color: 'green', icon: 'i-heroicons-check-circle' })
      } else {
        toast.add({ title: 'Release published!', description: `"${state.value.albumForm.title}" is now live`, color: 'green', icon: 'i-heroicons-check-circle' })
      }

      // Notify followers of the new release (async, don't block)
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
      // Some tracks failed - keep as draft
      state.value.createdAlbum = album
      toast.add({ title: 'Partial upload', description: 'Some tracks failed. Album saved as draft.', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    }

  } catch (e: any) {
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload release', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    console.error('Upload failed:', e)
  } finally {
    state.value.uploading = false
  }
}
</script>
