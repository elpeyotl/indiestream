<template>
  <UCard class="bg-zinc-900/50 border-zinc-800 mb-6">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">2</div>
          <h2 class="text-lg font-semibold text-zinc-100">Upload Tracks</h2>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="goBack">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
          Back
        </UButton>
      </div>
    </template>

    <!-- Drop Zone -->
    <div
      class="border-2 border-dashed rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer mb-6"
      :class="{
        'border-violet-500 bg-violet-500/10': isDragging,
        'border-red-500 bg-red-500/10': showValidationErrors && state.tracks.length === 0,
        'border-zinc-700': !isDragging && !(showValidationErrors && state.tracks.length === 0)
      }"
      @click="audioInput?.click()"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onAudioDrop"
    >
      <input
        ref="audioInput"
        type="file"
        accept="audio/wav,audio/flac,audio/aiff,audio/x-aiff,.wav,.flac,.aiff,.aif"
        multiple
        class="hidden"
        @change="onAudioSelect"
      />

      <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-3" :class="showValidationErrors && state.tracks.length === 0 ? 'text-red-500' : 'text-zinc-500'" />
      <p :class="showValidationErrors && state.tracks.length === 0 ? 'text-red-400' : 'text-zinc-300'">
        {{ showValidationErrors && state.tracks.length === 0 ? 'Please add at least one track' : 'Drop audio files here or click to browse' }}
      </p>
      <p class="text-sm text-zinc-500 mt-1">WAV, FLAC, or AIFF — lossless formats only (max 300MB)</p>
    </div>

    <!-- Track List -->
    <div v-if="state.tracks.length > 0" class="space-y-4">
      <UploadTrackItem
        v-for="(track, index) in state.tracks"
        :key="track.id || (track.file?.name ?? '') + index"
        :track="track"
        :track-number="index + 1"
        :is-drag-over="dragOverIndex === index"
        :can-copy-credits="canCopyCredits(index)"
        :has-copied-credits="!!state.copiedCredits && state.copiedCredits.length > 0"
        :show-errors="showValidationErrors"
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
        @update:lyrics_language="track.lyrics_language = $event"
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
        @generate-isrc="$emit('generate-isrc', index)"
        @release-isrc="$emit('release-isrc', index)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8 text-zinc-400">
      <p>No tracks added yet. Drop some audio files above!</p>
    </div>

    <!-- Rights Confirmation -->
    <div v-if="state.tracks.length > 0" class="mt-6 p-4 bg-zinc-900 rounded-lg border" :class="showValidationErrors && !allCheckboxesChecked ? 'border-red-500/50' : 'border-zinc-700'">
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

      <!-- Language Warning -->
      <div v-if="!allTracksHaveLyricsLanguage" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p class="text-sm text-red-400">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
          All tracks require a Lyrics Language selection.
        </p>
      </div>

      <!-- Author Credits Warning -->
      <div v-if="allTracksHaveLyricsLanguage && !allTracksHaveValidAuthorCredits" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p class="text-sm text-red-400">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
          Tracks with lyrics require an Author credit. Instrumental tracks cannot have Author credits.
        </p>
      </div>

      <div class="space-y-3">
        <UCheckbox
          v-model="state.rightsConfirmed"
          :color="showValidationErrors && !state.rightsConfirmed ? 'red' : undefined"
        >
          <template #label>
            <span :class="showValidationErrors && !state.rightsConfirmed ? 'text-red-400' : 'text-zinc-300'">
              I confirm that I own or control all rights to distribute this music
            </span>
          </template>
        </UCheckbox>
        <UCheckbox
          v-model="state.aiDeclaration"
          :color="showValidationErrors && !state.aiDeclaration ? 'red' : undefined"
        >
          <template #label>
            <span :class="showValidationErrors && !state.aiDeclaration ? 'text-red-400' : 'text-zinc-300'">
              This music was <strong class="text-zinc-100">created by me/my collaborators</strong> and is <strong class="text-zinc-100">not AI-generated</strong>
              <span class="text-zinc-500">(AI tools for mixing/mastering are permitted)</span>
            </span>
          </template>
        </UCheckbox>
        <UCheckbox
          v-model="state.originalContentConfirmed"
          :color="showValidationErrors && !state.originalContentConfirmed ? 'red' : undefined"
        >
          <template #label>
            <span :class="showValidationErrors && !state.originalContentConfirmed ? 'text-red-400' : 'text-zinc-300'">
              This is <strong class="text-zinc-100">original content</strong> — not a cover, remix, or sample of copyrighted work
              <span class="text-zinc-500">(unless properly licensed and declared above)</span>
            </span>
          </template>
        </UCheckbox>
        <UCheckbox
          v-model="state.falseInfoUnderstood"
          :color="showValidationErrors && !state.falseInfoUnderstood ? 'red' : undefined"
        >
          <template #label>
            <span :class="showValidationErrors && !state.falseInfoUnderstood ? 'text-red-400' : 'text-zinc-300'">
              I understand that providing false information may result in account termination and legal action
            </span>
          </template>
        </UCheckbox>
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="showValidationErrors && validationErrors.length > 0" class="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div class="flex items-start gap-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-red-400">Please fix the following errors before uploading:</p>
          <ul class="mt-2 text-sm text-red-300 list-disc list-inside space-y-1">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-between pt-6 border-t border-zinc-800 mt-6">
      <div class="text-sm text-zinc-400">
        {{ state.tracks.length }} track{{ state.tracks.length !== 1 ? 's' : '' }}
        <span v-if="totalSize > 0"> · {{ formatFileSize(totalSize) }}</span>
      </div>
      <UButton
        color="violet"
        size="lg"
        :loading="state.uploading"
        :disabled="state.uploading"
        @click="handleUpload"
      >
        <UIcon v-if="!state.uploading" name="i-heroicons-cloud-arrow-up" class="w-5 h-5 mr-1" />
        {{ state.uploading ? (state.isEditMode ? 'Saving...' : 'Uploading...') : (state.isEditMode ? 'Save Changes' : 'Upload & Publish') }}
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { TrackCreditForm } from '~/composables/useUploadWizard'

