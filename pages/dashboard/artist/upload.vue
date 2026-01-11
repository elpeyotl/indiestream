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
    <div v-if="!selectedBand" class="mb-8">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Select Artist Profile</h2>
        </template>

        <div v-if="bandsLoading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
        </div>

        <div v-else-if="bands.length === 0" class="text-center py-8">
          <p class="text-zinc-400 mb-4">You need an artist profile to upload music.</p>
          <UButton color="violet" to="/dashboard/artist/new">
            Create Artist Profile
          </UButton>
        </div>

        <div v-else class="space-y-3">
          <button
            v-for="band in bands"
            :key="band.id"
            class="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
            @click="selectedBand = band"
          >
            <div
              class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
              :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
            >
              <img v-if="band.avatar_url" :src="band.avatar_url" :alt="band.name" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-lg font-bold text-white">{{ band.name.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-zinc-100">{{ band.name }}</h3>
              <p class="text-sm text-zinc-400">{{ band.slug }}</p>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </UCard>
    </div>

    <!-- Upload Form -->
    <div v-else>
      <!-- Selected Artist Header -->
      <div class="flex items-center gap-4 mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div
          class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
          :style="{ background: `linear-gradient(135deg, ${selectedBand.theme_color} 0%, #c026d3 100%)` }"
        >
          <img v-if="selectedBand.avatar_url" :src="selectedBand.avatar_url" :alt="selectedBand.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-lg font-bold text-white">{{ selectedBand.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="flex-1">
          <p class="text-sm text-zinc-400">Uploading as</p>
          <h3 class="font-semibold text-zinc-100">{{ selectedBand.name }}</h3>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="selectedBand = null">
          Change
        </UButton>
      </div>

      <!-- Step 1: Album Info -->
      <UCard v-if="step === 1" class="bg-zinc-900/50 border-zinc-800 mb-6">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">1</div>
            <h2 class="text-lg font-semibold text-zinc-100">Release Details</h2>
          </div>
        </template>

        <form @submit.prevent="goToStep2" class="space-y-6">
          <!-- Release Type -->
          <UFormGroup label="Release Type" required>
            <div class="flex gap-3">
              <UButton
                v-for="type in releaseTypes"
                :key="type.value"
                :color="albumForm.release_type === type.value ? 'violet' : 'gray'"
                :variant="albumForm.release_type === type.value ? 'solid' : 'outline'"
                @click="albumForm.release_type = type.value"
              >
                {{ type.label }}
              </UButton>
            </div>
          </UFormGroup>

          <!-- Title -->
          <UFormGroup label="Title" required>
            <UInput
              v-model="albumForm.title"
              placeholder="e.g. Midnight Dreams"
              size="lg"
            />
          </UFormGroup>

          <!-- Description -->
          <UFormGroup label="Description" hint="Optional">
            <UTextarea
              v-model="albumForm.description"
              placeholder="Tell the story behind this release..."
              :rows="3"
              size="lg"
            />
          </UFormGroup>

          <!-- Release Date -->
          <UFormGroup label="Release Date" hint="Optional - leave blank for immediate release">
            <UInput
              v-model="albumForm.release_date"
              type="date"
              size="lg"
            />
          </UFormGroup>

          <!-- Cover Art -->
          <UFormGroup label="Cover Art" required>
            <div
              class="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer"
              :class="{ 'border-violet-500 bg-violet-500/10': coverPreview }"
              @click="coverInput?.click()"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onCoverDrop"
            >
              <input
                ref="coverInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="onCoverSelect"
              />

              <div v-if="coverPreview" class="space-y-4">
                <img :src="coverPreview" alt="Cover preview" class="w-40 h-40 mx-auto rounded-lg object-cover" />
                <p class="text-sm text-zinc-400">{{ coverFile?.name }}</p>
                <UButton color="gray" variant="ghost" size="sm" @click.stop="clearCover">
                  Remove
                </UButton>
              </div>

              <div v-else class="space-y-3">
                <UIcon name="i-heroicons-photo" class="w-12 h-12 mx-auto text-zinc-500" />
                <p class="text-zinc-300">Drop your cover art here or click to browse</p>
                <p class="text-sm text-zinc-500">JPEG, PNG or WebP. Recommended: 3000x3000px</p>
              </div>
            </div>
          </UFormGroup>

          <div class="flex justify-end pt-4">
            <UButton
              type="submit"
              color="violet"
              size="lg"
              :disabled="!albumForm.title || !coverFile"
            >
              Continue to Tracks
              <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Step 2: Upload Tracks -->
      <UCard v-if="step === 2" class="bg-zinc-900/50 border-zinc-800 mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">2</div>
              <h2 class="text-lg font-semibold text-zinc-100">Upload Tracks</h2>
            </div>
            <UButton color="gray" variant="ghost" size="sm" @click="step = 1">
              <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
              Back
            </UButton>
          </div>
        </template>

        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer mb-6"
          :class="{ 'border-violet-500 bg-violet-500/10': isDragging }"
          @click="audioInput?.click()"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onAudioDrop"
        >
          <input
            ref="audioInput"
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/flac,audio/aac,audio/ogg"
            multiple
            class="hidden"
            @change="onAudioSelect"
          />

          <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto text-zinc-500 mb-3" />
          <p class="text-zinc-300">Drop audio files here or click to browse</p>
          <p class="text-sm text-zinc-500 mt-1">MP3, WAV, FLAC, AAC, or OGG</p>
        </div>

        <!-- Track List -->
        <div v-if="tracks.length > 0" class="space-y-3">
          <div
            v-for="(track, index) in tracks"
            :key="index"
            class="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg"
          >
            <!-- Track Number -->
            <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold shrink-0">
              {{ index + 1 }}
            </div>

            <!-- Track Info -->
            <div class="flex-1 min-w-0">
              <UInput
                v-model="track.title"
                placeholder="Track title"
                variant="none"
                class="font-semibold text-zinc-100"
              />
              <p class="text-sm text-zinc-400 mt-1">
                {{ track.file.name }} · {{ formatFileSize(track.file.size) }}
              </p>
            </div>

            <!-- Upload Progress -->
            <div v-if="track.uploading" class="w-24">
              <UProgress :value="track.progress" color="violet" size="sm" />
            </div>

            <!-- Status -->
            <div v-else-if="track.uploaded" class="text-green-500">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
            </div>

            <div v-else-if="track.error" class="text-red-500">
              <UIcon name="i-heroicons-exclamation-circle" class="w-6 h-6" />
            </div>

            <!-- Remove -->
            <UButton
              v-if="!track.uploading && !track.uploaded"
              color="gray"
              variant="ghost"
              size="sm"
              @click="removeTrack(index)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </UButton>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-zinc-400">
          <p>No tracks added yet. Drop some audio files above!</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-between pt-6 border-t border-zinc-800 mt-6">
          <div class="text-sm text-zinc-400">
            {{ tracks.length }} track{{ tracks.length !== 1 ? 's' : '' }} · {{ formatFileSize(totalSize) }}
          </div>
          <UButton
            color="violet"
            size="lg"
            :loading="uploading"
            :disabled="tracks.length === 0 || uploading"
            @click="startUpload"
          >
            <UIcon name="i-heroicons-cloud-arrow-up" class="w-5 h-5 mr-1" />
            Upload & Publish
          </UButton>
        </div>
      </UCard>

      <!-- Step 3: Success -->
      <UCard v-if="step === 3" class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center py-8">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-check" class="w-10 h-10 text-green-500" />
          </div>
          <h2 class="text-2xl font-bold text-zinc-100 mb-2">Upload Complete!</h2>
          <p class="text-zinc-400 mb-8">Your release "{{ albumForm.title }}" is now live.</p>

          <div class="flex justify-center gap-4">
            <UButton color="violet" :to="`/${selectedBand?.slug}/${createdAlbum?.slug}`">
              View Release
            </UButton>
            <UButton color="gray" variant="outline" @click="resetForm">
              Upload Another
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

definePageMeta({
  middleware: 'auth',
})

const { getUserBands } = useBand()
const { createAlbum, createTrack, updateTrack, updateAlbum, getUploadUrl } = useAlbum()
const toast = useToast()

// State
const bands = ref<Band[]>([])
const bandsLoading = ref(true)
const selectedBand = ref<Band | null>(null)
const step = ref(1)
const uploading = ref(false)
const isDragging = ref(false)
const createdAlbum = ref<Album | null>(null)

// Refs
const coverInput = ref<HTMLInputElement>()
const audioInput = ref<HTMLInputElement>()

// Album form
const albumForm = reactive({
  title: '',
  description: '',
  release_type: 'album' as 'album' | 'ep' | 'single',
  release_date: '',
})

const releaseTypes = [
  { value: 'album', label: 'Album' },
  { value: 'ep', label: 'EP' },
  { value: 'single', label: 'Single' },
]

// Cover
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

// Tracks
interface TrackUpload {
  file: File
  title: string
  uploading: boolean
  uploaded: boolean
  progress: number
  error: string | null
}
const tracks = ref<TrackUpload[]>([])

const totalSize = computed(() => tracks.value.reduce((sum, t) => sum + t.file.size, 0))

// Load bands
onMounted(async () => {
  try {
    bands.value = await getUserBands()
  } catch (e) {
    console.error('Failed to load bands:', e)
  } finally {
    bandsLoading.value = false
  }
})

// Drag handlers
const onDragOver = () => { isDragging.value = true }
const onDragLeave = () => { isDragging.value = false }

// Cover handlers
const onCoverSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) setCoverFile(file)
}

const onCoverDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    setCoverFile(file)
  }
}

const setCoverFile = (file: File) => {
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

const clearCover = () => {
  coverFile.value = null
  coverPreview.value = null
  if (coverInput.value) coverInput.value.value = ''
}

// Audio handlers
const onAudioSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) addAudioFiles(Array.from(files))
}

const onAudioDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'))
    addAudioFiles(audioFiles)
  }
}

const addAudioFiles = (files: File[]) => {
  for (const file of files) {
    // Generate title from filename
    const title = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/^\d+[\s._-]*/, '') // Remove leading track numbers
      .replace(/[_-]/g, ' ') // Replace underscores/dashes with spaces
      .trim()

    tracks.value.push({
      file,
      title: title || 'Untitled Track',
      uploading: false,
      uploaded: false,
      progress: 0,
      error: null,
    })
  }
}

const removeTrack = (index: number) => {
  tracks.value.splice(index, 1)
}

// Step navigation
const goToStep2 = () => {
  if (albumForm.title && coverFile.value) {
    step.value = 2
  }
}

// Upload
const startUpload = async () => {
  // Prevent double-click / double submission
  if (uploading.value) return
  if (!selectedBand.value || !coverFile.value || tracks.value.length === 0) return

  uploading.value = true

  try {
    // 1. Create the album in database
    const album = await createAlbum({
      band_id: selectedBand.value.id,
      title: albumForm.title,
      description: albumForm.description || undefined,
      release_type: albumForm.release_type,
      release_date: albumForm.release_date || undefined,
    })

    // 2. Upload cover art
    const coverExt = coverFile.value.name.split('.').pop()?.toLowerCase() || 'jpg'
    const { uploadUrl: coverUploadUrl, key: coverKey } = await getUploadUrl(
      'cover',
      selectedBand.value.id,
      album.id,
      `cover.${coverExt}`,
      coverFile.value.type
    )

    await uploadFile(coverUploadUrl, coverFile.value)

    // Update album with cover key
    await updateAlbum(album.id, { cover_key: coverKey })

    // 3. Create tracks and upload audio files
    for (let i = 0; i < tracks.value.length; i++) {
      const track = tracks.value[i]
      track.uploading = true

      try {
        // Create track in database
        const dbTrack = await createTrack({
          album_id: album.id,
          band_id: selectedBand.value!.id,
          title: track.title,
          track_number: i + 1,
        })

        // Get presigned URL and upload
        const { uploadUrl, key } = await getUploadUrl(
          'audio',
          selectedBand.value!.id,
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
    const allTracksUploaded = tracks.value.every(t => t.uploaded)
    if (allTracksUploaded) {
      await updateAlbum(album.id, { is_published: true })
      createdAlbum.value = album
      toast.add({ title: 'Release published!', description: `"${albumForm.title}" is now live`, color: 'green', icon: 'i-heroicons-check-circle' })
      step.value = 3
    } else {
      // Some tracks failed - keep as draft
      createdAlbum.value = album
      toast.add({ title: 'Partial upload', description: 'Some tracks failed. Album saved as draft.', color: 'amber', icon: 'i-heroicons-exclamation-triangle' })
    }

  } catch (e: any) {
    toast.add({ title: 'Upload failed', description: e.message || 'Failed to upload release', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    console.error('Upload failed:', e)
  } finally {
    uploading.value = false
  }
}

// Upload helpers
const uploadFile = async (url: string, file: File): Promise<void> => {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }
}

const uploadFileWithProgress = (url: string, file: File, onProgress: (progress: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration)
    })
    audio.addEventListener('error', () => {
      resolve(0)
    })
    audio.src = URL.createObjectURL(file)
  })
}

// Utilities
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Reset
const resetForm = () => {
  step.value = 1
  albumForm.title = ''
  albumForm.description = ''
  albumForm.release_type = 'album'
  albumForm.release_date = ''
  coverFile.value = null
  coverPreview.value = null
  tracks.value = []
  createdAlbum.value = null
}
</script>
