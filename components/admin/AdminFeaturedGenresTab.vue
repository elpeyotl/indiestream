<template>
  <div class="py-6 space-y-6">
    <!-- Header with Add Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-lg font-semibold text-zinc-100">Featured Genres</h2>
        <p class="text-sm text-zinc-400">Drag to reorder. Featured genres appear prominently on the /genres page.</p>
      </div>
      <UButton color="violet" @click="openAddModal">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Add Genre
      </UButton>
    </div>

    <!-- Featured Genres List -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <!-- Empty State -->
      <div v-else-if="featuredGenres.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No featured genres yet.</p>
        <p class="text-sm mt-1">Add some to highlight them on the genres page.</p>
      </div>

      <!-- Draggable List -->
      <div v-else class="space-y-2">
        <div
          v-for="(genre, index) in featuredGenres"
          :key="genre.id"
          draggable="true"
          class="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg cursor-grab hover:bg-zinc-800 transition-colors"
          :class="{
            'ring-2 ring-violet-500 bg-violet-500/10': dragOverIndex === index,
            'opacity-50': draggedIndex === index,
          }"
          @dragstart="onDragStart($event, index)"
          @dragend="onDragEnd"
          @dragover.prevent="onDragOver(index)"
          @dragleave="onDragLeave"
          @drop="onDrop(index)"
        >
          <!-- Drag Handle -->
          <div class="cursor-grab active:cursor-grabbing">
            <UIcon name="i-heroicons-bars-3" class="w-5 h-5 text-zinc-500" />
          </div>

          <!-- Position Badge -->
          <span class="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center font-medium">
            {{ index + 1 }}
          </span>

          <!-- Genre Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-zinc-100">{{ genre.genre_name }}</p>
            <p class="text-sm text-zinc-500">
              {{ genre.artistCount || 0 }} {{ genre.artistCount === 1 ? 'artist' : 'artists' }}
              <span class="text-zinc-600 ml-2">· {{ genre.genre_slug }}</span>
            </p>
          </div>

          <!-- Actions -->
          <UButton
            color="red"
            variant="ghost"
            size="xs"
            :loading="deletingId === genre.id"
            @click="removeGenre(genre)"
          >
            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Add Genre Modal -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Add Featured Genre</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showAddModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Select Genre" help="Choose from existing genres in the system">
            <USelectMenu
              v-model="selectedGenreSlug"
              :options="availableGenres"
              searchable
              searchable-placeholder="Search genres..."
              placeholder="Select a genre..."
              option-attribute="name"
              value-attribute="slug"
              :search-attributes="['name', 'slug']"
            >
              <template #option="{ option }">
                <div class="flex items-center justify-between w-full">
                  <span>{{ option.name }}</span>
                  <span class="text-xs text-zinc-500">{{ option.artistCount }} artists</span>
                </div>
              </template>
            </USelectMenu>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="showAddModal = false">
              Cancel
            </UButton>
            <UButton
              color="violet"
              :disabled="!selectedGenreSlug"
              :loading="adding"
              @click="addGenre"
            >
              Add Genre
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface FeaturedGenre {
  id: string
  genre_slug: string
  genre_name: string
  position: number
  artistCount?: number
}

interface AvailableGenre {
  name: string
  slug: string
  artistCount: number
}

const toast = useToast()

// State
const featuredGenres = ref<FeaturedGenre[]>([])
const availableGenres = ref<AvailableGenre[]>([])
const loading = ref(true)
const adding = ref(false)
const deletingId = ref<string | null>(null)
const showAddModal = ref(false)
const selectedGenreSlug = ref('')

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Load featured genres
const loadFeaturedGenres = async () => {
  loading.value = true
  try {
    const { featuredGenres: data } = await $fetch<{ featuredGenres: FeaturedGenre[] }>('/api/admin/featured-genres')
    featuredGenres.value = data || []
  } catch (e) {
    console.error('Failed to load featured genres:', e)
    toast.add({
      title: 'Error',
      description: 'Failed to load featured genres',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

// Load all genres for the add modal
const loadAvailableGenres = async () => {
  try {
    const { genres } = await $fetch<{ genres: Array<{ name: string; slug: string; artistCount: number }> }>('/api/genres')

    // Filter out already featured genres
    const featuredSlugs = new Set(featuredGenres.value.map((g) => g.genre_slug))
    availableGenres.value = (genres || [])
      .filter((g) => !featuredSlugs.has(g.slug))
      .map((g) => ({
        name: g.name,
        slug: g.slug,
        artistCount: g.artistCount,
      }))
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}

// Open add modal
const openAddModal = async () => {
  selectedGenreSlug.value = ''
  await loadAvailableGenres()
  showAddModal.value = true
}

// Add genre to featured
const addGenre = async () => {
  if (!selectedGenreSlug.value) return

  adding.value = true
  try {
    const genre = availableGenres.value.find((g) => g.slug === selectedGenreSlug.value)
    if (!genre) return

    await $fetch('/api/admin/featured-genres', {
      method: 'POST',
      body: {
        genre_slug: genre.slug,
        genre_name: genre.name,
      },
    })

    toast.add({
      title: 'Success',
      description: `${genre.name} added to featured genres`,
      color: 'green',
    })

    showAddModal.value = false
    await loadFeaturedGenres()
  } catch (e: any) {
    toast.add({
      title: 'Error',
      description: e.data?.message || 'Failed to add genre',
      color: 'red',
    })
  } finally {
    adding.value = false
  }
}

// Remove genre from featured
const removeGenre = async (genre: FeaturedGenre) => {
  deletingId.value = genre.id
  try {
    await $fetch(`/api/admin/featured-genres/${genre.id}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Removed',
      description: `${genre.genre_name} removed from featured genres`,
      color: 'green',
    })

    await loadFeaturedGenres()
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to remove genre',
      color: 'red',
    })
  } finally {
    deletingId.value = null
  }
}

// Drag handlers
const onDragStart = (e: DragEvent, index: number) => {
  draggedIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const onDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

const onDragOver = (index: number) => {
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = async (targetIndex: number) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    dragOverIndex.value = null
    return
  }

  // Reorder locally
  const items = [...featuredGenres.value]
  const [removed] = items.splice(draggedIndex.value, 1)
  items.splice(targetIndex, 0, removed)
  featuredGenres.value = items

  // Reset drag state
  draggedIndex.value = null
  dragOverIndex.value = null

  // Persist to server
  try {
    const orderedIds = items.map((g) => g.id)
    await $fetch('/api/admin/featured-genres/reorder', {
      method: 'PATCH',
      body: { orderedIds },
    })

    toast.add({
      title: 'Reordered',
      description: 'Genre order updated',
      color: 'green',
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to save new order',
      color: 'red',
    })
    // Reload to get correct order
    await loadFeaturedGenres()
  }
}

// Initial load
onMounted(() => {
  loadFeaturedGenres()
})
</script>
