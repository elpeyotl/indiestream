<template>
  <div class="py-6 space-y-6">
    <!-- Search and Filters -->
    <div class="flex flex-wrap gap-4">
      <UInput
        v-model="playlistSearch"
        placeholder="Search by title..."
        size="lg"
        class="flex-1 min-w-[300px]"
        @input="debouncedPlaylistSearch"
      >
        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
        </template>
      </UInput>

      <USelectMenu
        v-model="playlistFilter"
        :options="playlistFilterOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-40"
      />

      <UButton color="gray" @click="loadPlaylists">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Playlists Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="playlistsLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="playlists.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-queue-list" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No playlists found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Playlist</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Owner</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Tracks</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Created</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="playlist in playlists"
              :key="playlist.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-heroicons-queue-list" class="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ playlist.title }}</p>
                    <p v-if="playlist.description" class="text-sm text-zinc-400 truncate max-w-xs">{{ playlist.description }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm">
                  <p class="text-zinc-300">{{ playlist.owner?.display_name || 'Unknown' }}</p>
                  <p class="text-zinc-500">{{ playlist.owner?.email }}</p>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="text-zinc-300">{{ playlist.track_count }}</span>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-wrap gap-1">
                  <UBadge v-if="playlist.is_featured" color="violet" variant="subtle" size="xs">
                    Featured
                  </UBadge>
                  <UBadge v-if="playlist.is_curated" color="blue" variant="subtle" size="xs">
                    Curated
                  </UBadge>
                  <UBadge v-if="playlist.is_public" color="green" variant="subtle" size="xs">
                    Public
                  </UBadge>
                  <UBadge v-if="!playlist.is_public" color="gray" variant="subtle" size="xs">
                    Private
                  </UBadge>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-zinc-400">
                  {{ new Date(playlist.created_at).toLocaleDateString() }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    v-if="!playlist.is_featured"
                    color="violet"
                    variant="soft"
                    size="xs"
                    :loading="playlistActionLoading === playlist.id"
                    @click="togglePlaylistFeatured(playlist)"
                  >
                    <UIcon name="i-heroicons-star" class="w-4 h-4 mr-1" />
                    Feature
                  </UButton>
                  <UButton
                    v-else
                    color="gray"
                    variant="soft"
                    size="xs"
                    :loading="playlistActionLoading === playlist.id"
                    @click="togglePlaylistFeatured(playlist)"
                  >
                    <UIcon name="i-heroicons-star-solid" class="w-4 h-4 mr-1 text-violet-400" />
                    Unfeature
                  </UButton>
                  <UButton
                    v-if="!playlist.is_curated"
                    color="blue"
                    variant="ghost"
                    size="xs"
                    :loading="playlistActionLoading === playlist.id"
                    @click="togglePlaylistCurated(playlist)"
                  >
                    Mark Curated
                  </UButton>
                  <UButton
                    v-else
                    color="gray"
                    variant="ghost"
                    size="xs"
                    :loading="playlistActionLoading === playlist.id"
                    @click="togglePlaylistCurated(playlist)"
                  >
                    Uncurate
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="playlistsTotal > playlistsLimit" class="flex items-center justify-between pt-4 border-t border-zinc-800 mt-4">
        <p class="text-sm text-zinc-400">
          Showing {{ playlistsPage * playlistsLimit + 1 }}-{{ Math.min((playlistsPage + 1) * playlistsLimit, playlistsTotal) }} of {{ playlistsTotal }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="outline"
            size="sm"
            :disabled="playlistsPage === 0"
            @click="loadPlaylists(playlistsPage - 1)"
          >
            Previous
          </UButton>
          <UButton
            color="gray"
            variant="outline"
            size="sm"
            :disabled="(playlistsPage + 1) * playlistsLimit >= playlistsTotal"
            @click="loadPlaylists(playlistsPage + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { AdminPlaylist } from '~/types/admin'
import { playlistFilterOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'
import { useAdminRealtime } from '~/composables/useAdminRealtime'

const { toast } = useAdminUtils()
const { subscribe } = useAdminRealtime()

// State
const playlists = ref<AdminPlaylist[]>([])
const playlistsLoading = ref(false)
const playlistSearch = ref('')
const playlistFilter = ref('all')
const playlistsPage = ref(0)
const playlistsLimit = ref(20)
const playlistsTotal = ref(0)
const playlistActionLoading = ref<string | null>(null)

const loadPlaylists = async (page = 0) => {
  playlistsLoading.value = true
  try {
    const data = await $fetch<{
      playlists: AdminPlaylist[]
      total: number
      limit: number
      offset: number
    }>('/api/admin/playlists', {
      query: {
        search: playlistSearch.value || undefined,
        filter: playlistFilter.value !== 'all' ? playlistFilter.value : undefined,
        limit: playlistsLimit.value,
        offset: page * playlistsLimit.value,
      },
    })

    playlists.value = data.playlists
    playlistsTotal.value = data.total
    playlistsPage.value = page
  } catch (e: any) {
    console.error('Failed to load playlists:', e)
    toast.add({
      title: 'Failed to load playlists',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    playlistsLoading.value = false
  }
}

let playlistSearchTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedPlaylistSearch = () => {
  if (playlistSearchTimeout) clearTimeout(playlistSearchTimeout)
  playlistSearchTimeout = setTimeout(() => {
    loadPlaylists(0)
  }, 300)
}

const togglePlaylistFeatured = async (playlist: AdminPlaylist) => {
  playlistActionLoading.value = playlist.id
  try {
    await $fetch(`/api/admin/playlists/${playlist.id}`, {
      method: 'PATCH',
      body: { is_featured: !playlist.is_featured },
    })

    // Update local state
    playlist.is_featured = !playlist.is_featured
    if (playlist.is_featured) {
      playlist.featured_at = new Date().toISOString()
    } else {
      playlist.featured_at = null
    }

    toast.add({
      title: playlist.is_featured ? 'Playlist featured' : 'Playlist unfeatured',
      color: 'green',
    })
  } catch (e: any) {
    console.error('Failed to toggle featured:', e)
    toast.add({
      title: 'Failed to update playlist',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    playlistActionLoading.value = null
  }
}

const togglePlaylistCurated = async (playlist: AdminPlaylist) => {
  playlistActionLoading.value = playlist.id
  try {
    await $fetch(`/api/admin/playlists/${playlist.id}`, {
      method: 'PATCH',
      body: { is_curated: !playlist.is_curated },
    })

    // Update local state
    playlist.is_curated = !playlist.is_curated

    toast.add({
      title: playlist.is_curated ? 'Marked as curated' : 'Removed curated flag',
      color: 'green',
    })
  } catch (e: any) {
    console.error('Failed to toggle curated:', e)
    toast.add({
      title: 'Failed to update playlist',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    playlistActionLoading.value = null
  }
}

// Watch filter changes
watch(playlistFilter, () => {
  loadPlaylists(0)
})

onMounted(() => {
  loadPlaylists()

  // Subscribe to realtime updates for playlists table
  subscribe({
    table: 'playlists',
    onUpdate: () => loadPlaylists(playlistsPage.value),
  })
})
</script>
