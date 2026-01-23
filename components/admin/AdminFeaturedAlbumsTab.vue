<template>
  <div class="py-6 space-y-6">
    <!-- Header with Add Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-lg font-semibold text-zinc-100">Featured Albums</h2>
        <p class="text-sm text-zinc-400">Drag to reorder. Featured albums appear on the homepage.</p>
      </div>
      <UButton color="violet" @click="openAddModal">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Add Album
      </UButton>
    </div>

    <!-- Editorial Blurb -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-zinc-100">Editorial Blurb</h3>
            <p class="text-xs text-zinc-500">Shown below the "Featured Albums" heading on homepage</p>
          </div>
          <UButton
            v-if="blurbChanged"
            color="violet"
            size="xs"
            :loading="savingBlurb"
            @click="saveBlurb"
          >
            Save
          </UButton>
        </div>
        <UInput
          v-model="blurb"
          placeholder="Hand-picked by humans, not machines."
          :disabled="loadingBlurb"
        />
        <p class="text-xs text-zinc-500">
          Leave empty to use default: "Hand-picked by humans, not machines."
        </p>
      </div>
    </UCard>

    <!-- Featured Albums List -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <!-- Empty State -->
      <div v-else-if="featuredAlbums.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No featured albums yet.</p>
        <p class="text-sm mt-1">Add some to highlight them on the homepage.</p>
      </div>

      <!-- Draggable List -->
      <div v-else class="space-y-2">
        <div
          v-for="(fa, index) in featuredAlbums"
          :key="fa.id"
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

          <!-- Album Cover -->
          <div class="w-12 h-12 rounded bg-zinc-700 overflow-hidden flex-shrink-0">
            <img
              v-if="albumCovers[fa.album_id]"
              :src="albumCovers[fa.album_id]"
              :alt="fa.albums?.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-zinc-500" />
            </div>
          </div>

          <!-- Album Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-zinc-100 truncate">{{ fa.albums?.title }}</p>
            <p class="text-sm text-zinc-500 truncate">
              {{ fa.albums?.bands?.name }}
            </p>
          </div>

          <!-- Actions -->
          <UButton
            color="red"
            variant="ghost"
            size="xs"
            :loading="deletingId === fa.id"
            @click="removeAlbum(fa)"
          >
            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Add Album Modal -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Add Featured Album</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showAddModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Search Input -->
          <UFormGroup label="Search Albums" help="Search by album or artist name">
            <UInput
              v-model="searchQuery"
              placeholder="Search albums..."
              icon="i-heroicons-magnifying-glass"
              @input="debouncedSearch"
            />
          </UFormGroup>

          <!-- Search Results -->
          <div v-if="searching" class="flex justify-center py-4">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
          </div>

          <div v-else-if="searchResults.length > 0" class="max-h-64 overflow-y-auto space-y-2">
            <button
              v-for="album in searchResults"
              :key="album.id"
              class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-left"
              :class="selectedAlbumId === album.id ? 'bg-violet-500/20 ring-1 ring-violet-500' : ''"
              @click="selectedAlbumId = album.id"
            >
              <div class="w-10 h-10 rounded bg-zinc-700 overflow-hidden flex-shrink-0">
                <img
                  v-if="searchCovers[album.id]"
                  :src="searchCovers[album.id]"
                  :alt="album.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-500" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ album.title }}</p>
                <p class="text-sm text-zinc-500 truncate">{{ album.bands?.name }}</p>
              </div>
              <UIcon
                v-if="selectedAlbumId === album.id"
                name="i-heroicons-check-circle"
                class="w-5 h-5 text-violet-400 flex-shrink-0"
              />
            </button>
          </div>

          <p v-else-if="searchQuery.length >= 2" class="text-center text-zinc-500 py-4">
            No albums found
          </p>

          <p v-else class="text-center text-zinc-500 py-4">
            Type at least 2 characters to search
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="showAddModal = false">
              Cancel
            </UButton>
            <UButton
              color="violet"
              :disabled="!selectedAlbumId"
              :loading="adding"
              @click="addAlbum"
            >
              Add Album
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface FeaturedAlbum {
  id: string
  album_id: string
  position: number
  description?: string | null
  albums?: {
    id: string
    title: string
    slug: string
    cover_key?: string | null
    cover_url?: string | null
    bands?: {
      id: string
      name: string
      slug: string
    }
  }
}

interface SearchAlbum {
  id: string
  title: string
  slug: string
  cover_key?: string | null
  cover_url?: string | null
  bands?: {
    id: string
    name: string
    slug: string
  }
}

const toast = useToast()
const albumStore = useAlbumStore()

// State
const featuredAlbums = ref<FeaturedAlbum[]>([])
const albumCovers = ref<Record<string, string>>({})
const loading = ref(true)
const adding = ref(false)
const deletingId = ref<string | null>(null)
const showAddModal = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchAlbum[]>([])
const searchCovers = ref<Record<string, string>>({})
const searching = ref(false)
const selectedAlbumId = ref<string | null>(null)

