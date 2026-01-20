<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">2</div>
          <h2 class="text-lg font-semibold text-zinc-100">Upload Your Catalog</h2>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="$emit('back')">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
          Back
        </UButton>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Drop Zone -->
      <div
        class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
        :class="{
          'border-violet-500 bg-violet-500/10': isDragging,
          'border-green-500 bg-green-500/10': state.zipFile && !hasErrors,
          'border-red-500 bg-red-500/10': hasErrors,
          'border-zinc-700 hover:border-violet-500': !isDragging && !state.zipFile
        }"
        @click="fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onFileDrop"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".zip,application/zip"
          class="hidden"
          @change="onFileSelect"
        />

        <template v-if="isLoading">
          <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 mx-auto mb-3 text-violet-400 animate-spin" />
          <p class="text-violet-400 font-medium">Processing ZIP file...</p>
          <p class="text-sm text-zinc-400 mt-1">Reading catalog and validating files</p>
        </template>
        <template v-else-if="state.zipFile">
          <UIcon
            :name="hasErrors ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-archive-box-arrow-down'"
            class="w-12 h-12 mx-auto mb-3"
            :class="hasErrors ? 'text-red-400' : 'text-green-400'"
          />
          <p :class="hasErrors ? 'text-red-400' : 'text-green-400'" class="font-medium">
            {{ state.zipFile.name }}
          </p>
          <p class="text-sm text-zinc-400 mt-1">
            {{ formatFileSize(state.zipFile.size) }} - {{ state.zipFileList.length }} files
          </p>
          <UButton color="gray" variant="ghost" size="sm" class="mt-3" @click.stop="clearUpload">
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
            Remove
          </UButton>
        </template>
        <template v-else>
          <UIcon name="i-heroicons-archive-box-arrow-down" class="w-12 h-12 mx-auto mb-3 text-zinc-500" />
          <p class="text-zinc-300">Drop your ZIP file here or click to browse</p>
          <p class="text-sm text-zinc-500 mt-1">ZIP file containing catalog.csv and media files</p>
        </template>
      </div>

      <!-- No CSV Found Error -->
      <div v-if="state.error" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p class="font-medium text-red-400">{{ state.error }}</p>
            <p class="text-sm text-red-300 mt-1">
              Make sure your ZIP contains a <code class="text-red-200">catalog.csv</code> file at the root level.
            </p>
          </div>
        </div>
      </div>

      <!-- Parse Results -->
      <template v-if="state.parseResult && !state.error">
        <!-- Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 bg-zinc-800/50 rounded-lg text-center">
            <p class="text-2xl font-bold text-violet-400">{{ summary.artists }}</p>
            <p class="text-sm text-zinc-400">Artist(s)</p>
          </div>
          <div class="p-4 bg-zinc-800/50 rounded-lg text-center">
            <p class="text-2xl font-bold text-teal-400">{{ summary.albums }}</p>
            <p class="text-sm text-zinc-400">Album(s)</p>
          </div>
          <div class="p-4 bg-zinc-800/50 rounded-lg text-center">
            <p class="text-2xl font-bold text-fuchsia-400">{{ summary.tracks }}</p>
            <p class="text-sm text-zinc-400">Track(s)</p>
          </div>
        </div>

        <!-- CSV Errors -->
        <div v-if="state.parseResult.errors.length > 0" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="font-medium text-red-400">{{ state.parseResult.errors.length }} error(s) in CSV</p>
              <p class="text-sm text-red-300 mt-1">Fix these errors in your catalog.csv before continuing:</p>
              <ul class="mt-2 text-sm text-red-300 space-y-1">
                <li v-for="error in state.parseResult.errors.slice(0, 10)" :key="`${error.row}-${error.field}`">
                  Row {{ error.row }}, {{ error.field }}: {{ error.message }}
                </li>
                <li v-if="state.parseResult.errors.length > 10" class="text-red-400">
                  ... and {{ state.parseResult.errors.length - 10 }} more errors
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Missing Files -->
        <div v-if="missingFiles.length > 0" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="font-medium text-red-400">{{ missingFiles.length }} file(s) missing from ZIP</p>
              <p class="text-sm text-red-300 mt-1">These files are referenced in catalog.csv but not found:</p>
              <ul class="mt-2 text-sm text-red-300 font-mono space-y-1">
                <li v-for="file in missingFiles.slice(0, 10)" :key="file">{{ file }}</li>
                <li v-if="missingFiles.length > 10" class="text-red-400">
                  ... and {{ missingFiles.length - 10 }} more missing files
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="state.parseResult.warnings.length > 0" class="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="font-medium text-orange-400">{{ state.parseResult.warnings.length }} warning(s)</p>
              <ul class="mt-2 text-sm text-orange-300 space-y-1">
                <li v-for="warning in state.parseResult.warnings.slice(0, 5)" :key="`${warning.row}-${warning.field}`">
                  Row {{ warning.row }}, {{ warning.field }}: {{ warning.message }}
                </li>
                <li v-if="state.parseResult.warnings.length > 5" class="text-orange-400">
                  ... and {{ state.parseResult.warnings.length - 5 }} more warnings
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div v-if="!hasErrors">
          <h3 class="font-medium text-zinc-100 mb-3">Preview</h3>
          <div class="space-y-3">
            <div
              v-for="artist in state.parseResult.artists.slice(0, 3)"
              :key="artist.slug"
              class="p-3 bg-zinc-800/50 rounded-lg"
            >
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-violet-400" />
                <span class="font-medium text-zinc-100">{{ artist.name }}</span>
                <span class="text-sm text-zinc-500">{{ artist.albums.length }} album(s)</span>
              </div>
              <div class="ml-7 space-y-1">
                <div v-for="album in artist.albums.slice(0, 2)" :key="album.title" class="text-sm">
                  <span class="text-zinc-300">{{ album.title }}</span>
                  <span class="text-zinc-500"> - {{ album.tracks.length }} track(s)</span>
                </div>
                <div v-if="artist.albums.length > 2" class="text-sm text-zinc-500">
                  ... and {{ artist.albums.length - 2 }} more album(s)
                </div>
              </div>
            </div>
            <div v-if="state.parseResult.artists.length > 3" class="text-sm text-zinc-500 text-center">
              ... and {{ state.parseResult.artists.length - 3 }} more artist(s)
            </div>
          </div>
        </div>
      </template>

      <!-- Size Limit Info -->
      <div class="flex items-center gap-2 text-sm text-zinc-500">
        <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
        <span>Maximum ZIP file size: 2GB</span>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          color="violet"
          :disabled="!canProceed || isLoading"
          @click="$emit('next')"
        >
          Continue to Review
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-2" />
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
defineEmits<{
  back: []
  next: []
}>()

const { state, summary, setZipFileWithCsv, clearBulkUpload, validateFileReferences, formatFileSize } = useBulkUpload()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isLoading = ref(false)

const missingFiles = computed(() => validateFileReferences())

const hasErrors = computed(() => {
  return (
    state.value.error ||
    (state.value.parseResult && state.value.parseResult.errors.length > 0) ||
    missingFiles.value.length > 0
  )
})

const canProceed = computed(() => {
  return (
    state.value.zipFile &&
    state.value.parseResult &&
    state.value.parseResult.errors.length === 0 &&
    missingFiles.value.length === 0 &&
    !state.value.error
  )
})

const onFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await processZipFile(file)
  }
}

const onFileDrop = async (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
    await processZipFile(file)
  }
}

const processZipFile = async (file: File) => {
  isLoading.value = true
  try {
    await setZipFileWithCsv(file)
  } finally {
    isLoading.value = false
  }
}

const clearUpload = () => {
  clearBulkUpload()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