const emit = defineEmits<{
  'back': []
  'upload': []
  'open-deezer': [trackIndex: number]
  'search-musicbrainz': [trackIndex: number]
  'generate-isrc': [trackIndex: number]
  'release-isrc': [trackIndex: number]
}>()

const {
  state,
  formatFileSize,
  addAudioFiles,
  removeTrack,
  reorderTracks,
  addCredit,
  removeCredit,
  copyCredits,
  pasteCredits,
} = useUploadWizard()

// Local state (not persisted - just UI state for drag/drop)
const audioInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const draggedTrackIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const showValidationErrors = ref(false)

// ISRC validation regex: 2 letters + 3 alphanumeric + 2 digits + 5 digits = 12 chars
const ISRC_REGEX = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/

const isValidIsrc = (isrc: string): boolean => {
  if (!isrc) return false
  return ISRC_REGEX.test(isrc.toUpperCase())
}

// Computed
const totalSize = computed(() => state.value.tracks.reduce((sum, t) => sum + (t.file?.size ?? 0), 0))

const allTracksHaveValidIsrc = computed(() => {
  return state.value.tracks.length > 0 && state.value.tracks.every(t => isValidIsrc(t.isrc || ''))
})

// Keep for backwards compat but use the new one
const allTracksHaveIsrc = allTracksHaveValidIsrc

const allTracksHaveComposer = computed(() => {
  return state.value.tracks.length > 0 && state.value.tracks.every(t =>
    t.credits.some(c =>
      (c.role === 'composer' || c.role === 'composer_author') && c.name.trim()
    )
  )
})

const allTracksHaveLyricsLanguage = computed(() => {
  return state.value.tracks.length > 0 && state.value.tracks.every(t => !!t.lyrics_language)
})

// Check if all tracks have valid author credits based on language
const allTracksHaveValidAuthorCredits = computed(() => {
  return state.value.tracks.length > 0 && state.value.tracks.every(t => {
    const hasAuthor = t.credits.some(c =>
      (c.role === 'author' || c.role === 'composer_author') && c.name.trim()
    )
    // Instrumental: no author allowed
    if (t.lyrics_language === 'instrumental') {
      return !hasAuthor
    }
    // Non-instrumental: must have author
    if (t.lyrics_language && t.lyrics_language !== 'instrumental') {
      return hasAuthor
    }
    // No language selected yet - let language validation catch this
    return true
  })
})

const allCheckboxesChecked = computed(() => {
  return state.value.rightsConfirmed &&
    state.value.falseInfoUnderstood &&
    state.value.aiDeclaration &&
    state.value.originalContentConfirmed
})

const canPublish = computed(() => {
  return state.value.tracks.length > 0 &&
    allTracksHaveIsrc.value &&
    allTracksHaveComposer.value &&
    allTracksHaveLyricsLanguage.value &&
    allTracksHaveValidAuthorCredits.value &&
    allCheckboxesChecked.value
})