// Blurb state
const blurb = ref('')
const originalBlurb = ref('')
const loadingBlurb = ref(true)
const savingBlurb = ref(false)
const blurbChanged = computed(() => blurb.value !== originalBlurb.value)

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Load featured albums
const loadFeaturedAlbums = async () => {
  loading.value = true
  try {
    const { featuredAlbums: data } = await $fetch<{ featuredAlbums: FeaturedAlbum[] }>('/api/admin/featured-albums')
    featuredAlbums.value = data || []

    // Load cover URLs
    for (const fa of featuredAlbums.value) {
      if (fa.albums?.cover_key) {
        const url = await albumStore.getCachedCoverUrl(fa.albums.cover_key)
        if (url) {
          albumCovers.value[fa.album_id] = url
        }
      } else if (fa.albums?.cover_url) {
        albumCovers.value[fa.album_id] = fa.albums.cover_url
      }
    }
  } catch (e) {
    console.error('Failed to load featured albums:', e)
    toast.add({
      title: 'Error',
      description: 'Failed to load featured albums',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

// Search albums
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(searchAlbums, 300)
}

const searchAlbums = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  searching.value = true
  try {
    // Get featured album IDs to exclude
    const featuredIds = new Set(featuredAlbums.value.map((fa) => fa.album_id))

    const { albums } = await $fetch<{ albums: SearchAlbum[] }>('/api/albums/search', {
      query: { q: searchQuery.value, limit: 20 },
    })

    // Filter out already featured albums
    searchResults.value = (albums || []).filter((a) => !featuredIds.has(a.id))

    // Load cover URLs for search results
    for (const album of searchResults.value) {
      if (album.cover_key && !searchCovers.value[album.id]) {
        const url = await albumStore.getCachedCoverUrl(album.cover_key)
        if (url) searchCovers.value[album.id] = url
      } else if (album.cover_url && !searchCovers.value[album.id]) {
        searchCovers.value[album.id] = album.cover_url
      }
    }
  } catch (e) {
    console.error('Failed to search albums:', e)
  } finally {
    searching.value = false
  }
}

// Open add modal
const openAddModal = () => {
  searchQuery.value = ''
  searchResults.value = []
  searchCovers.value = {}
  selectedAlbumId.value = null
  showAddModal.value = true
}

// Add album to featured
const addAlbum = async () => {
  if (!selectedAlbumId.value) return

  adding.value = true
  try {
    await $fetch('/api/admin/featured-albums', {
      method: 'POST',
      body: {
        albumId: selectedAlbumId.value,
      },
    })

    toast.add({
      title: 'Success',
      description: 'Album added to featured',
      color: 'green',
    })

    showAddModal.value = false
    await loadFeaturedAlbums()
  } catch (e: any) {
    toast.add({
      title: 'Error',
      description: e.data?.message || 'Failed to add album',
      color: 'red',
    })
  } finally {
    adding.value = false
  }
}

// Remove album from featured
const removeAlbum = async (fa: FeaturedAlbum) => {
  deletingId.value = fa.id
  try {
    await $fetch(`/api/admin/featured-albums/${fa.id}`, {
      method: 'DELETE',
    })

    toast.add({
      title: 'Removed',
      description: 'Album removed from featured',
      color: 'green',
    })

    await loadFeaturedAlbums()
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to remove album',
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
  const items = [...featuredAlbums.value]
  const [removed] = items.splice(draggedIndex.value, 1)
  items.splice(targetIndex, 0, removed)
  featuredAlbums.value = items

  // Reset drag state
  draggedIndex.value = null
  dragOverIndex.value = null

  // Persist to server
  try {
    const orderedIds = items.map((fa) => fa.id)
    await $fetch('/api/admin/featured-albums/reorder', {
      method: 'PATCH',
      body: { orderedIds },
    })

    toast.add({
      title: 'Reordered',
      description: 'Album order updated',
      color: 'green',
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to save new order',
      color: 'red',
    })
    // Reload to get correct order
    await loadFeaturedAlbums()
  }
}

// Load editorial blurb
const loadBlurb = async () => {
  loadingBlurb.value = true
  try {
    const settings = await $fetch<Record<string, { value: any }>>('/api/admin/settings')
    const value = settings?.featured_albums_blurb?.value || ''
    blurb.value = value
    originalBlurb.value = value
  } catch (e) {
    console.error('Failed to load blurb:', e)
  } finally {
    loadingBlurb.value = false
  }
}

// Save editorial blurb
const saveBlurb = async () => {
  savingBlurb.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      body: {
        key: 'featured_albums_blurb',
        value: blurb.value,
      },
    })
    originalBlurb.value = blurb.value
    toast.add({
      title: 'Saved',
      description: 'Editorial blurb updated',
      color: 'green',
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to save blurb',
      color: 'red',
    })
  } finally {
    savingBlurb.value = false
  }
}

// Initial load
onMounted(() => {
  loadFeaturedAlbums()
  loadBlurb()
})
</script>
