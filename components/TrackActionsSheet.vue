<template>
  <!-- Mobile Bottom Sheet for Track Actions -->
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/60 z-50"
        @click="close"
      />
    </Transition>

    <!-- Sheet -->
    <Transition name="slide-up">
      <div
        v-if="modelValue"
        class="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl border-t border-zinc-800 pb-safe"
      >
        <!-- Track Info Header -->
        <div class="flex items-center gap-3 p-4 border-b border-zinc-800">
          <div class="w-12 h-12 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
            <img
              v-if="track.coverUrl"
              :src="track.coverUrl"
              :alt="track.title"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-zinc-600" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-zinc-100 truncate">{{ track.title }}</p>
            <p class="text-sm text-zinc-400 truncate">{{ track.artist }}</p>
          </div>
        </div>

        <!-- Actions List -->
        <div class="py-2">
          <!-- Play Next -->
          <button class="action-item" @click="handlePlayNext">
            <UIcon name="i-heroicons-forward" class="w-5 h-5" />
            <span>Play Next</span>
          </button>

          <!-- Add to Queue -->
          <button class="action-item" @click="handleAddToQueue">
            <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
            <span>Add to Queue</span>
          </button>

          <!-- Like/Unlike -->
          <button class="action-item" @click="handleToggleLike">
            <UIcon
              :name="isLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
              class="w-5 h-5"
              :class="isLiked ? 'text-red-500' : ''"
            />
            <span>{{ isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs' }}</span>
          </button>

          <!-- Add to Playlist -->
          <button class="action-item" @click="showPlaylistPicker = true">
            <UIcon name="i-heroicons-plus" class="w-5 h-5" />
            <span>Add to Playlist</span>
          </button>

          <!-- Go to Artist -->
          <button
            v-if="track.artistSlug"
            class="action-item"
            @click="goToArtist"
          >
            <UIcon name="i-heroicons-user" class="w-5 h-5" />
            <span>Go to Artist</span>
          </button>

          <!-- Go to Album -->
          <button
            v-if="track.artistSlug && track.albumSlug"
            class="action-item"
            @click="goToAlbum"
          >
            <UIcon name="i-heroicons-square-3-stack-3d" class="w-5 h-5" />
            <span>Go to Album</span>
          </button>

          <!-- Divider -->
          <div class="border-t border-zinc-800 my-2" />

          <!-- Report -->
          <button class="action-item text-red-400" @click="showReportModal = true">
            <UIcon name="i-heroicons-flag" class="w-5 h-5" />
            <span>Report</span>
          </button>
        </div>

        <!-- Cancel Button -->
        <div class="p-4 border-t border-zinc-800">
          <UButton color="gray" variant="ghost" block class="bg-zinc-800 hover:bg-zinc-700" @click="close">
            Cancel
          </UButton>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Playlist Picker Sub-sheet -->
  <PlaylistPickerSheet
    v-model="showPlaylistPicker"
    :track-id="track.id"
    :track-title="track.title"
    @added="handlePlaylistAdded"
  />

  <!-- Report Modal -->
  <ReportTrackModal
    v-model="showReportModal"
    :track-id="track.id"
    :track-title="track.title"
    @reported="handleReported"
  />
</template>

<script setup lang="ts">
import type { PlayerTrack } from '~/composables/usePlayer'

const props = defineProps<{
  modelValue: boolean
  track: PlayerTrack
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { addNextInQueue, addToQueue } = usePlayer()
const { isTrackLiked, toggleTrackLike } = useLibrary()
const toast = useToast()

const showPlaylistPicker = ref(false)
const showReportModal = ref(false)

const isLiked = computed(() => isTrackLiked(props.track.id))

const close = () => {
  emit('update:modelValue', false)
}

const handlePlayNext = async () => {
  await addNextInQueue(props.track)
  toast.add({
    title: 'Playing Next',
    description: `${props.track.title} will play next`,
    color: 'green',
  })
  close()
}

const handleAddToQueue = async () => {
  await addToQueue(props.track)
  toast.add({
    title: 'Added to Queue',
    description: `${props.track.title} added to queue`,
    color: 'green',
  })
  close()
}

const handleToggleLike = async () => {
  await toggleTrackLike(props.track.id)
  close()
}

const handlePlaylistAdded = () => {
  showPlaylistPicker.value = false
  close()
}

const handleReported = () => {
  showReportModal.value = false
  toast.add({
    title: 'Report Submitted',
    description: 'Report submitted successfully. Our team will review it.',
    color: 'green',
    icon: 'i-heroicons-check-circle',
    timeout: 5000,
  })
  close()
}

const goToArtist = () => {
  close()
  nextTick(() => {
    navigateTo(`/${props.track.artistSlug}`)
  })
}

const goToAlbum = () => {
  close()
  nextTick(() => {
    navigateTo(`/${props.track.artistSlug}/${props.track.albumSlug}`)
  })
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
