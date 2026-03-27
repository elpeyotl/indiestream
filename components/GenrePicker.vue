<script setup lang="ts">
const props = defineProps<{
  modelValue: string[]
  bandId?: string
  disabled?: boolean
  label?: string
  hint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [ids: string[]]
}>()

const toast = useToast()

const genreInput = ref('')
const allGenres = ref<Array<{ id: string; name: string; slug: string }>>([])
const suggestions = ref<Array<{ id: string; name: string; slug: string }>>([])
const showSuggestGenre = ref(false)
const suggestGenreName = ref('')
const suggestingGenre = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<{ genres: Array<{ id: string; name: string; slug: string }> }>('/api/genres/list')
    allGenres.value = data.genres
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
})

const searchGenres = () => {
  const query = genreInput.value.toLowerCase().trim()
  if (!query) {
    suggestions.value = []
    return
  }
  suggestions.value = allGenres.value
    .filter(g =>
      g.name.toLowerCase().includes(query) &&
      !props.modelValue.includes(g.id)
    )
    .slice(0, 8)
}

const selectGenre = (genre: { id: string; name: string }) => {
  if (props.modelValue.length < 5 && !props.modelValue.includes(genre.id)) {
    emit('update:modelValue', [...props.modelValue, genre.id])
  }
  genreInput.value = ''
  suggestions.value = []
}

const selectFirstSuggestion = () => {
  if (suggestions.value.length > 0) {
    selectGenre(suggestions.value[0])
  }
}

const removeGenre = (index: number) => {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

const getGenreName = (genreId: string): string => {
  return allGenres.value.find(g => g.id === genreId)?.name || ''
}

const submitGenreSuggestion = async () => {
  const name = suggestGenreName.value.trim()
  if (!name) return

  suggestingGenre.value = true
  try {
    await $fetch('/api/genres/suggest', {
      method: 'POST',
      body: { name, bandId: props.bandId || null },
    })
    toast.add({ title: 'Genre suggested', description: 'We\'ll review your suggestion shortly.', color: 'green', icon: 'i-heroicons-check-circle' })
    suggestGenreName.value = ''
    showSuggestGenre.value = false
  } catch (e: any) {
    toast.add({ title: 'Suggestion failed', description: e.data?.message || 'Failed to submit suggestion', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    suggestingGenre.value = false
  }
}
</script>

<template>
  <UFormGroup :label="label || 'Genres'" :hint="hint">
    <div class="relative">
      <UInput
        v-model="genreInput"
        placeholder="Search genres..."
        size="lg"
        :disabled="disabled || modelValue.length >= 5"
        @input="searchGenres"
        @keydown.enter.prevent="selectFirstSuggestion"
        @keydown.escape="suggestions = []"
      />
      <div
        v-if="suggestions.length > 0"
        class="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
      >
        <button
          v-for="suggestion in suggestions"
          :key="suggestion.id"
          type="button"
          class="w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
          @click="selectGenre(suggestion)"
        >
          {{ suggestion.name }}
        </button>
      </div>
    </div>
    <div v-if="modelValue.length" class="flex flex-wrap gap-2 mt-2">
      <UBadge
        v-for="(genreId, index) in modelValue"
        :key="genreId"
        color="violet"
        variant="soft"
        class="cursor-pointer"
        @click="removeGenre(index)"
      >
        {{ getGenreName(genreId) }}
        <UIcon name="i-heroicons-x-mark" class="w-3 h-3 ml-1" />
      </UBadge>
    </div>
    <div class="flex items-center justify-between mt-2">
      <p class="text-xs text-zinc-500">Up to 5 genres.</p>
      <button
        type="button"
        class="text-xs text-violet-400 hover:text-violet-300"
        @click="showSuggestGenre = !showSuggestGenre"
      >
        Don't see your genre? Suggest one
      </button>
    </div>
    <div v-if="showSuggestGenre" class="mt-2 flex gap-2">
      <UInput
        v-model="suggestGenreName"
        placeholder="Genre name..."
        size="sm"
        class="flex-1"
      />
      <UButton
        color="violet"
        variant="soft"
        size="sm"
        :loading="suggestingGenre"
        :disabled="!suggestGenreName.trim()"
        @click="submitGenreSuggestion"
      >
        Suggest
      </UButton>
    </div>
  </UFormGroup>
</template>
