<template>
  <UDropdown
    :items="downloadItems"
    :popper="{ placement: 'bottom-end' }"
  >
    <UButton
      color="gray"
      variant="outline"
      size="lg"
      :loading="loading"
    >
      <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-1" />
      Download
      <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 ml-1" />
    </UButton>
  </UDropdown>
</template>

<script setup lang="ts">
interface Props {
  albumId: string
}

const props = defineProps<Props>()

const purchaseStore = usePurchaseStore()
const { loadingDownload } = storeToRefs(purchaseStore)
const loading = computed(() => loadingDownload.value)

const downloadItems = computed(() => [
  [
    {
      label: 'AAC (256 kbps)',
      icon: 'i-heroicons-musical-note',
      click: () => downloadAlbum('aac'),
    },
    {
      label: 'FLAC (Lossless)',
      icon: 'i-heroicons-sparkles',
      click: () => downloadAlbum('flac'),
    },
  ],
])

const downloadAlbum = async (format: 'aac' | 'flac') => {
  try {
    const downloadData = await purchaseStore.getDownloadUrls(props.albumId, format)

    if (!downloadData) return

    // Download each track sequentially with a small delay
    for (const track of downloadData.tracks) {
      if (track.url) {
        const link = document.createElement('a')
        link.href = track.url
        link.download = track.filename || `${track.trackNumber} - ${track.title}`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  } catch (error) {
    console.error('Failed to download:', error)
  }
}
</script>
