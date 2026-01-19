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
  </div>
</template>

<script setup lang="ts">
import type { PlayerTrack } from '~/composables/usePlayer'

const props = withDefaults(
  defineProps<{
    track: PlayerTrack
    showOnHover?: boolean
  }>(),
  {
    showOnHover: false,
  }
)

const { addNextInQueue, addToQueue } = usePlayer()
const { isTrackLiked, toggleTrackLike } = useLibrary()
const toast = useToast()

const showPlaylistPicker = ref(false)

const isLiked = computed(() => isTrackLiked(props.track.id))

const handlePlayNext = async () => {
  await addNextInQueue(props.track)
  toast.add({
    title: 'Playing Next',
    description: `${props.track.title} will play next`,
    color: 'green',
  })
}

const handleAddToQueue = async () => {
  await addToQueue(props.track)
  toast.add({
    title: 'Added to Queue',
    description: `${props.track.title} added to queue`,
    color: 'green',
  })
}

const handleToggleLike = async () => {
  await toggleTrackLike(props.track.id)
}

const goToArtist = () => {
  navigateTo(`/${props.track.artistSlug}`)
}

const goToAlbum = () => {
  navigateTo(`/${props.track.artistSlug}/${props.track.albumSlug}`)
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
])
</script>
