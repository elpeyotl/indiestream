<template>
  <UModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <UCard class="bg-zinc-900 border-zinc-800">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-zinc-100">Fetch ISRC from Deezer</h3>
            <p class="text-sm text-zinc-400">Paste a Deezer track link or search by title</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <UFormGroup label="Deezer Track URL or Search">
          <UInput
            v-model="input"
            placeholder="https://www.deezer.com/track/... or search term"
            size="lg"
            @keyup.enter="fetchFromDeezer"
          />
        </UFormGroup>

        <!-- Search Results -->
        <div v-if="results.length > 0" class="space-y-2">
          <p class="text-sm text-zinc-400">Select a track:</p>
          <button
            v-for="result in results"
            :key="result.deezerTrackId"
            class="w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            @click="selectResult(result)"
          >
            <p class="font-medium text-zinc-100">{{ result.name }}</p>
            <p class="text-sm text-zinc-400">{{ result.artist }} · ISRC: {{ result.isrc || 'N/A' }}</p>
          </button>
        </div>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="$emit('update:modelValue', false)">
            Cancel
          </UButton>
          <UButton
            color="violet"
            :loading="loading"
            :disabled="!input"
            @click="fetchFromDeezer"
          >
            {{ input.includes('deezer.com') ? 'Fetch ISRC' : 'Search' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  initialQuery: string
  artistName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'isrc-found': [isrc: string]
}>()

const toast = useToast()

// State
const input = ref('')
const loading = ref(false)
const error = ref('')
const results = ref<Array<{
  deezerTrackId: string
  name: string
  artist: string
  isrc: string | null
}>>([])

// Watch for modal open to reset state
watch(() => props.modelValue, (open) => {
  if (open) {
    input.value = props.initialQuery || ''
    error.value = ''
    results.value = []
  }
})

const fetchFromDeezer = async () => {
  if (!input.value) return

  loading.value = true
  error.value = ''
  results.value = []

  try {
    // Check if it's a URL or a search query
    const isUrl = input.value.includes('deezer.com') || /^\d+$/.test(input.value.trim())

    if (isUrl) {
      // Direct URL fetch
      const result = await $fetch<{
        isrc: string | null
        name: string
        deezerTrackId: string
      }>('/api/deezer/fetch-track', {
        method: 'POST',
        body: { deezerUrl: input.value },
      })

      if (result.isrc) {
        emit('isrc-found', result.isrc)
        toast.add({ title: 'ISRC found', description: `ISRC: ${result.isrc}`, color: 'green' })
        emit('update:modelValue', false)
      } else {
        error.value = 'This track does not have an ISRC in Deezer'
      }
    } else {
      // Search by title
      const result = await $fetch<{
        results: Array<{
          deezerTrackId: string
          name: string
          artist: string
          isrc: string | null
        }>
      }>('/api/deezer/fetch-track', {
        method: 'POST',
        body: {
          searchQuery: input.value,
          artistName: props.artistName,
        },
      })

      if (result.results && result.results.length > 0) {
        results.value = result.results
      } else {
        error.value = 'No tracks found. Try a different search term.'
      }
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to fetch from Deezer'
  } finally {
    loading.value = false
  }
}

const selectResult = (result: { deezerTrackId: string; name: string; isrc: string | null }) => {
  if (result.isrc) {
    emit('isrc-found', result.isrc)
    toast.add({ title: 'ISRC found', description: `ISRC: ${result.isrc}`, color: 'green' })
    emit('update:modelValue', false)
  } else {
    error.value = 'This track does not have an ISRC'
  }
}
</script>
