<template>
  <div @click.stop>
    <UDropdown
      :items="menuItems"
      :popper="{ placement: 'bottom-end' }"
    >
      <slot>
        <UButton
          color="gray"
          variant="ghost"
          size="xs"
          icon="i-heroicons-plus"
          :title="'Add to playlist'"
        />
      </slot>
    </UDropdown>
  </div>

  <!-- Create Playlist Modal -->
  <UModal v-model="showCreateModal">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-zinc-100">Create Playlist</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="showCreateModal = false"
          />
        </div>
      </template>

      <div class="space-y-4">
        <UFormGroup label="Name" required>
          <UInput
            v-model="newPlaylistTitle"
            placeholder="My Playlist"
            autofocus
          />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="gray"
            variant="ghost"
            @click="showCreateModal = false"
          >
            Cancel
          </UButton>
          <UButton
            color="violet"
            :loading="creating"
            :disabled="!newPlaylistTitle.trim()"
            @click="handleCreateAndAdd"
          >
            Create & Add
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  trackId: string
  trackTitle?: string
}>()

const emit = defineEmits<{
  added: [playlistId: string]
}>()

const user = useSupabaseUser()
const toast = useToast()
const { playlists, fetchPlaylists, createPlaylist, addTrack } = usePlaylist()

const showCreateModal = ref(false)
const newPlaylistTitle = ref('')
const creating = ref(false)

// Fetch playlists if not already loaded
onMounted(async () => {
  if (user.value && playlists.value.length === 0) {
    await fetchPlaylists()
  }
})

const handleAddToPlaylist = async (playlistId: string) => {
  if (!user.value) {
    toast.add({
      title: 'Sign in required',
      description: 'Please sign in to add tracks to playlists',
      color: 'red',
    })
    return
  }

  const success = await addTrack(playlistId, props.trackId, props.trackTitle)
  if (success) {
    emit('added', playlistId)
  }
}

const handleCreateAndAdd = async () => {
  if (!newPlaylistTitle.value.trim()) return

  creating.value = true
  const playlist = await createPlaylist(newPlaylistTitle.value)

  if (playlist) {
    await addTrack(playlist.id, props.trackId, props.trackTitle)
    showCreateModal.value = false
    newPlaylistTitle.value = ''
    emit('added', playlist.id)
  }

  creating.value = false
}

const menuItems = computed(() => {
  const items: any[][] = []

  // Existing playlists (only show ones user can edit)
  const editablePlaylists = playlists.value.filter(
    (p) => p.role === 'owner' || p.role === 'editor'
  )

  if (editablePlaylists.length > 0) {
    items.push(
      editablePlaylists.slice(0, 5).map((playlist) => ({
        label: playlist.title,
        icon: 'i-heroicons-queue-list',
        click: () => handleAddToPlaylist(playlist.id),
      }))
    )
  }

  // Create new playlist option
  items.push([
    {
      label: 'Create new playlist',
      icon: 'i-heroicons-plus',
      click: () => {
        if (!user.value) {
          toast.add({
            title: 'Sign in required',
            description: 'Please sign in to create playlists',
            color: 'red',
          })
          return
        }
        showCreateModal.value = true
      },
    },
  ])

  return items
})
</script>
