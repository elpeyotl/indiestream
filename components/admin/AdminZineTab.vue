<template>
  <div class="py-6 space-y-8">
    <!-- Staff Picks Section -->
    <section>
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-lg font-semibold text-zinc-100">Staff Picks</h2>
          <p class="text-sm text-zinc-400">Featured albums with editorial descriptions for The Fairzine</p>
        </div>
        <UButton color="violet" @click="openAddModal('staff_pick')">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          Add Album
        </UButton>
      </div>

      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
        </div>

        <div v-else-if="staffPicks.length === 0" class="text-center py-8 text-zinc-400">
          <UIcon name="i-heroicons-musical-note" class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No staff picks yet.</p>
          <p class="text-sm mt-1">Add albums to feature on the Zine page.</p>
        </div>

        <div v-else class="space-y-3">
          <AdminZineAlbumCard
            v-for="(item, index) in staffPicks"
            :key="item.id"
            :item="item"
            :index="index"
            :cover-url="albumCovers[item.album_id]"
            :deleting="deletingId === item.id"
            :editing="editingId === item.id"
            :dragged="draggedIndex === index && dragCategory === 'staff_pick'"
            :drag-over="dragOverIndex === index && dragCategory === 'staff_pick'"
            @drag-start="onDragStart($event, index, 'staff_pick')"
            @drag-end="onDragEnd"
            @drag-over="() => onDragOver(index, 'staff_pick')"
            @drag-leave="onDragLeave"
            @drop="() => onDrop(index, 'staff_pick')"
            @edit="editDescription(item)"
            @delete="removeAlbum(item)"
          />
        </div>
      </UCard>
    </section>

    <!-- The Overlooked Section -->
    <section>
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-lg font-semibold text-zinc-100">The Overlooked</h2>
          <p class="text-sm text-zinc-400">Hidden gems that deserve more attention</p>
        </div>
        <UButton color="violet" @click="openAddModal('overlooked')">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          Add Album
        </UButton>
      </div>

      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
        </div>

        <div v-else-if="overlooked.length === 0" class="text-center py-8 text-zinc-400">
          <UIcon name="i-heroicons-eye-slash" class="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No overlooked albums yet.</p>
          <p class="text-sm mt-1">Add albums that deserve more attention.</p>
        </div>

        <div v-else class="space-y-3">
          <AdminZineAlbumCard
            v-for="(item, index) in overlooked"
            :key="item.id"
            :item="item"
            :index="index"
            :cover-url="albumCovers[item.album_id]"
            :deleting="deletingId === item.id"
            :editing="editingId === item.id"
            :dragged="draggedIndex === index && dragCategory === 'overlooked'"
            :drag-over="dragOverIndex === index && dragCategory === 'overlooked'"
            @drag-start="onDragStart($event, index, 'overlooked')"
            @drag-end="onDragEnd"
            @drag-over="() => onDragOver(index, 'overlooked')"
            @drag-leave="onDragLeave"
            @drop="() => onDrop(index, 'overlooked')"
            @edit="editDescription(item)"
            @delete="removeAlbum(item)"
          />
        </div>
      </UCard>
    </section>

    <!-- Add Album Modal -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">
              Add to {{ addingCategory === 'staff_pick' ? 'Staff Picks' : 'The Overlooked' }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showAddModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Search Input -->
          <UFormGroup label="Search Albums">
            <UInput
              v-model="searchQuery"
              placeholder="Search by album or artist..."
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

          <!-- Description Input -->
          <UFormGroup v-if="selectedAlbumId" label="Editorial Description" help="Why is this album special?">
            <UTextarea
              v-model="newDescription"
              placeholder="Write a short blurb about this album..."
              :rows="3"
            />
          </UFormGroup>
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

    <!-- Edit Description Modal -->
    <UModal v-model="showEditModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">Edit Description</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showEditModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="editingItem" class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div class="w-12 h-12 rounded bg-zinc-700 overflow-hidden flex-shrink-0">
              <img
                v-if="albumCovers[editingItem.album_id]"
                :src="albumCovers[editingItem.album_id]"
                :alt="editingItem.albums?.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <p class="font-medium text-zinc-100">{{ editingItem.albums?.title }}</p>
              <p class="text-sm text-zinc-500">{{ editingItem.albums?.bands?.name }}</p>
            </div>
          </div>

          <UFormGroup label="Editorial Description" help="Why is this album special?">
            <UTextarea
              v-model="editDescription_"
              placeholder="Write a short blurb about this album..."
              :rows="4"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="showEditModal = false">
              Cancel
            </UButton>
            <UButton
              color="violet"
              :loading="saving"
              @click="saveDescription"
            >
              Save
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface ZineAlbum {
  id: string
  album_id: string
  category: string
  description?: string | null
  position: number
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
const staffPicks = ref<ZineAlbum[]>([])
const overlooked = ref<ZineAlbum[]>([])
const albumCovers = ref<Record<string, string>>({})
const loading = ref(true)

// Add modal state
const showAddModal = ref(false)
const addingCategory = ref<'staff_pick' | 'overlooked'>('staff_pick')
const searchQuery = ref('')
const searchResults = ref<SearchAlbum[]>([])
const searchCovers = ref<Record<string, string>>({})
const searching = ref(false)
const selectedAlbumId = ref<string | null>(null)
const newDescription = ref('')
const adding = ref(false)

// Edit modal state
const showEditModal = ref(false)
const editingItem = ref<ZineAlbum | null>(null)
const editingId = ref<string | null>(null)
const editDescription_ = ref('')
const saving = ref(false)

// Delete state
const deletingId = ref<string | null>(null)

// Drag state
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dragCategory = ref<string | null>(null)

// Load zine albums
const loadZineAlbums = async () => {
  loading.value = true
  try {
    // Add cache busting to ensure fresh data
    const data = await $fetch<{ staffPicks: ZineAlbum[]; overlooked: ZineAlbum[] }>('/api/admin/zine', {
      query: { _t: Date.now() },
    })
    console.log('Zine albums loaded:', data)
    staffPicks.value = data.staffPicks || []
    overlooked.value = data.overlooked || []
    console.log('Staff picks:', staffPicks.value.length, 'Overlooked:', overlooked.value.length)

    // Load cover URLs
    const allAlbums = [...staffPicks.value, ...overlooked.value]
    for (const item of allAlbums) {
      if (item.albums?.cover_key && !albumCovers.value[item.album_id]) {
        const url = await albumStore.getCachedCoverUrl(item.albums.cover_key)
        if (url) albumCovers.value[item.album_id] = url
      } else if (item.albums?.cover_url && !albumCovers.value[item.album_id]) {
        albumCovers.value[item.album_id] = item.albums.cover_url
      }
    }
  } catch (e) {
    console.error('Failed to load zine albums:', e)
    toast.add({ title: 'Error', description: 'Failed to load zine albums', color: 'red' })
  } finally {
    loading.value = false
  }
}

// Search
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
    // Get existing album IDs to exclude
    const existingIds = new Set([
      ...staffPicks.value.map(s => s.album_id),
      ...overlooked.value.map(o => o.album_id),
    ])

    const { albums } = await $fetch<{ albums: SearchAlbum[] }>('/api/albums/search', {
      query: { q: searchQuery.value, limit: 20 },
    })

    searchResults.value = (albums || []).filter(a => !existingIds.has(a.id))

    // Load covers
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
const openAddModal = (category: 'staff_pick' | 'overlooked') => {
  addingCategory.value = category
  searchQuery.value = ''
  searchResults.value = []
  searchCovers.value = {}
  selectedAlbumId.value = null
  newDescription.value = ''
  showAddModal.value = true
}

// Add album
const addAlbum = async () => {
  if (!selectedAlbumId.value) return

  adding.value = true
  try {
    await $fetch('/api/admin/zine', {
      method: 'POST',
      body: {
        album_id: selectedAlbumId.value,
        category: addingCategory.value,
        description: newDescription.value || null,
      },
    })

    toast.add({
      title: 'Added',
      description: `Album added to ${addingCategory.value === 'staff_pick' ? 'Staff Picks' : 'The Overlooked'}`,
      color: 'green',
    })

    showAddModal.value = false
    await loadZineAlbums()
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

// Edit description
const editDescription = (item: ZineAlbum) => {
  editingItem.value = item
  editingId.value = item.id
  editDescription_.value = item.description || ''
  showEditModal.value = true
}

// Save description
const saveDescription = async () => {
  if (!editingItem.value) return

  saving.value = true
  try {
    await $fetch(`/api/admin/zine/${editingItem.value.id}`, {
      method: 'PATCH',
      body: { description: editDescription_.value || null },
    })

    toast.add({ title: 'Saved', description: 'Description updated', color: 'green' })
    showEditModal.value = false
    await loadZineAlbums()
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to save description', color: 'red' })
  } finally {
    saving.value = false
    editingId.value = null
  }
}

// Remove album
const removeAlbum = async (item: ZineAlbum) => {
  deletingId.value = item.id
  try {
    await $fetch(`/api/admin/zine/${item.id}` as string, { method: 'DELETE' as const })
    toast.add({ title: 'Removed', description: 'Album removed', color: 'green' })
    await loadZineAlbums()
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to remove album', color: 'red' })
  } finally {
    deletingId.value = null
  }
}

// Drag handlers
const onDragStart = (e: DragEvent, index: number, category: string) => {
  draggedIndex.value = index
  dragCategory.value = category
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

const onDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
  dragCategory.value = null
}

const onDragOver = (index: number, category: string) => {
  if (draggedIndex.value !== null && draggedIndex.value !== index && dragCategory.value === category) {
    dragOverIndex.value = index
  }
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = async (targetIndex: number, category: string) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex || dragCategory.value !== category) {
    dragOverIndex.value = null
    return
  }

  const items = category === 'staff_pick' ? [...staffPicks.value] : [...overlooked.value]
  const [removed] = items.splice(draggedIndex.value, 1)
  items.splice(targetIndex, 0, removed)

  if (category === 'staff_pick') {
    staffPicks.value = items
  } else {
    overlooked.value = items
  }

  draggedIndex.value = null
  dragOverIndex.value = null
  dragCategory.value = null

  try {
    const orderedIds = items.map(i => i.id)
    await $fetch('/api/admin/zine/reorder', {
      method: 'PATCH',
      body: { category, orderedIds },
    })
    toast.add({ title: 'Reordered', description: 'Order updated', color: 'green' })
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to save order', color: 'red' })
    await loadZineAlbums()
  }
}

onMounted(loadZineAlbums)
</script>
