<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">3</div>
          <h2 class="text-lg font-semibold text-zinc-100">Review & Confirm</h2>
        </div>
        <UButton color="gray" variant="ghost" size="sm" @click="$emit('back')">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
          Back
        </UButton>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Validation Status -->
      <div v-if="validating" class="flex items-center justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-violet-400 animate-spin mr-3" />
        <span class="text-zinc-300">Validating with server...</span>
      </div>

      <template v-else-if="state.serverValidation">
        <!-- Duplicate Artists -->
        <div v-if="state.serverValidation.duplicateArtists.length > 0" class="space-y-4">
          <div class="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-orange-400">
                  {{ state.serverValidation.duplicateArtists.length }} artist(s) already exist
                </p>
                <p class="text-sm text-orange-300 mt-1">
                  Choose what to do with each duplicate:
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="duplicate in state.serverValidation.duplicateArtists"
              :key="duplicate.csvSlug"
              class="p-4 bg-zinc-800/50 rounded-lg"
            >
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="font-medium text-zinc-100">{{ duplicate.csvName }}</p>
                  <p class="text-sm text-zinc-500">
                    Matches existing: <span class="text-zinc-300">{{ duplicate.existingName }}</span>
                  </p>
                </div>
              </div>
              <UButtonGroup size="sm" orientation="horizontal">
                <UButton
                  :color="duplicate.action === 'use_existing' ? 'violet' : 'gray'"
                  :variant="duplicate.action === 'use_existing' ? 'solid' : 'outline'"
                  @click="setDuplicateArtistAction(duplicate.csvSlug, 'use_existing')"
                >
                  Add to existing
                </UButton>
                <UButton
                  :color="duplicate.action === 'create' ? 'violet' : 'gray'"
                  :variant="duplicate.action === 'create' ? 'solid' : 'outline'"
                  @click="setDuplicateArtistAction(duplicate.csvSlug, 'create')"
                >
                  Create new
                </UButton>
                <UButton
                  :color="duplicate.action === 'skip' ? 'violet' : 'gray'"
                  :variant="duplicate.action === 'skip' ? 'solid' : 'outline'"
                  @click="setDuplicateArtistAction(duplicate.csvSlug, 'skip')"
                >
                  Skip
                </UButton>
              </UButtonGroup>
            </div>
          </div>
        </div>

        <!-- Existing ISRCs Warning -->
        <div v-if="state.serverValidation.existingIsrcs.length > 0" class="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-orange-400">
                {{ state.serverValidation.existingIsrcs.length }} ISRC code(s) already in use
              </p>
              <p class="text-sm text-orange-300 mt-1">
                These tracks will be skipped or may cause duplicates:
              </p>
              <ul class="mt-2 text-sm text-orange-300 font-mono">
                <li v-for="isrc in state.serverValidation.existingIsrcs.slice(0, 5)" :key="isrc">
                  {{ isrc }}
                </li>
                <li v-if="state.serverValidation.existingIsrcs.length > 5" class="text-orange-400">
                  ... and {{ state.serverValidation.existingIsrcs.length - 5 }} more
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Server Errors -->
        <div v-if="state.serverValidation.errors.length > 0" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-red-400">
                {{ state.serverValidation.errors.length }} validation error(s)
              </p>
              <ul class="mt-2 text-sm text-red-300 space-y-1">
                <li v-for="error in state.serverValidation.errors" :key="`${error.row}-${error.field}`">
                  {{ error.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- All Good -->
        <div
          v-if="state.serverValidation.valid && state.serverValidation.duplicateArtists.every(d => d.action !== undefined)"
          class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-400" />
            <div>
              <p class="font-medium text-green-400">Ready to import!</p>
              <p class="text-sm text-green-300">All validations passed. Click "Start Import" to begin.</p>
            </div>
          </div>
        </div>
      </template>

      <!-- Import Summary -->
      <div class="p-4 bg-zinc-800/50 rounded-lg">
        <h3 class="font-medium text-zinc-100 mb-3">Import Summary</h3>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-violet-400">{{ effectiveSummary.artists }}</p>
            <p class="text-sm text-zinc-400">Artist(s)</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-teal-400">{{ effectiveSummary.albums }}</p>
            <p class="text-sm text-zinc-400">Album(s)</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-fuchsia-400">{{ effectiveSummary.tracks }}</p>
            <p class="text-sm text-zinc-400">Track(s)</p>
          </div>
        </div>
      </div>

      <!-- Rights Confirmation -->
      <div class="p-4 bg-zinc-800/50 rounded-lg space-y-3">
        <h3 class="font-medium text-zinc-100">Rights Confirmation</h3>
        <UCheckbox v-model="rightsConfirmed">
          <template #label>
            <span class="text-zinc-300">
              I confirm that I own or control all rights to distribute this music
            </span>
          </template>
        </UCheckbox>
        <UCheckbox v-model="aiDeclaration">
          <template #label>
            <span class="text-zinc-300">
              This music was created by the credited artists and is not AI-generated
            </span>
          </template>
        </UCheckbox>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <UButton color="gray" variant="ghost" @click="revalidate" :loading="validating">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Re-validate
        </UButton>
        <UButton
          color="violet"
          :disabled="!canStartImport"
          :loading="validating"
          @click="$emit('next')"
        >
          <UIcon name="i-heroicons-rocket-launch" class="w-4 h-4 mr-2" />
          Start Import
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

const { state, summary, validateWithServer, setDuplicateArtistAction } = useBulkUpload()

const validating = ref(false)
const rightsConfirmed = ref(false)
const aiDeclaration = ref(false)

// Calculate effective summary (excluding skipped artists)
const effectiveSummary = computed(() => {
  if (!state.value.parseResult) {
    return { artists: 0, albums: 0, tracks: 0 }
  }

  const skippedSlugs = new Set(
    state.value.serverValidation?.duplicateArtists
      .filter((d) => d.action === 'skip')
      .map((d) => d.csvSlug) || []
  )

  const activeArtists = state.value.parseResult.artists.filter(
    (a) => !skippedSlugs.has(a.slug)
  )

  return {
    artists: activeArtists.length,
    albums: activeArtists.reduce((sum, a) => sum + a.albums.length, 0),
    tracks: activeArtists.reduce(
      (sum, a) => sum + a.albums.reduce((s, al) => s + al.tracks.length, 0),
      0
    ),
  }
})

const canStartImport = computed(() => {
  if (!state.value.serverValidation) return false
  if (!rightsConfirmed.value || !aiDeclaration.value) return false
  if (state.value.serverValidation.errors.length > 0) return false

  // All duplicates must have an action selected
  const allDuplicatesHandled = state.value.serverValidation.duplicateArtists.every(
    (d) => d.action !== undefined
  )

  return allDuplicatesHandled && effectiveSummary.value.tracks > 0
})

const revalidate = async () => {
  validating.value = true
  await validateWithServer()
  validating.value = false
}

// Validate on mount
onMounted(async () => {
  if (!state.value.serverValidation) {
    validating.value = true
    await validateWithServer()
    validating.value = false
  }
})
</script>
