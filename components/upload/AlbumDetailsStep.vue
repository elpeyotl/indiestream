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
            :color="form.release_type === type.value ? 'violet' : 'gray'"
            :variant="form.release_type === type.value ? 'solid' : 'outline'"
            @click="form.release_type = type.value"
          >
            {{ type.label }}
          </UButton>
        </div>
      </UFormGroup>

      <!-- Title -->
      <UFormGroup label="Title" required>
        <UInput
          v-model="form.title"
          placeholder="e.g. Midnight Dreams"
          size="lg"
        />
      </UFormGroup>

      <!-- Description -->
      <UFormGroup label="Description" hint="Optional">
        <UTextarea
          v-model="form.description"
          placeholder="Tell the story behind this release..."
          :rows="3"
          size="lg"
        />
      </UFormGroup>

      <!-- Release Date -->
      <UFormGroup label="Release Date" hint="Optional - leave blank for immediate release">
        <UInput
          v-model="form.release_date"
          type="date"
          size="lg"
        />
      </UFormGroup>

      <!-- Label Name -->
      <UFormGroup label="Label Name" hint="Optional - defaults to your artist name for independents">
        <UInput
          v-model="form.label_name"
          :placeholder="bandName || 'Self-released'"
          size="lg"
        />
      </UFormGroup>

      <!-- Cover Art -->
      <UFormGroup label="Cover Art" required>
        <div
          class="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-violet-500 transition-colors cursor-pointer"
          :class="{ 'border-violet-500 bg-violet-500/10': coverPreview }"
          @click="coverInput?.click()"
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
          :disabled="!form.title || !coverFile"
        >
          Continue to Tracks
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
        </UButton>
      </div>
    </form>
  </UCard>
</template>

<script setup lang="ts">
import type { AlbumForm } from '~/composables/useUploadWizard'

const props = defineProps<{
  form: AlbumForm
  bandName: string
}>()

const emit = defineEmits<{
  'update:form': [form: AlbumForm]
  continue: [coverFile: File]
}>()

const { releaseTypes } = useUploadWizard()

// Local form state that syncs with parent
const form = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value),
})

// Cover state
const coverInput = ref<HTMLInputElement>()
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const isDragging = ref(false)

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

const handleSubmit = () => {
  if (form.value.title && coverFile.value) {
    emit('continue', coverFile.value)
  }
}

// Expose for parent to reset
defineExpose({
  reset: () => {
    coverFile.value = null
    coverPreview.value = null
    if (coverInput.value) coverInput.value.value = ''
  },
})
</script>
