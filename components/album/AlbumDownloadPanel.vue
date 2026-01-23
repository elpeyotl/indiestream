<template>
  <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-500" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-zinc-100">You own this album</h3>
        <p class="text-sm text-zinc-400">Download in high quality, forever</p>
      </div>
    </div>

    <!-- Format Selection -->
    <div class="mb-4">
      <p class="text-sm text-zinc-400 mb-2">Choose format</p>
      <div class="flex gap-2">
        <UButton
          :color="selectedFormat === 'aac' ? 'violet' : 'gray'"
          :variant="selectedFormat === 'aac' ? 'solid' : 'outline'"
          size="sm"
          @click="selectedFormat = 'aac'"
        >
          <UIcon name="i-heroicons-musical-note" class="w-4 h-4 mr-1" />
          AAC (256 kbps)
        </UButton>
        <UButton
          :color="selectedFormat === 'flac' ? 'violet' : 'gray'"
          :variant="selectedFormat === 'flac' ? 'solid' : 'outline'"
          size="sm"
          @click="selectedFormat = 'flac'"
        >
          <UIcon name="i-heroicons-sparkles" class="w-4 h-4 mr-1" />
          FLAC (Lossless)
        </UButton>
      </div>
    </div>

    <!-- Download All Button -->
    <UButton
      color="violet"
      size="lg"
      block
      :loading="loading"
      @click="downloadAll"
    >
      <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
      Download All ({{ selectedFormat.toUpperCase() }})
    </UButton>

    <!-- Track List for Individual Downloads -->
    <div v-if="downloadData" class="mt-6 border-t border-zinc-800 pt-4">
      <p class="text-sm text-zinc-400 mb-3">Or download individual tracks</p>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="track in downloadData.tracks"
          :key="track.trackId"
          class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-sm text-zinc-500 w-6 text-right shrink-0">
              {{ track.trackNumber }}
            </span>
            <span class="text-sm text-zinc-200 truncate">
              {{ track.title }}
            </span>
          </div>
          <UButton
            v-if="track.url"
            color="gray"
            variant="ghost"
            size="xs"
            :href="track.url"
            :download="track.filename"
            tag="a"
          >
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
          </UButton>
          <UBadge v-else color="amber" size="xs">
            {{ track.error || 'N/A' }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Purchase Info -->
    <div v-if="purchase" class="mt-4 pt-4 border-t border-zinc-800">
      <p class="text-xs text-zinc-500">
        Purchased {{ formatDate(purchase.purchasedAt) }} for {{ formatPrice(purchase.amount, purchase.currency) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DownloadData } from '~/stores/purchase'

interface Props {
  albumId: string
  purchase?: {
    id: string
    amount: number
    currency: string
    purchasedAt: string
  } | null
}

const props = defineProps<Props>()

const purchaseStore = usePurchaseStore()
const { loadingDownload } = storeToRefs(purchaseStore)

// State
const selectedFormat = ref<'aac' | 'flac'>('aac')
const downloadData = ref<DownloadData | null>(null)
const loading = computed(() => loadingDownload.value)

// Format date for display
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format price for display
const formatPrice = (amount: number, currency: string): string => {
  return `${currency} ${amount.toFixed(2)}`
}

// Fetch download URLs
const fetchDownloadUrls = async () => {
  try {
    downloadData.value = await purchaseStore.getDownloadUrls(props.albumId, selectedFormat.value)
  } catch (error) {
    console.error('Failed to fetch download URLs:', error)
  }
}

// Download all tracks
const downloadAll = async () => {
  await fetchDownloadUrls()

  if (!downloadData.value) return

  // Download each track sequentially with a small delay
  for (const track of downloadData.value.tracks) {
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
}

// Refetch when format changes
watch(selectedFormat, () => {
  if (downloadData.value) {
    fetchDownloadUrls()
  }
})
</script>
