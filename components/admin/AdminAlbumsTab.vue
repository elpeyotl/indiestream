<template>
  <div class="py-6 space-y-6">
    <!-- Search and Filters -->
    <div class="flex flex-wrap gap-4">
      <UInput
        v-model="albumSearch"
        placeholder="Search by title or slug..."
        size="lg"
        class="flex-1 min-w-[300px]"
        @keyup.enter="loadAlbums(1)"
      >
        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
        </template>
      </UInput>

      <USelectMenu
        v-model="albumPublishedFilter"
        :options="albumPublishedFilterOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-40"
        @update:model-value="loadAlbums(1)"
      />

      <UButton color="gray" @click="loadAlbums">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Albums Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="albumsLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="albums.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-square-3-stack-3d" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No albums found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Album</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Type</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Tracks</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Created</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="album in albums"
              :key="album.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-heroicons-square-3-stack-3d" class="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ album.title }}</p>
                    <p class="text-sm text-zinc-400">{{ album.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm">
                  <p class="text-zinc-300">{{ album.band?.name || 'Unknown' }}</p>
                  <p class="text-zinc-500">@{{ album.band?.slug }}</p>
                </div>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="album.release_type === 'album' ? 'violet' : album.release_type === 'ep' ? 'blue' : 'gray'"
                  variant="subtle"
                  size="xs"
                >
                  {{ album.release_type.toUpperCase() }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="album.is_published ? 'green' : 'yellow'"
                  variant="subtle"
                  size="xs"
                >
                  {{ album.is_published ? 'Published' : 'Draft' }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-zinc-400">
                {{ album.track_count }}
              </td>
              <td class="py-3 px-4 text-sm text-zinc-400">
                {{ formatDate(album.created_at) }}
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex justify-end gap-2">
                  <UButton
                    color="violet"
                    variant="ghost"
                    size="xs"
                    @click="openEditAlbumModal(album)"
                  >
                    <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                  </UButton>
                  <UButton
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="confirmDeleteAlbum(album)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="albumsPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
        <p class="text-sm text-zinc-400">
          Showing {{ (albumsPagination.page - 1) * albumsPagination.limit + 1 }} - {{ Math.min(albumsPagination.page * albumsPagination.limit, albumsPagination.total) }} of {{ albumsPagination.total }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="albumsPagination.page <= 1"
            @click="loadAlbums(albumsPagination.page - 1)"
          >
            Previous
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="albumsPagination.page >= albumsPagination.totalPages"
            @click="loadAlbums(albumsPagination.page + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Edit Album Modal (using shared component) -->
    <AlbumEditModal
      v-model="showEditAlbumModal"
      :album="albumToEdit"
      :tracks="editAlbumTracks"
      :cover-url="editAlbumCoverUrl"
      :band-name="albumToEdit?.band?.name || ''"
      :band-id="albumToEdit?.band_id"
      :saving="savingAlbum"
      :uploading-cover="uploadingAlbumCover"
      :is-admin="true"
      @save="handleSaveAlbum"
      @cover-select="handleAlbumCoverSelect"
    />

    <!-- Delete Album Confirmation Modal -->
    <UModal v-model="showDeleteAlbumModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Album</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ albumToDelete?.title }}</strong>?
        </p>
        <p class="text-zinc-400 text-sm mt-2">
          This will permanently delete:
        </p>
        <ul class="text-zinc-400 text-sm mt-1 list-disc list-inside">
          <li>{{ albumToDelete?.track_count || 0 }} track(s)</li>
          <li>All track credits and metadata</li>
          <li>All listening history for this album</li>
        </ul>
        <p class="text-red-400 text-sm mt-3">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteAlbumModal = false" :disabled="deletingAlbum">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingAlbum" @click="handleDeleteAlbum">
              Delete Album
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { AdminAlbum, AdminAlbumTrack } from '~/types/admin'
import type { EditableTrack, AlbumEditForm } from '~/components/AlbumEditModal.vue'
import { albumPublishedFilterOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const emit = defineEmits<{
  statsUpdated: []
}>()

const { toast, formatDate } = useAdminUtils()

// State
const albums = ref<AdminAlbum[]>([])
const albumsLoading = ref(false)
const albumSearch = ref('')
const albumPublishedFilter = ref('all')
const albumsPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

// Album edit state
const showEditAlbumModal = ref(false)
const albumToEdit = ref<AdminAlbum | null>(null)
const editAlbumTracks = ref<EditableTrack[]>([])
const editAlbumCoverUrl = ref<string | null>(null)
const savingAlbum = ref(false)
const uploadingAlbumCover = ref(false)

// Album delete state
const showDeleteAlbumModal = ref(false)
const deletingAlbum = ref(false)
const albumToDelete = ref<AdminAlbum | null>(null)

const loadAlbums = async (page = 1) => {
  albumsLoading.value = true
  try {
    const data = await $fetch('/api/admin/albums', {
      query: {
        page,
        limit: 50,
        search: albumSearch.value,
        published: albumPublishedFilter.value,
      },
    })

    albums.value = data.albums as AdminAlbum[]
    albumsPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load albums:', e)
    toast.add({
      title: 'Failed to load albums',
      description: e.message,
      color: 'red',
    })
  } finally {
    albumsLoading.value = false
  }
}

const openEditAlbumModal = async (album: AdminAlbum) => {
  albumToEdit.value = album
  editAlbumCoverUrl.value = null

  // Fetch full album with tracks
  try {
    const data = await $fetch(`/api/admin/albums/${album.id}`)
    const fullAlbum = data.album as AdminAlbum

    // Convert tracks to editable format
    editAlbumTracks.value = (fullAlbum.tracks || []).map(t => ({
      id: t.id,
      title: t.title,
      track_number: t.track_number,
      is_explicit: t.is_explicit,
      isrc: t.isrc,
      iswc: t.iswc,
      moderation_status: t.moderation_status || 'pending',
      moderation_notes: t.moderation_notes,
      showCredits: false,
      credits: (t.credits || []).map(c => ({
        role: c.role,
        name: c.name,
        ipi_number: c.ipi_number || '',
      })),
    }))

    // Get cover URL if exists
    if (fullAlbum.cover_key) {
      try {
        const encodedKey = btoa(fullAlbum.cover_key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
        editAlbumCoverUrl.value = response.url
      } catch {
        // Cover URL fetch failed, ignore
      }
    }

    showEditAlbumModal.value = true
  } catch (e: any) {
    console.error('Failed to fetch album details:', e)
    toast.add({
      title: 'Failed to load album',
      description: e.message,
      color: 'red',
    })
  }
}

const handleSaveAlbum = async (form: AlbumEditForm, tracks: EditableTrack[]) => {
  if (!albumToEdit.value) return

  // Check if album is being published (was not published, now is)
  const isBeingPublished = !albumToEdit.value.is_published && form.is_published

  savingAlbum.value = true
  try {
    await $fetch(`/api/admin/albums/${albumToEdit.value.id}`, {
      method: 'PATCH',
      body: {
        title: form.title,
        description: form.description || null,
        release_type: form.release_type,
        release_date: form.release_date || null,
        is_published: form.is_published,
        label_name: form.label_name || null,
        p_line: form.p_line || null,
        c_line: form.c_line || null,
        upc: form.upc || null,
        tracks: tracks.map(t => ({
          id: t.id,
          title: t.title,
          track_number: t.track_number,
          is_explicit: t.is_explicit,
          isrc: t.isrc,
          iswc: t.iswc,
          moderation_status: t.moderation_status,
        })),
      },
    })

    // Notify followers if album was just published
    if (isBeingPublished) {
      $fetch(`/api/albums/${albumToEdit.value.id}/notify-followers`, { method: 'POST' })
        .then((result: any) => {
          if (result.notified > 0) {
            toast.add({
              title: 'Followers notified',
              description: `${result.notified} follower(s) were notified of the new release`,
              color: 'blue',
              icon: 'i-heroicons-bell',
            })
          }
        })
        .catch((err) => {
          console.error('Failed to notify followers:', err)
        })
    }

    toast.add({
      title: 'Album updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showEditAlbumModal.value = false
    loadAlbums(albumsPagination.value.page)
  } catch (e: any) {
    console.error('Failed to update album:', e)
    toast.add({
      title: 'Failed to update album',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    savingAlbum.value = false
  }
}

const handleAlbumCoverSelect = async (file: File) => {
  // For admin, cover upload is not implemented - they can edit via artist dashboard
  toast.add({
    title: 'Cover upload not available',
    description: 'Album covers must be changed through the artist dashboard',
    color: 'yellow',
  })
}

const confirmDeleteAlbum = (album: AdminAlbum) => {
  albumToDelete.value = album
  showDeleteAlbumModal.value = true
}

const handleDeleteAlbum = async () => {
  if (!albumToDelete.value) return

  deletingAlbum.value = true
  try {
    await $fetch(`/api/admin/albums/${albumToDelete.value.id}`, {
      method: 'DELETE',
    })

    albums.value = albums.value.filter(a => a.id !== albumToDelete.value!.id)
    albumsPagination.value.total -= 1

    toast.add({
      title: 'Album deleted',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showDeleteAlbumModal.value = false
    emit('statsUpdated')
  } catch (e: any) {
    console.error('Failed to delete album:', e)
    toast.add({
      title: 'Failed to delete album',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    deletingAlbum.value = false
  }
}

onMounted(() => {
  loadAlbums()
})
</script>
