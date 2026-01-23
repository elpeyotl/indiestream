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
          icon="i-heroicons-ellipsis-horizontal"
          title="Track actions"
          :class="showOnHover ? 'opacity-0 group-hover:opacity-60 hover:!opacity-100' : ''"
        />
      </slot>
    </UDropdown>

    <!-- Playlist Picker Sheet (for mobile-like experience on smaller screens) -->
    <PlaylistPickerSheet
      v-model="showPlaylistPicker"
      :track-id="track.id"
      :track-title="track.title"
      @added="showPlaylistPicker = false"
    />

    <!-- Report Modal -->
    <ReportTrackModal
      v-model="showReportModal"
      :track-id="track.id"
      :track-title="track.title"
      @reported="handleReported"
    />
  </div>
</template>

<script setup lang="ts">
import type { PlayerTrack } from '~/stores/player'

const props = withDefaults(
  defineProps<{
    track: PlayerTrack
    showOnHover?: boolean
  }>(),
  {
    showOnHover: false,
  }
)

const playerStore = usePlayerStore()
const { addNextInQueue, addToQueue } = playerStore
const libraryStore = useLibraryStore()
const { isTrackLiked, toggleTrackLike } = libraryStore
const toast = useToast()
const haptics = useHaptics()

const showPlaylistPicker = ref(false)
const showReportModal = ref(false)

const isLiked = computed(() => isTrackLiked(props.track.id))

const handlePlayNext = async () => {
  haptics.light()
  await addNextInQueue(props.track)
  toast.add({
    title: 'Playing Next',
    description: `${props.track.title} will play next`,
    color: 'green',
  })
}

const handleAddToQueue = async () => {
  haptics.light()
  await addToQueue(props.track)
  toast.add({
    title: 'Added to Queue',
    description: `${props.track.title} added to queue`,
    color: 'green',
  })
}

const handleToggleLike = async () => {
  haptics.success()
  await toggleTrackLike(props.track.id)
}

const goToArtist = () => {
  navigateTo(`/${props.track.artistSlug}`)
}

const goToAlbum = () => {
  navigateTo(`/${props.track.artistSlug}/${props.track.albumSlug}`)
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
}

const menuItems = computed(() => [
  [
    {
      label: 'Play Next',
      icon: 'i-heroicons-forward',
      click: handlePlayNext,
    },
    {
      label: 'Add to Queue',
      icon: 'i-heroicons-queue-list',
      click: handleAddToQueue,
    },
    {
      label: isLiked.value ? 'Remove from Liked' : 'Add to Liked',
      icon: isLiked.value ? 'i-heroicons-heart-solid' : 'i-heroicons-heart',
      click: handleToggleLike,
    },
  ],
  [
    {
      label: 'Add to Playlist',
      icon: 'i-heroicons-plus',
      click: () => {
        showPlaylistPicker.value = true
      },
    },
  ],
  [
    {
      label: 'Go to Artist',
      icon: 'i-heroicons-user',
      click: goToArtist,
      disabled: !props.track.artistSlug,
    },
    {
      label: 'Go to Album',
      icon: 'i-heroicons-square-3-stack-3d',
      click: goToAlbum,
      disabled: !props.track.artistSlug || !props.track.albumSlug,
    },
  ],
  [
    {
      label: 'Report',
      icon: 'i-heroicons-flag',
      click: () => {
        showReportModal.value = true
      },
    },
  ],
])
</script>
