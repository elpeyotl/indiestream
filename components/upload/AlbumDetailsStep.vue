<template>
  <UCard class="bg-zinc-900/50 border-zinc-800 mb-6">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">1</div>
        <h2 class="text-lg font-semibold text-zinc-100">Release Details</h2>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Release Type -->
      <UFormGroup label="Release Type" required>
        <div class="flex gap-3">
          <UButton
            v-for="type in releaseTypes"
            :key="type.value"
            :color="state.albumForm.release_type === type.value ? 'violet' : 'gray'"
            :variant="state.albumForm.release_type === type.value ? 'solid' : 'outline'"
            @click="state.albumForm.release_type = type.value as 'album' | 'ep' | 'single'"
          >
            {{ type.label }}
          </UButton>
        </div>
      </UFormGroup>

      <!-- Title -->
      <UFormGroup label="Title" required :error="errors.title">
        <UInput
          v-model="state.albumForm.title"
          placeholder="e.g. Midnight Dreams"
          size="lg"
          :color="errors.title ? 'red' : undefined"
          @input="clearError('title')"
        />
      </UFormGroup>

      <!-- Description -->
      <UFormGroup label="Description" hint="Optional">
        <UTextarea
          v-model="state.albumForm.description"
          placeholder="Tell the story behind this release..."
          :rows="3"
          size="lg"
        />
      </UFormGroup>

      <!-- Release Date -->
      <UFormGroup label="Release Date" hint="Optional - leave blank for immediate release">
        <UInput
          v-model="state.albumForm.release_date"
          type="date"
          size="lg"
        />
      </UFormGroup>

      <!-- Label Name -->
      <UFormGroup label="Label Name" hint="Optional - defaults to your artist name for independents">
        <UInput
          v-model="state.albumForm.label_name"
          :placeholder="bandName || 'Self-released'"
          size="lg"
        />
      </UFormGroup>

      <!-- Cover Art -->
      <UFormGroup label="Cover Art" :required="!state.isEditMode" :error="errors.cover">
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer"
          :class="{
            'border-violet-500 bg-violet-500/10': state.coverPreview,
            'border-red-500 bg-red-500/10': errors.cover && !state.coverPreview,
            'border-zinc-700': !state.coverPreview && !errors.cover
          }"
          @click="coverInput?.click(); clearError('cover')"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onCoverDrop"
        >
          <input
            ref="coverInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onCoverSelect"
          />

          <div v-if="state.coverPreview" class="space-y-4">
            <img :src="state.coverPreview" alt="Cover preview" class="w-40 h-40 mx-auto rounded-lg object-cover" />
            <p v-if="state.coverFile" class="text-sm text-zinc-400">{{ state.coverFile.name }}</p>
            <p v-else-if="state.isEditMode" class="text-sm text-zinc-400">Current cover (click to change)</p>
            <UButton v-if="state.coverFile" color="gray" variant="ghost" size="sm" @click.stop="clearCover">
              Remove
            </UButton>
          </div>

          <div v-else class="space-y-3">
            <UIcon name="i-heroicons-photo" class="w-12 h-12 mx-auto" :class="errors.cover ? 'text-red-500' : 'text-zinc-500'" />
            <p :class="errors.cover ? 'text-red-400' : 'text-zinc-300'">Drop your cover art here or click to browse</p>
            <p class="text-sm text-zinc-500">JPEG, PNG or WebP. Recommended: 3000x3000px</p>
          </div>
        </div>
      </UFormGroup>

      <!-- Validation Summary -->
      <div v-if="showValidationSummary" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-red-400">Please fix the following errors:</p>
            <ul class="mt-2 text-sm text-red-300 list-disc list-inside space-y-1">
              <li v-if="errors.title">{{ errors.title }}</li>
              <li v-if="errors.cover">{{ errors.cover }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <UButton
          type="submit"
          color="violet"
          size="lg"
        >
          Continue to Tracks
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
        </UButton>
      </div>
    </form>
  </UCard>
</template>

<script setup lang="ts">
const props = defineProps<{
  bandName: string
}>()

const emit = defineEmits<{
  continue: []
}>()

const { state, releaseTypes, setCoverFile, clearCoverFile } = useUploadWizard()

// Cover input ref
const coverInput = ref<HTMLInputElement>()
const isDragging = ref(false)

// Validation errors
const errors = reactive({
  title: '',
  cover: '',
})
const showValidationSummary = ref(false)

const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
  // Hide summary if no errors remain
  if (!errors.title && !errors.cover) {
    showValidationSummary.value = false
  }
}

const validate = (): boolean => {
  let isValid = true

  // Reset errors
  errors.title = ''
  errors.cover = ''

  // Validate title
  if (!state.value.albumForm.title.trim()) {
    errors.title = 'Title is required'
    isValid = false
  }

  // Validate cover (required for new uploads, optional for edits if existing cover)
  if (!state.value.coverFile && !state.value.coverPreview) {
    errors.cover = 'Cover art is required'
    isValid = false
  }

  showValidationSummary.value = !isValid
  return isValid
}

const onCoverSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    setCoverFile(file)
    clearError('cover')
  }
}

const onCoverDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    setCoverFile(file)
    clearError('cover')
  }
}

const clearCover = () => {
  clearCoverFile()
  if (coverInput.value) coverInput.value.value = ''
}

const handleSubmit = () => {
  if (!validate()) {
    // Scroll to first error
    const firstError = document.querySelector('.text-red-400, .border-red-500')
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  state.value.step = 2
  // Scroll to top for better UX when moving to next step
  window.scrollTo({ top: 0, behavior: 'smooth' })
  emit('continue')
}
</script>
