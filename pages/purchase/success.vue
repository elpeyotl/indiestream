<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg text-center">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <USkeleton class="w-24 h-24 rounded-full mx-auto" />
        <USkeleton class="h-8 w-48 mx-auto" />
        <USkeleton class="h-4 w-64 mx-auto" />
      </div>

      <!-- Success Content -->
      <template v-else-if="purchase">
        <!-- Success Icon -->
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-check-circle" class="w-14 h-14 text-green-400" />
        </div>

        <h1 class="text-3xl font-bold text-zinc-100 mb-2">Thank you!</h1>
        <p class="text-zinc-400 mb-8">
          You now own <span class="text-zinc-100 font-medium">{{ purchase.album?.title }}</span>
        </p>

        <!-- Album Card -->
        <div class="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 mb-8">
          <div class="flex items-center gap-4">
            <!-- Album Cover -->
            <div class="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              <NuxtImg
                v-if="coverUrl"
                :src="coverUrl"
                :alt="purchase.album?.title"
                :width="80"
                :height="80"
                format="webp"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-zinc-600" />
              </div>
            </div>

            <!-- Album Info -->
            <div class="text-left min-w-0">
              <h3 class="font-semibold text-zinc-100 truncate">{{ purchase.album?.title }}</h3>
              <p class="text-sm text-zinc-400 truncate">{{ purchase.album?.artist?.name }}</p>
              <UBadge color="green" size="xs" class="mt-2">
                <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
                Owned
              </UBadge>
            </div>
          </div>

          <!-- Artist Support Badge -->
          <div class="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-center gap-2 text-sm">
            <UIcon name="i-heroicons-heart" class="w-4 h-4 text-violet-400" />
            <span class="text-zinc-400">
              <span class="text-violet-400 font-medium">85%</span> of your purchase goes to the artist
            </span>
          </div>
        </div>

        <!-- Download Section -->
        <div class="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 mb-8">
          <h3 class="font-semibold text-zinc-100 mb-4">Download your album</h3>
          <p class="text-sm text-zinc-400 mb-4">
            Choose your preferred format. You can download again anytime from your library.
          </p>
          <div class="flex gap-3 justify-center">
            <UButton
              color="violet"
              size="lg"
              :loading="downloadingAac"
              @click="downloadAlbum('aac')"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
              AAC (256 kbps)
            </UButton>
            <UButton
              color="gray"
              variant="ghost"
              size="lg"
              :loading="downloadingFlac"
              @click="downloadAlbum('flac')"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
              FLAC (Lossless)
            </UButton>
          </div>
        </div>

        <!-- Navigation -->
        <div class="space-y-3">
          <UButton
            v-if="purchase.album"
            color="violet"
            size="lg"
            block
            :to="`/${purchase.album.artist?.slug}/${purchase.album.slug}`"
          >
            <UIcon name="i-heroicons-play" class="w-5 h-5 mr-2" />
            Listen Now
          </UButton>
          <UButton color="gray" variant="ghost" size="lg" block to="/library/purchases">
            View All Purchases
          </UButton>
        </div>
      </template>

      <!-- Error State -->
      <template v-else>
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-14 h-14 text-red-400" />
        </div>
        <h1 class="text-3xl font-bold text-zinc-100 mb-2">Something went wrong</h1>
        <p class="text-zinc-400 mb-8">
          We couldn't find your purchase. Please check your library or contact support.
        </p>
        <UButton color="violet" size="lg" to="/library/purchases">
          Go to Purchases
        </UButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Purchase Complete | Fairtune',
})

const route = useRoute()
const purchaseStore = usePurchaseStore()
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore
const { loadingDownload } = storeToRefs(purchaseStore)

// State
const loading = ref(true)
const purchase = ref<{
  id: string
  amount: number
  currency: string
  album?: {
    id: string
    title: string
    slug: string
    coverKey?: string
    artist?: {
      name: string
      slug: string
    }
  }
} | null>(null)
const coverUrl = ref<string | null>(null)
const downloadingAac = ref(false)
const downloadingFlac = ref(false)

// Get album ID from query params
const albumId = computed(() => route.query.album as string | undefined)

// Fetch purchase data
const fetchPurchaseData = async () => {
  if (!albumId.value) {
    loading.value = false
    return
  }

  try {
    // Fetch purchase status which includes album data
    const status = await purchaseStore.fetchPurchaseStatus(albumId.value)

    if (status?.owned && status.purchase) {
      // Fetch album details
      const albumData = await $fetch<{
        id: string
        title: string
        slug: string
        cover_key?: string
        band: {
          name: string
          slug: string
        }
      }>(`/api/albums/${albumId.value}`)

      purchase.value = {
        id: status.purchase.id,
        amount: status.purchase.amount,
        currency: status.purchase.currency,
        album: {
          id: albumData.id,
          title: albumData.title,
          slug: albumData.slug,
          coverKey: albumData.cover_key,
          artist: {
            name: albumData.band.name,
            slug: albumData.band.slug,
          },
        },
      }

      // Load cover image
      if (albumData.cover_key) {
        coverUrl.value = await getCachedCoverUrl(albumData.cover_key)
      }
    }
  } catch (e) {
    console.error('Failed to fetch purchase:', e)
  } finally {
    loading.value = false
  }
}

// Download album
const downloadAlbum = async (format: 'aac' | 'flac') => {
  if (!purchase.value?.album) return

  if (format === 'aac') {
    downloadingAac.value = true
  } else {
    downloadingFlac.value = true
  }

  try {
    const downloadData = await purchaseStore.getDownloadUrls(purchase.value.album.id, format)

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
  } finally {
    downloadingAac.value = false
    downloadingFlac.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchPurchaseData()
})
</script>
