<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">3</div>
          <h2 class="text-lg font-semibold text-zinc-100">Upload Media Files</h2>
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
          'border-green-500 bg-green-500/10': state.zipFile && missingFiles.length === 0,
          'border-orange-500 bg-orange-500/10': state.zipFile && missingFiles.length > 0,
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

        <template v-if="state.zipFile">
          <UIcon
            :name="missingFiles.length > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-archive-box'"
            class="w-12 h-12 mx-auto mb-3"
            :class="missingFiles.length > 0 ? 'text-orange-400' : 'text-green-400'"
          />
          <p :class="missingFiles.length > 0 ? 'text-orange-400' : 'text-green-400'" class="font-medium">
            {{ state.zipFile.name }}
          </p>
          <p class="text-sm text-zinc-400 mt-1">
            {{ formatFileSize(state.zipFile.size) }} - {{ state.zipFileList.length }} files
          </p>
          <UButton color="gray" variant="ghost" size="sm" class="mt-3" @click.stop="clearZip">
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
            Remove
          </UButton>
        </template>
        <template v-else>
          <UIcon name="i-heroicons-archive-box-arrow-down" class="w-12 h-12 mx-auto mb-3 text-zinc-500" />
          <p class="text-zinc-300">Drop your ZIP file here or click to browse</p>
          <p class="text-sm text-zinc-500 mt-1">ZIP files up to 2GB</p>
        </template>
      </div>

      <!-- Missing Files Warning -->
      <div v-if="state.zipFile && missingFiles.length > 0" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium text-red-400">{{ missingFiles.length }} file(s) not found in ZIP</p>
            <p class="text-sm text-red-300 mt-1">These files are referenced in your CSV but missing from the ZIP:</p>
            <ul class="mt-2 text-sm text-red-300 font-mono space-y-1">
              <li v-for="file in missingFiles.slice(0, 10)" :key="file">{{ file }}</li>
              <li v-if="missingFiles.length > 10" class="text-red-400">
                ... and {{ missingFiles.length - 10 }} more missing files
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- File List Preview -->
      <div v-if="state.zipFile && state.zipFileList.length > 0">
        <h3 class="font-medium text-zinc-100 mb-3">Files in ZIP</h3>
        <div class="max-h-64 overflow-y-auto p-3 bg-zinc-800/50 rounded-lg">
          <ul class="text-sm font-mono space-y-1">
            <li
              v-for="file in state.zipFileList.slice(0, 50)"
              :key="file"
              class="flex items-center gap-2"
              :class="getFileStatus(file)"
            >
              <UIcon :name="getFileIcon(file)" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ file }}</span>
            </li>
            <li v-if="state.zipFileList.length > 50" class="text-zinc-500 pt-2">
              ... and {{ state.zipFileList.length - 50 }} more files
            </li>
          </ul>
        </div>
      </div>

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
          :disabled="!state.zipFile || missingFiles.length > 0"
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

const { state, setZipFile, clearZipFile, validateFileReferences, formatFileSize } = useBulkUpload()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

const missingFiles = computed(() => validateFileReferences())

// Get all expected file paths from CSV
const expectedFiles = computed(() => {
  if (!state.value.parseResult) return new Set<string>()

  const files = new Set<string>()
  for (const artist of state.value.parseResult.artists) {
    if (artist.avatarPath) files.add(artist.avatarPath.toLowerCase())
    for (const album of artist.albums) {
      if (album.coverPath) files.add(album.coverPath.toLowerCase())
      for (const track of album.tracks) {
        files.add(track.audioPath.toLowerCase())
      }
    }
  }
  return files
})

const getFileStatus = (file: string): string => {
  const lower = file.toLowerCase()
  if (expectedFiles.value.has(lower)) {
    return 'text-green-400'
  }
  return 'text-zinc-400'
}

const getFileIcon = (file: string): string => {
  const ext = file.split('.').pop()?.toLowerCase()
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext || '')) {
    return 'i-heroicons-musical-note'
  }
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return 'i-heroicons-photo'
  }
  return 'i-heroicons-document'
}

const onFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    setZipFile(file)
  }
}

const onFileDrop = (e: DragEvent) => {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
    setZipFile(file)
  }
}

const clearZip = () => {
  clearZipFile()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
