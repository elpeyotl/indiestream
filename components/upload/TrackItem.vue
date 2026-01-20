<template>
  <div
    class="p-4 bg-zinc-800/50 rounded-lg border"
    :class="{
      'border-violet-500 bg-violet-500/10': isDragOver,
      'border-red-500/50': showErrors && hasErrors,
      'border-zinc-700': !isDragOver && !(showErrors && hasErrors)
    }"
    @dragover.prevent="$emit('dragover')"
    @dragleave="$emit('dragleave')"
    @drop.prevent="$emit('drop')"
  >
    <!-- Track Header -->
    <div class="flex items-center gap-4 mb-4">
      <!-- Drag Handle (only this element is draggable) -->
      <div
        class="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 select-none"
        draggable="true"
        @dragstart="$emit('dragstart', $event)"
        @dragend="$emit('dragend')"
      >
        <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
      </div>

      <!-- Track Number -->
      <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" :class="showErrors && hasErrors ? 'bg-red-500/20 text-red-400' : 'bg-zinc-700'">
        {{ trackNumber }}
      </div>

      <!-- Track Title -->
      <div class="flex-1 min-w-0">
        <div class="group/title relative">
          <UInput
            :model-value="track.title"
            placeholder="Track title"
            size="lg"
            class="font-semibold text-zinc-100 bg-transparent hover:bg-zinc-700/50 focus:bg-zinc-700/50 rounded-lg transition-colors"
            @update:model-value="$emit('update:title', $event)"
          >
            <template #trailing>
              <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-zinc-500 group-hover/title:text-zinc-300 transition-colors" />
            </template>
          </UInput>
        </div>
        <p v-if="track.file" class="text-sm text-zinc-400 mt-1 pl-3">
          <UIcon name="i-heroicons-document" class="w-3 h-3 inline mr-1" />
          {{ track.file.name }} · {{ formatFileSize(track.file.size) }}
        </p>
        <p v-else-if="track.duration" class="text-sm text-zinc-400 mt-1 pl-3">
          <UIcon name="i-heroicons-musical-note" class="w-3 h-3 inline mr-1" />
          {{ formatDuration(track.duration) }}
        </p>
      </div>

      <!-- Upload Progress -->
      <div v-if="track.uploading" class="w-24">
        <UProgress :value="track.progress" color="violet" size="sm" />
      </div>

      <!-- Status: Existing track indicator (edit mode) -->
      <div v-else-if="track.uploaded && track.id" class="flex items-center gap-2">
        <UBadge color="green" variant="subtle" size="xs">
          <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
          Saved
        </UBadge>
      </div>

      <!-- Status: Just uploaded (new track during upload flow) -->
      <div v-else-if="track.uploaded" class="text-green-500">
        <UIcon name="i-heroicons-check-circle" class="w-6 h-6" />
      </div>

      <div v-else-if="track.error" class="text-red-500">
        <UIcon name="i-heroicons-exclamation-circle" class="w-6 h-6" />
      </div>

      <!-- Error indicator when validation fails -->
      <div v-else-if="showErrors && hasErrors" class="text-red-400">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
      </div>

      <!-- Remove (always show except during active upload) -->
      <UButton
        v-if="!track.uploading"
        color="gray"
        variant="ghost"
        size="sm"
        @click="$emit('remove')"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Track Metadata (show for new tracks and existing tracks in edit mode) -->
    <div v-if="!track.uploading && (!track.uploaded || track.id)" class="space-y-4 pt-4 border-t border-zinc-700">
      <!-- ISRC Row -->
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1" :class="showErrors && (!track.isrc || !isrcFormatValid) ? 'text-red-400' : 'text-zinc-300'">
            ISRC Code <span class="text-red-400">*</span>
            <span v-if="showErrors && !track.isrc" class="text-red-400 font-normal ml-2">— Required</span>
            <span v-else-if="showErrors && !isrcFormatValid" class="text-red-400 font-normal ml-2">— Invalid format</span>
            <UBadge v-if="track.isrc_platform_assigned" color="violet" variant="subtle" size="xs" class="ml-2">
              Platform ISRC
            </UBadge>
          </label>
          <div class="flex gap-2">
            <UInput
              :model-value="track.isrc"
              placeholder="e.g. USRC12345678"
              size="sm"
              class="flex-1 uppercase"
              maxlength="12"
              :color="showErrors && (!track.isrc || !isrcFormatValid) ? 'red' : undefined"
              :disabled="track.isrc_platform_assigned"
              @update:model-value="handleIsrcInput"
            />
            <!-- Release platform ISRC button -->
            <UButton
              v-if="track.isrc_platform_assigned"
              color="gray"
              variant="ghost"
              size="sm"
              title="Release platform ISRC to enter your own"
              @click="$emit('release-isrc')"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </UButton>
            <!-- Generate ISRC button -->
            <UButton
              v-if="!track.isrc && !track.isrc_platform_assigned"
              color="violet"
              variant="outline"
              size="sm"
              :loading="track.generatingIsrc"
              @click="$emit('generate-isrc')"
            >
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4 mr-1" />
              Generate
            </UButton>
            <UButton
              color="gray"
              variant="outline"
              size="sm"
              :loading="track.fetchingIsrc"
              @click="$emit('open-deezer')"
            >
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 mr-1" />
              Deezer
            </UButton>
          </div>
          <p v-if="track.isrc && !isrcFormatValid" class="text-xs text-red-400 mt-1">
            ISRC must be exactly 12 characters: 2 letters + 3 alphanumeric + 7 digits (e.g., USRC12345678)
          </p>
          <p v-else-if="track.isrc_platform_assigned" class="text-xs text-zinc-500 mt-1">
            This is a platform-assigned ISRC. Click <UIcon name="i-heroicons-x-mark" class="w-3 h-3 inline" /> to release and enter your own.
          </p>
          <p v-else class="text-xs text-zinc-500 mt-1">
            Don't have an ISRC? Click <span class="text-violet-400">Generate</span> for a free platform-assigned code, or search on Deezer.
          </p>
        </div>

        <!-- Is Cover Checkbox -->
        <div class="pt-6">
          <UCheckbox
            :model-value="track.is_cover"
            label="Cover song"
            @update:model-value="$emit('update:is_cover', $event)"
          />
        </div>
      </div>

      <!-- ISWC Row (Optional) -->
      <div>
        <label class="block text-sm font-medium text-zinc-300 mb-1">ISWC Code <span class="text-zinc-500">(optional)</span></label>
        <div class="flex gap-2">
          <UInput
            :model-value="track.iswc"
            placeholder="e.g. T-123.456.789-0"
            size="sm"
            class="flex-1"
            @update:model-value="$emit('update:iswc', $event)"
          />
          <UButton
            color="gray"
            variant="outline"
            size="sm"
            :loading="track.fetchingIswc"
            @click="$emit('search-musicbrainz')"
          >
            <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 mr-1" />
            MusicBrainz
          </UButton>
        </div>
        <p class="text-xs text-zinc-500 mt-1">
          Look up your ISWC at <a href="https://iswcnet.cisac.org" target="_blank" class="text-violet-400 hover:underline">iswcnet.cisac.org</a>
        </p>
      </div>

      <!-- Credits -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium" :class="showErrors && !hasComposerCredit ? 'text-red-400' : 'text-zinc-300'">
            Credits
            <span class="text-red-400">*</span>
            <span v-if="showErrors && !hasComposerCredit" class="text-red-400 font-normal ml-2">— Composer required</span>
          </label>
          <UButton
            color="gray"
            variant="ghost"
            size="xs"
            @click="$emit('toggle-credits')"
          >
            {{ track.showCredits ? 'Hide' : 'Show' }}
            <UIcon :name="track.showCredits ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4 ml-1" />
          </UButton>
        </div>

        <!-- Error hint when credits are hidden but missing -->
        <div v-if="showErrors && !hasComposerCredit && !track.showCredits" class="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
          Click "Show" to add a Composer credit
        </div>

        <div v-if="track.showCredits" class="space-y-2">
          <!-- Existing Credits -->
          <div
            v-for="(credit, creditIndex) in track.credits"
            :key="creditIndex"
            class="flex items-center gap-2 p-2 bg-zinc-900/50 rounded"
          >
            <USelect
              :model-value="credit.role"
              :options="creditRoles"
              size="xs"
              class="w-36"
              @update:model-value="$emit('update:credit-role', [creditIndex, $event])"
            />
            <UInput
              :model-value="credit.name"
              placeholder="Name"
              size="xs"
              class="flex-1"
              @update:model-value="$emit('update:credit-name', [creditIndex, $event])"
            />
            <UInput
              :model-value="credit.ipi_number"
              placeholder="IPI #"
              size="xs"
              class="w-28"
              @update:model-value="$emit('update:credit-ipi', [creditIndex, $event])"
            />
            <UButton
              color="gray"
              variant="ghost"
              size="xs"
              @click="$emit('remove-credit', creditIndex)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <UButton
              color="gray"
              variant="dashed"
              size="sm"
              class="flex-1"
              @click="$emit('add-credit')"
            >
              <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
              Add Credit
            </UButton>
            <UButton
              v-if="canCopyCredits"
              color="gray"
              variant="outline"
              size="sm"
              @click="$emit('copy-credits')"
            >
              <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4 mr-1" />
              Copy
            </UButton>
            <UButton
              v-if="hasCopiedCredits"
              color="violet"
              variant="outline"
              size="sm"
              @click="$emit('paste-credits')"
            >
              <UIcon name="i-heroicons-clipboard-document-check" class="w-4 h-4 mr-1" />
              Paste
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackUpload } from '~/composables/useUploadWizard'

