<template>
  <UCard class="bg-zinc-900/50 border-zinc-800 mb-6">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">2</div>
          <h2 class="text-lg font-semibold text-zinc-100">Upload Tracks</h2>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="$emit('back')">
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
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
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
    <div v-if="tracks.length > 0" class="space-y-4">
      <UploadTrackItem
        v-for="(track, index) in tracks"
        :key="track.file.name + index"
        :track="track"
        :track-number="index + 1"
        :is-drag-over="dragOverIndex === index"
        :can-copy-credits="canCopyCredits(index)"
        :has-copied-credits="!!copiedCredits && copiedCredits.length > 0"
        @dragstart="onTrackDragStart($event, index)"
        @dragend="onTrackDragEnd"
        @dragover="onTrackDragOver(index)"
        @dragleave="onTrackDragLeave"
        @drop="onTrackDrop(index)"
        @remove="removeTrack(index)"
        @update:title="track.title = $event"
        @update:isrc="track.isrc = $event"
        @update:iswc="track.iswc = $event"
        @update:is_cover="track.is_cover = $event"
        @toggle-credits="track.showCredits = !track.showCredits"
        @add-credit="addCredit(index)"
        @remove-credit="removeCredit(index, $event)"
        @update:credit-role="updateCreditRole(index, $event)"
        @update:credit-name="updateCreditName(index, $event)"
        @update:credit-ipi="updateCreditIpi(index, $event)"
        @copy-credits="copyCredits(index)"
        @paste-credits="pasteCredits(index)"
        @open-deezer="$emit('open-deezer', index)"
        @search-musicbrainz="$emit('search-musicbrainz', index)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8 text-zinc-400">
      <p>No tracks added yet. Drop some audio files above!</p>
    </div>

    <!-- Rights Confirmation -->
    <div v-if="tracks.length > 0" class="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
      <h3 class="text-sm font-semibold text-zinc-100 mb-3">Rights Confirmation</h3>

      <!-- ISRC Warning -->
      <div v-if="!allTracksHaveIsrc" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p class="text-sm text-red-400">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
          All tracks require an ISRC code before publishing.
        </p>
      </div>

      <!-- Composer Warning -->
      <div v-if="!allTracksHaveComposer" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p class="text-sm text-red-400">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
          All tracks require at least one Composer or Composer & Author credit.
        </p>
      </div>

      <div class="space-y-3">
        <UCheckbox
          v-model="rightsConfirmed"
          label="I confirm that I own or control all rights to distribute this music"
        />
        <UCheckbox v-model="aiDeclaration">
          <template #label>
            <span class="text-zinc-300">
              This music was <strong class="text-zinc-100">created by me/my collaborators</strong> and is <strong class="text-zinc-100">not AI-generated</strong>
              <span class="text-zinc-500">(AI tools for mixing/mastering are permitted)</span>
            </span>
          </template>
        </UCheckbox>
        <UCheckbox v-model="originalContentConfirmed">
          <template #label>
            <span class="text-zinc-300">
              This is <strong class="text-zinc-100">original content</strong> — not a cover, remix, or sample of copyrighted work
              <span class="text-zinc-500">(unless properly licensed and declared above)</span>
            </span>
          </template>
        </UCheckbox>
        <UCheckbox
          v-model="falseInfoUnderstood"
          label="I understand that providing false information may result in account termination and legal action"
        />
      </div>
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
        :disabled="!canPublish || uploading"
        @click="$emit('upload')"
      >
        <UIcon name="i-heroicons-cloud-arrow-up" class="w-5 h-5 mr-1" />
        Upload & Publish
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { TrackUpload, TrackCredit } from '~/composables/useUploadWizard'

const props = defineProps<{
  tracks: TrackUpload[]
  uploading: boolean
}>()

const emit = defineEmits<{
  'back': []
  'upload': []
  'open-deezer': [trackIndex: number]
  'search-musicbrainz': [trackIndex: number]
}>()

const { formatFileSize, createTrackUpload } = useUploadWizard()

