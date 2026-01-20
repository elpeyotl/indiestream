<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">4</div>
        <h2 class="text-lg font-semibold text-zinc-100">Processing Import</h2>
      </div>
    </template>

    <div class="space-y-6 py-8">
      <!-- Progress Animation -->
      <div class="flex justify-center">
        <div class="relative">
          <div class="w-24 h-24 rounded-full border-4 border-zinc-700" />
          <div
            class="absolute inset-0 w-24 h-24 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl font-bold text-violet-400">{{ state.processProgress }}%</span>
          </div>
        </div>
      </div>

      <!-- Status Message -->
      <div class="text-center">
        <p class="text-lg text-zinc-100">{{ state.processStatus || 'Starting import...' }}</p>
        <p class="text-sm text-zinc-500 mt-2">Please don't close this page</p>
      </div>

      <!-- Progress Bar -->
      <div class="max-w-md mx-auto">
        <div class="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
            :style="{ width: `${state.processProgress}%` }"
          />
        </div>
      </div>

      <!-- Processing Steps -->
      <div class="max-w-md mx-auto space-y-2">
        <div
          v-for="(step, index) in processingSteps"
          :key="step.name"
          class="flex items-center gap-3 p-2 rounded-lg"
          :class="{
            'bg-green-500/10': step.status === 'complete',
            'bg-violet-500/10': step.status === 'active',
            'opacity-50': step.status === 'pending'
          }"
        >
          <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
            <UIcon
              v-if="step.status === 'complete'"
              name="i-heroicons-check"
              class="w-4 h-4 text-green-400"
            />
            <UIcon
              v-else-if="step.status === 'active'"
              name="i-heroicons-arrow-path"
              class="w-4 h-4 text-violet-400 animate-spin"
            />
            <span v-else class="text-xs text-zinc-500">{{ index + 1 }}</span>
          </div>
          <span
            class="text-sm"
            :class="{
              'text-green-400': step.status === 'complete',
              'text-violet-400': step.status === 'active',
              'text-zinc-500': step.status === 'pending'
            }"
          >
            {{ step.name }}
          </span>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="state.error" class="max-w-md mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p class="font-medium text-red-400">Import failed</p>
            <p class="text-sm text-red-300 mt-1">{{ state.error }}</p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  complete: []
}>()

const { state, processUpload } = useBulkUpload()

// Processing step status
const processingSteps = computed(() => {
  const progress = state.value.processProgress

  return [
    { name: 'Uploading files', status: progress >= 10 ? (progress >= 20 ? 'complete' : 'active') : 'pending' },
    { name: 'Creating artists', status: progress >= 30 ? (progress >= 50 ? 'complete' : 'active') : 'pending' },
    { name: 'Creating albums', status: progress >= 50 ? (progress >= 70 ? 'complete' : 'active') : 'pending' },
    { name: 'Processing tracks', status: progress >= 70 ? (progress >= 90 ? 'complete' : 'active') : 'pending' },
    { name: 'Finalizing', status: progress >= 90 ? (progress >= 100 ? 'complete' : 'active') : 'pending' },
  ]
})

// Start processing on mount
onMounted(async () => {
  if (!state.value.processing && !state.value.results) {
    const success = await processUpload()
    if (success || state.value.results) {
      // Wait a moment to show completion, then emit
      setTimeout(() => {
        emit('complete')
      }, 1500)
    }
  }
})
</script>
