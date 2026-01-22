<template>
  <!-- Playlist Picker Sub-sheet -->
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/60 z-[60]"
        @click="close"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="slide-up">
      <div
        v-if="modelValue"
        class="fixed bottom-0 left-0 right-0 z-[60] bg-zinc-900 rounded-t-2xl border-t border-zinc-800 pb-safe max-h-[70vh] flex flex-col"
      >
        <!-- Header -->
        <div class="p-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h3 class="font-semibold text-zinc-100">Add to Playlist</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="close"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <!-- Create New -->
          <button class="action-item" @click="showCreateModal = true">
            <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-violet-400" />
            <span>Create New Playlist</span>
          </button>

          <!-- Loading -->
          <div v-if="loading" class="p-4 text-center text-zinc-400">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
          </div>

          <!-- Existing Playlists -->
          <button
            v-for="playlist in editablePlaylists"
            :key="playlist.id"
            class="action-item"
            @click="handleAddToPlaylist(playlist.id)"
          >
            <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
            <span class="truncate">{{ playlist.title }}</span>
          </button>

          <!-- Empty state -->
          <div v-if="!loading && editablePlaylists.length === 0" class="p-4 text-center text-zinc-400 text-sm">
            No playlists yet. Create one to get started!
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

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
  modelValue: boolean
  trackId: string
  trackTitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  added: [playlistId: string]
}>()

const user = useSupabaseUser()
const toast = useToast()
import { storeToRefs } from 'pinia'

const playlistStore = usePlaylistStore()
const { playlists } = storeToRefs(playlistStore)
const { fetchPlaylists, createPlaylist, addTrack } = playlistStore

const showCreateModal = ref(false)
const newPlaylistTitle = ref('')
const creating = ref(false)
const loading = ref(false)

// Fetch playlists when sheet opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && user.value && playlists.value.length === 0) {
    loading.value = true
    await fetchPlaylists()
    loading.value = false
  }
})

const editablePlaylists = computed(() => {
  return playlists.value.filter(p => p.role === 'owner' || p.role === 'editor')
})

const close = () => {
  emit('update:modelValue', false)
}

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
</script>

<style scoped>
.action-item {
  @apply flex items-center gap-3 w-full px-4 py-3 text-left text-zinc-100 hover:bg-zinc-800/50 active:bg-zinc-800 transition-colors;
}

.pb-safe {
  padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