// Local state
const audioInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const draggedTrackIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const copiedCredits = ref<TrackCredit[] | null>(null)

// Rights confirmation state
const rightsConfirmed = ref(false)
const falseInfoUnderstood = ref(false)
const aiDeclaration = ref(false)
const originalContentConfirmed = ref(false)

// Computed
const totalSize = computed(() => props.tracks.reduce((sum, t) => sum + t.file.size, 0))

const allTracksHaveIsrc = computed(() => {
  return props.tracks.length > 0 && props.tracks.every(t => t.isrc && t.isrc.length > 0)
})

const allTracksHaveComposer = computed(() => {
  return props.tracks.length > 0 && props.tracks.every(t =>
    t.credits.some(c =>
      (c.role === 'composer' || c.role === 'composer_author') && c.name.trim()
    )
  )
})

const canPublish = computed(() => {
  return props.tracks.length > 0 &&
    allTracksHaveIsrc.value &&
    allTracksHaveComposer.value &&
    rightsConfirmed.value &&
    falseInfoUnderstood.value &&
    aiDeclaration.value &&
    originalContentConfirmed.value
})

// Audio file handlers
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
    props.tracks.push(createTrackUpload(file))
  }
}

const removeTrack = (index: number) => {
  props.tracks.splice(index, 1)
}

// Track drag-and-drop reordering
const onTrackDragStart = (e: DragEvent, index: number) => {
  draggedTrackIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

const onTrackDragEnd = () => {
  draggedTrackIndex.value = null
  dragOverIndex.value = null
}

const onTrackDragOver = (index: number) => {
  if (draggedTrackIndex.value !== null && draggedTrackIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const onTrackDragLeave = () => {
  dragOverIndex.value = null
}

const onTrackDrop = (targetIndex: number) => {
  if (draggedTrackIndex.value === null || draggedTrackIndex.value === targetIndex) {
    dragOverIndex.value = null
    return
  }

  const draggedTrack = props.tracks[draggedTrackIndex.value]
  props.tracks.splice(draggedTrackIndex.value, 1)
  props.tracks.splice(targetIndex, 0, draggedTrack)

  draggedTrackIndex.value = null
  dragOverIndex.value = null
}

// Credit management
const addCredit = (trackIndex: number) => {
  props.tracks[trackIndex].credits.push({
    role: 'composer',
    name: '',
    ipi_number: '',
  })
  props.tracks[trackIndex].showCredits = true
}

const removeCredit = (trackIndex: number, creditIndex: number) => {
  props.tracks[trackIndex].credits.splice(creditIndex, 1)
}

const updateCreditRole = (trackIndex: number, [creditIndex, value]: [number, string]) => {
  props.tracks[trackIndex].credits[creditIndex].role = value as TrackCredit['role']
}

const updateCreditName = (trackIndex: number, [creditIndex, value]: [number, string]) => {
  props.tracks[trackIndex].credits[creditIndex].name = value
}

const updateCreditIpi = (trackIndex: number, [creditIndex, value]: [number, string]) => {
  props.tracks[trackIndex].credits[creditIndex].ipi_number = value
}

const canCopyCredits = (trackIndex: number) => {
  const track = props.tracks[trackIndex]
  return track.credits.length > 0 && track.credits.every(c => c.name.trim() && c.role)
}

const copyCredits = (trackIndex: number) => {
  const track = props.tracks[trackIndex]
  copiedCredits.value = JSON.parse(JSON.stringify(track.credits))
}

const pasteCredits = (trackIndex: number) => {
  if (!copiedCredits.value) return
  const track = props.tracks[trackIndex]
  for (const credit of copiedCredits.value) {
    track.credits.push({ ...credit })
  }
  track.showCredits = true
}

// Expose state for parent
defineExpose({
  rightsConfirmed,
  aiDeclaration,
  originalContentConfirmed,
  reset: () => {
    rightsConfirmed.value = false
    falseInfoUnderstood.value = false
    aiDeclaration.value = false
    originalContentConfirmed.value = false
    copiedCredits.value = null
  },
})
</script>
