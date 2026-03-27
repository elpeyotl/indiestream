<template>
  <div class="py-6 space-y-6">
    <!-- Pending Genre Suggestions -->
    <div v-if="pendingSuggestions.length > 0">
      <div class="flex items-center gap-2 mb-3">
        <h2 class="text-lg font-semibold text-zinc-100">Pending Suggestions</h2>
        <UBadge color="yellow" variant="soft">{{ pendingSuggestions.length }}</UBadge>
      </div>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="space-y-3">
          <div
            v-for="suggestion in pendingSuggestions"
            :key="suggestion.id"
            class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
          >
            <div class="min-w-0">
              <p class="font-medium text-zinc-100">"{{ suggestion.suggested_name }}"</p>
              <p class="text-xs text-zinc-500">
                Suggested by {{ suggestion.suggested_by_profile?.display_name || suggestion.suggested_by_profile?.email || 'Unknown' }}
                · {{ new Date(suggestion.created_at).toLocaleDateString() }}
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <UButton
                color="green"
                variant="soft"
                size="xs"
                :loading="reviewingId === suggestion.id"
                @click="reviewSuggestion(suggestion.id, 'approve')"
              >
                Approve
              </UButton>
              <UButton
                color="red"
                variant="soft"
                size="xs"
                :loading="reviewingId === suggestion.id"
                @click="reviewSuggestion(suggestion.id, 'reject')"
              >
                Reject
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Featured Genres Section -->
    <div>
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

    <!-- All Genres Management -->
    <div>
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold text-zinc-100">All Genres</h2>
          <p class="text-sm text-zinc-400">{{ allGenres.length }} genres in the system. Add, deactivate, or merge genres.</p>
        </div>
        <UButton color="gray" variant="soft" @click="showAddNewGenreModal = true">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          Add New Genre
        </UButton>
      </div>
    </div>

    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div class="mb-4">
        <UInput
          v-model="genreSearch"
          placeholder="Filter genres..."
          size="sm"
          icon="i-heroicons-magnifying-glass"
        />
      </div>
      <div class="max-h-96 overflow-y-auto space-y-1">
        <div
          v-for="genre in filteredGenres"
          :key="genre.id"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50"
          :class="{ 'opacity-50': !genre.is_active }"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UBadge v-if="genre.is_featured" color="violet" variant="soft" size="xs">Featured</UBadge>
            <UBadge v-if="!genre.is_active" color="red" variant="soft" size="xs">Inactive</UBadge>
            <span class="text-sm text-zinc-200">{{ genre.name }}</span>
            <span class="text-xs text-zinc-500">{{ genre.artistCount }} artists</span>
          </div>
          <div class="flex gap-1 shrink-0">
            <UButton
              v-if="genre.is_active && !genre.is_featured"
              color="violet"
              variant="ghost"
              size="xs"
              title="Feature"
              @click="toggleFeatured(genre, true)"
            >
              <UIcon name="i-heroicons-star" class="w-3.5 h-3.5" />
            </UButton>
            <UButton
              v-if="genre.is_featured"
              color="yellow"
              variant="ghost"
              size="xs"
              title="Unfeature"
              @click="toggleFeatured(genre, false)"
            >
              <UIcon name="i-heroicons-star-solid" class="w-3.5 h-3.5" />
            </UButton>
            <UButton
              v-if="genre.is_active"
              color="red"
              variant="ghost"
              size="xs"
              title="Deactivate"
              @click="deactivateGenre(genre)"
            >
              <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Add Featured Genre Modal -->
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

    <!-- Add New Genre Modal -->
    <UModal v-model="showAddNewGenreModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Add New Genre</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showAddNewGenreModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Genre Name">
            <UInput
              v-model="newGenreName"
              placeholder="e.g. Shoegaze"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="showAddNewGenreModal = false">
              Cancel
            </UButton>
            <UButton
              color="violet"
              :disabled="!newGenreName.trim()"
              :loading="addingNewGenre"
              @click="addNewGenre"
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

interface AdminGenre {
  id: string
  name: string
  slug: string
  is_active: boolean
  is_featured: boolean
  artistCount: number
}

interface GenreSuggestion {
  id: string
  suggested_name: string
  suggested_by: string
  suggested_by_profile?: { display_name: string | null; email: string | null }
  band_id: string | null
  status: string
  created_at: string
}

const toast = useToast()

// State
const featuredGenres = ref<FeaturedGenre[]>([])
const availableGenres = ref<AvailableGenre[]>([])
const allGenres = ref<AdminGenre[]>([])
const pendingSuggestions = ref<GenreSuggestion[]>([])
const loading = ref(true)
const adding = ref(false)
const deletingId = ref<string | null>(null)
const showAddModal = ref(false)
const selectedGenreSlug = ref('')
const genreSearch = ref('')
const reviewingId = ref<string | null>(null)
const showAddNewGenreModal = ref(false)
const newGenreName = ref('')
const addingNewGenre = ref(false)

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Filtered genres for search
const filteredGenres = computed(() => {
  const query = genreSearch.value.toLowerCase().trim()
  if (!query) return allGenres.value
  return allGenres.value.filter(g =>
    g.name.toLowerCase().includes(query) || g.slug.includes(query)
  )
})

// Load featured genres
const loadFeaturedGenres = async () => {
  loading.value = true
  try {
    const { featuredGenres: data } = await $fetch<{ featuredGenres: FeaturedGenre[] }>('/api/admin/featured-genres')
    featuredGenres.value = data || []
  } catch (e) {
    console.error('Failed to load featured genres:', e)
    toast.add({ title: 'Error', description: 'Failed to load featured genres', color: 'red' })
  } finally {
    loading.value = false
  }
}

