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
        <p class="text-sm text-zinc-400 mt-1 pl-3">
          <UIcon name="i-heroicons-document" class="w-3 h-3 inline mr-1" />
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

      <!-- Error indicator when validation fails -->
      <div v-else-if="showErrors && hasErrors" class="text-red-400">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
      </div>

      <!-- Remove -->
      <UButton
        v-if="!track.uploading && !track.uploaded"
        color="gray"
        variant="ghost"
        size="sm"
        @click="$emit('remove')"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Track Metadata (collapsed by default during upload) -->
    <div v-if="!track.uploading && !track.uploaded" class="space-y-4 pt-4 border-t border-zinc-700">
      <!-- ISRC Row -->
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1" :class="showErrors && !track.isrc ? 'text-red-400' : 'text-zinc-300'">
            ISRC Code <span class="text-red-400">*</span>
            <span v-if="showErrors && !track.isrc" class="text-red-400 font-normal ml-2">— Required</span>
          </label>
          <div class="flex gap-2">
            <UInput
              :model-value="track.isrc"
              placeholder="e.g. USRC12345678"
              size="sm"
              class="flex-1"
              maxlength="12"
              :color="showErrors && !track.isrc ? 'red' : undefined"
              @update:model-value="$emit('update:isrc', $event)"
            />
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
          <p class="text-xs text-zinc-500 mt-1">
            Don't have an ISRC? Get one from your distributor (DistroKid, TuneCore, CD Baby) or
            <a href="https://usisrc.org" target="_blank" class="text-violet-400 hover:underline">usisrc.org</a>
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

defineEmits<{
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
}>()

const { formatFileSize, creditRoles } = useUploadWizard()

// Check if track has a composer credit
const hasComposerCredit = computed(() => {
  return props.track.credits.some(c =>
    (c.role === 'composer' || c.role === 'composer_author') && c.name.trim()
  )
})

// Check if track has validation errors
const hasErrors = computed(() => {
  return !props.track.isrc || !hasComposerCredit.value
})
</script>