const props = defineProps<{
  track: TrackUpload
  trackNumber: number
  isDragOver: boolean
  canCopyCredits: boolean
  hasCopiedCredits: boolean
  showErrors?: boolean
}>()

const emit = defineEmits<{
  'dragstart': [event: DragEvent]
  'dragend': []
  'dragover': []
  'dragleave': []
  'drop': []
  'remove': []
  'update:title': [value: string]
  'update:isrc': [value: string]
  'update:iswc': [value: string]
  'update:is_cover': [value: boolean]
  'toggle-credits': []
  'add-credit': []
  'remove-credit': [index: number]
  'update:credit-role': [payload: [index: number, value: string]]
  'update:credit-name': [payload: [index: number, value: string]]
  'update:credit-ipi': [payload: [index: number, value: string]]
  'copy-credits': []
  'paste-credits': []
  'open-deezer': []
  'search-musicbrainz': []
  'generate-isrc': []
  'release-isrc': []
}>()

const { formatFileSize, creditRoles } = useUploadWizard()

// Format duration in seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ISRC validation regex: 2 letters + 3 alphanumeric + 2 digits + 5 digits = 12 chars
const ISRC_REGEX = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/

// Validate ISRC format
const isValidIsrc = (isrc: string): boolean => {
  if (!isrc) return false
  return ISRC_REGEX.test(isrc.toUpperCase())
}

// Check if ISRC has valid format (for showing specific error)
const isrcFormatValid = computed(() => {
  if (!props.track.isrc) return true // Empty is handled separately
  return isValidIsrc(props.track.isrc)
})

// Handle ISRC input - auto uppercase and emit
const handleIsrcInput = (value: string) => {
  // Remove any spaces/dashes and uppercase
  const cleaned = value.replace(/[\s-]/g, '').toUpperCase()
  emit('update:isrc', cleaned)
}

// Check if track has a composer credit
const hasComposerCredit = computed(() => {
  return props.track.credits.some(c =>
    (c.role === 'composer' || c.role === 'composer_author') && c.name.trim()
  )
})

// Check if track has validation errors
const hasErrors = computed(() => {
  const hasIsrc = !!props.track.isrc
  const isrcValid = isValidIsrc(props.track.isrc || '')
  return !hasIsrc || !isrcValid || !hasComposerCredit.value
})
</script>