// Load all genres for admin management
const loadAllGenres = async () => {
  try {
    const { genres } = await $fetch<{ genres: AdminGenre[] }>('/api/admin/genres')
    allGenres.value = genres || []
  } catch (e) {
    console.error('Failed to load all genres:', e)
  }
}

// Load pending suggestions
const loadPendingSuggestions = async () => {
  try {
    const { suggestions } = await $fetch<{ suggestions: GenreSuggestion[] }>('/api/admin/genre-suggestions')
    pendingSuggestions.value = suggestions || []
  } catch (e) {
    console.error('Failed to load suggestions:', e)
  }
}

// Load all genres for the add featured modal
const loadAvailableGenres = async () => {
  try {
    const { genres } = await $fetch<{ genres: Array<{ name: string; slug: string; artistCount: number }> }>('/api/genres')
    const featuredSlugs = new Set(featuredGenres.value.map((g) => g.genre_slug))
    availableGenres.value = (genres || [])
      .filter((g) => !featuredSlugs.has(g.slug))
      .map((g) => ({ name: g.name, slug: g.slug, artistCount: g.artistCount }))
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}

// Open add featured modal
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
      body: { genre_slug: genre.slug, genre_name: genre.name },
    })

    toast.add({ title: 'Success', description: `${genre.name} added to featured genres`, color: 'green' })
    showAddModal.value = false
    await Promise.all([loadFeaturedGenres(), loadAllGenres()])
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.data?.message || 'Failed to add genre', color: 'red' })
  } finally {
    adding.value = false
  }
}

// Remove genre from featured
const removeGenre = async (genre: FeaturedGenre) => {
  deletingId.value = genre.id
  try {
    await $fetch(`/api/admin/featured-genres/${genre.id}`, { method: 'DELETE' })
    toast.add({ title: 'Removed', description: `${genre.genre_name} removed from featured genres`, color: 'green' })
    await Promise.all([loadFeaturedGenres(), loadAllGenres()])
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to remove genre', color: 'red' })
  } finally {
    deletingId.value = null
  }
}

// Toggle featured status
const toggleFeatured = async (genre: AdminGenre, featured: boolean) => {
  try {
    if (featured) {
      await $fetch('/api/admin/featured-genres', {
        method: 'POST',
        body: { genre_slug: genre.slug, genre_name: genre.name },
      })
    } else {
      await $fetch(`/api/admin/featured-genres/${genre.id}`, { method: 'DELETE' })
    }
    toast.add({ title: 'Updated', description: `${genre.name} ${featured ? 'featured' : 'unfeatured'}`, color: 'green' })
    await Promise.all([loadFeaturedGenres(), loadAllGenres()])
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.data?.message || 'Failed to update genre', color: 'red' })
  }
}

// Deactivate a genre
const deactivateGenre = async (genre: AdminGenre) => {
  try {
    await $fetch(`/api/admin/genres/${genre.id}`, { method: 'DELETE' })
    toast.add({ title: 'Deactivated', description: `${genre.name} deactivated`, color: 'green' })
    await loadAllGenres()
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to deactivate genre', color: 'red' })
  }
}

// Add a new genre to the master list
const addNewGenre = async () => {
  if (!newGenreName.value.trim()) return
  addingNewGenre.value = true
  try {
    await $fetch('/api/admin/genres', {
      method: 'POST',
      body: { name: newGenreName.value.trim() },
    })
    toast.add({ title: 'Added', description: `${newGenreName.value} added to genre list`, color: 'green' })
    newGenreName.value = ''
    showAddNewGenreModal.value = false
    await loadAllGenres()
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.data?.message || 'Failed to add genre', color: 'red' })
  } finally {
    addingNewGenre.value = false
  }
}

// Review a suggestion
const reviewSuggestion = async (id: string, action: 'approve' | 'reject') => {
  reviewingId.value = id
  try {
    await $fetch(`/api/admin/genre-suggestions/${id}`, {
      method: 'PATCH',
      body: { action },
    })
    toast.add({
      title: action === 'approve' ? 'Approved' : 'Rejected',
      description: `Genre suggestion ${action === 'approve' ? 'approved and added' : 'rejected'}`,
      color: action === 'approve' ? 'green' : 'red',
    })
    await Promise.all([loadPendingSuggestions(), loadAllGenres()])
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.data?.message || `Failed to ${action} suggestion`, color: 'red' })
  } finally {
    reviewingId.value = null
  }
}

// Drag handlers
const onDragStart = (e: DragEvent, index: number) => {
  draggedIndex.value = index
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
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

  const items = [...featuredGenres.value]
  const [removed] = items.splice(draggedIndex.value, 1)
  items.splice(targetIndex, 0, removed)
  featuredGenres.value = items

  draggedIndex.value = null
  dragOverIndex.value = null

  try {
    await $fetch('/api/admin/featured-genres/reorder', {
      method: 'PATCH',
      body: { orderedIds: items.map((g) => g.id) },
    })
    toast.add({ title: 'Reordered', description: 'Genre order updated', color: 'green' })
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to save new order', color: 'red' })
    await loadFeaturedGenres()
  }
}

// Initial load
onMounted(() => {
  Promise.all([loadFeaturedGenres(), loadAllGenres(), loadPendingSuggestions()])
})
</script>