// Validation errors list
const validationErrors = computed(() => {
  const errors: string[] = []

  if (state.value.tracks.length === 0) {
    errors.push('Add at least one track')
  }

  if (state.value.tracks.length > 0 && !allTracksHaveValidIsrc.value) {
    const missingCount = state.value.tracks.filter(t => !t.isrc).length
    const invalidCount = state.value.tracks.filter(t => t.isrc && !isValidIsrc(t.isrc)).length

    if (missingCount > 0) {
      errors.push(`${missingCount} track${missingCount > 1 ? 's' : ''} missing ISRC code`)
    }
    if (invalidCount > 0) {
      errors.push(`${invalidCount} track${invalidCount > 1 ? 's have' : ' has'} invalid ISRC format`)
    }
  }

  if (state.value.tracks.length > 0 && !allTracksHaveComposer.value) {
    const count = state.value.tracks.filter(t => !t.credits.some(c => (c.role === 'composer' || c.role === 'composer_author') && c.name.trim())).length
    errors.push(`${count} track${count > 1 ? 's' : ''} missing Composer credit`)
  }

  if (state.value.tracks.length > 0 && !allTracksHaveLyricsLanguage.value) {
    const count = state.value.tracks.filter(t => !t.lyrics_language).length
    errors.push(`${count} track${count > 1 ? 's' : ''} missing Lyrics Language`)
  }

  if (state.value.tracks.length > 0 && !allTracksHaveValidAuthorCredits.value) {
    // Check for instrumental tracks with author
    const instrumentalWithAuthor = state.value.tracks.filter(t => {
      if (t.lyrics_language !== 'instrumental') return false
      return t.credits.some(c => (c.role === 'author' || c.role === 'composer_author') && c.name.trim())
    }).length
    if (instrumentalWithAuthor > 0) {
      errors.push(`${instrumentalWithAuthor} instrumental track${instrumentalWithAuthor > 1 ? 's have' : ' has'} Author credits (not allowed)`)
    }

    // Check for non-instrumental tracks missing author
    const nonInstrumentalMissingAuthor = state.value.tracks.filter(t => {
      if (!t.lyrics_language || t.lyrics_language === 'instrumental') return false
      return !t.credits.some(c => (c.role === 'author' || c.role === 'composer_author') && c.name.trim())
    }).length
    if (nonInstrumentalMissingAuthor > 0) {
      errors.push(`${nonInstrumentalMissingAuthor} track${nonInstrumentalMissingAuthor > 1 ? 's' : ''} with lyrics missing Author credit`)
    }
  }

  if (!state.value.rightsConfirmed) {
    errors.push('Confirm you own the rights to distribute this music')
  }

  if (!state.value.aiDeclaration) {
    errors.push('Confirm the music is not AI-generated')
  }

  if (!state.value.originalContentConfirmed) {
    errors.push('Confirm this is original content')
  }

  if (!state.value.falseInfoUnderstood) {
    errors.push('Acknowledge the consequences of false information')
  }

  return errors
})

// Auto-clear validation errors when all issues are fixed
watch(canPublish, (canNowPublish) => {
  if (canNowPublish && showValidationErrors.value) {
    showValidationErrors.value = false
  }
})

// Handle upload with validation
const handleUpload = () => {
  if (!canPublish.value) {
    showValidationErrors.value = true
    // Scroll to validation summary
    nextTick(() => {
      const summary = document.querySelector('.bg-red-500\\/10')
      summary?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return
  }

  showValidationErrors.value = false
  emit('upload')
}

// Go back to step 1
const goBack = () => {
  showValidationErrors.value = false
  state.value.step = 1
  emit('back')
}

// Audio file handlers
const onAudioSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) {
    addAudioFiles(Array.from(files))
    showValidationErrors.value = false
  }
}

const onAudioDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) {
    // Filter to lossless audio formats
    const losslessMimeTypes = ['audio/wav', 'audio/flac', 'audio/aiff', 'audio/x-aiff']
    const losslessExtensions = ['wav', 'flac', 'aif', 'aiff']
    const audioFiles = Array.from(files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      return losslessMimeTypes.includes(f.type) || losslessExtensions.includes(ext || '')
    })
    if (audioFiles.length > 0) {
      addAudioFiles(audioFiles)
      showValidationErrors.value = false
    }
  }
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

  reorderTracks(draggedTrackIndex.value, targetIndex)

  draggedTrackIndex.value = null
  dragOverIndex.value = null
}

// Credit helpers
const canCopyCredits = (trackIndex: number) => {
  const track = state.value.tracks[trackIndex]
  return track.credits.length > 0 && track.credits.every(c => c.name.trim() && c.role)
}

const updateCreditRole = (trackIndex: number, [creditIndex, value]: [number, string]) => {
  state.value.tracks[trackIndex].credits[creditIndex].role = value as TrackCreditForm['role']
}

const updateCreditName = (trackIndex: number, [creditIndex, value]: [number, string]) => {
  state.value.tracks[trackIndex].credits[creditIndex].name = value
}

const updateCreditIpi = (trackIndex: number, [creditIndex, value]: [number, string]) => {
  state.value.tracks[trackIndex].credits[creditIndex].ipi_number = value
}
</script>
