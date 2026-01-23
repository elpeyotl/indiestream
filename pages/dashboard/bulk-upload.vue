<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-sm text-zinc-400 mb-2">
        <NuxtLink to="/dashboard" class="hover:text-violet-400 transition-colors">Dashboard</NuxtLink>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
        <span class="text-zinc-200">Bulk Upload</span>
      </div>
      <h1 class="text-3xl font-bold text-zinc-100">Bulk Upload</h1>
      <p class="text-zinc-400 mt-1">Import multiple artists and releases at once</p>
    </div>

    <!-- Progress Steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between max-w-2xl mx-auto">
        <template v-for="(step, index) in steps" :key="step.number">
          <!-- Step -->
          <div class="flex flex-col items-center">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              :class="{
                'bg-violet-500 text-white': state.step === step.number,
                'bg-green-500 text-white': state.step > step.number,
                'bg-zinc-700 text-zinc-400': state.step < step.number
              }"
            >
              <UIcon v-if="state.step > step.number" name="i-heroicons-check" class="w-5 h-5" />
              <span v-else>{{ step.number }}</span>
            </div>
            <span
              class="text-xs mt-2 hidden sm:block"
              :class="state.step >= step.number ? 'text-zinc-200' : 'text-zinc-500'"
            >
              {{ step.name }}
            </span>
          </div>

          <!-- Connector Line -->
          <div
            v-if="index < steps.length - 1"
            class="flex-1 h-0.5 mx-2"
            :class="state.step > step.number ? 'bg-green-500' : 'bg-zinc-700'"
          />
        </template>
      </div>
    </div>

    <!-- Step Content (client-only due to JSZip dependency) -->
    <ClientOnly>
      <div class="max-w-3xl mx-auto">
        <BulkUploadTemplateStep
          v-if="state.step === 1"
          @next="goToStep(2)"
        />

        <BulkUploadZipUploadStep
          v-else-if="state.step === 2"
          @back="goToStep(1)"
          @next="goToStep(3)"
        />

        <BulkUploadValidationStep
          v-else-if="state.step === 3"
          @back="goToStep(2)"
          @next="startProcessing"
        />

        <BulkUploadProcessingStep
          v-else-if="state.step === 4"
          @complete="goToStep(5)"
        />

        <BulkUploadResultsStep
          v-else-if="state.step === 5"
        />
      </div>

      <template #fallback>
        <div class="max-w-3xl mx-auto">
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          </UCard>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { state, steps, goToStep: _goToStep, resetBulkUpload } = useBulkUpload()

// Wrap goToStep to scroll to top
const goToStep = (step: number) => {
  _goToStep(step)
  // Scroll to top of page
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

const startProcessing = () => {
  goToStep(4)
}

// Reset state when leaving the page (optional - can be removed if you want to preserve state)
onUnmounted(() => {
  // Only reset if we completed the import
  if (state.value.step === 5 && state.value.results) {
    resetBulkUpload()
  }
})
</script>
