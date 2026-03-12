<template>
  <UButton
    :color="buttonColor"
    :variant="buttonVariant"
    size="lg"
    :loading="isRemoving"
    @click="handleClick"
  >
    <!-- Downloading state: show progress -->
    <template v-if="progress">
      <div class="w-5 h-5 mr-1 relative flex items-center justify-center">
        <svg class="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2" />
          <circle
            cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="circumference - (circumference * progress.cachedTracks / progress.totalTracks)"
            stroke-linecap="round"
          />
        </svg>
      </div>
      {{ progress.cachedTracks }}/{{ progress.totalTracks }}
    </template>

    <!-- Saved state -->
    <template v-else-if="isSaved">
      <UIcon name="i-heroicons-cloud-arrow-down" class="w-5 h-5 mr-1" />
      Saved Offline
    </template>

    <!-- Non-subscriber -->
    <template v-else-if="!isSubscribed">
      <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 mr-1" />
      Offline
    </template>

    <!-- Default: save -->
    <template v-else>
      <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-1" />
      Save Offline
    </template>
  </UButton>
</template>

<script setup lang="ts">
import type { Album, Track } from '~/stores/album'

interface Props {
  album: Album
  tracks: Track[]
}

const props = defineProps<Props>()

const offlineStore = useOfflineStore()
const subscriptionStore = useSubscriptionStore()
const toast = useToast()

const isRemoving = ref(false)
const circumference = 2 * Math.PI * 8

const isSubscribed = computed(() => subscriptionStore.isSubscribed)

const isSaved = computed(() => offlineStore.isAlbumOffline(props.album.id))

const progress = computed(() => {
  if (!offlineStore.isAlbumDownloading(props.album.id)) return null
  return offlineStore.getAlbumDownloadProgress(props.album.id)
})

const buttonColor = computed(() => {
  if (isSaved.value) return 'violet'
  if (progress.value) return 'violet'
  return 'gray'
})

const buttonVariant = computed(() => {
  if (isSaved.value) return 'soft'
  if (progress.value) return 'soft'
  return 'ghost'
})

const handleClick = async () => {
  if (!isSubscribed.value) {
    toast.add({
      title: 'Subscription required',
      description: 'Subscribe to save music for offline listening.',
      color: 'amber',
    })
    return
  }

  if (isSaved.value) {
    // Remove offline
    isRemoving.value = true
    try {
      await offlineStore.removeAlbumOffline(props.album.id)
      toast.add({ title: 'Removed from offline', color: 'gray' })
    } finally {
      isRemoving.value = false
    }
    return
  }

  if (progress.value) {
    // Already downloading, do nothing
    return
  }

  // Save for offline
  try {
    await offlineStore.saveAlbumOffline(props.album, props.tracks)
    toast.add({
      title: 'Downloading for offline',
      description: `${props.tracks.length} tracks will be available offline.`,
      color: 'violet',
    })
  } catch (e) {
    toast.add({
      title: 'Download failed',
      description: e instanceof Error ? e.message : 'Could not save album offline.',
      color: 'red',
    })
  }
}
</script>
