<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <NuxtLink to="/library" class="text-zinc-400 hover:text-zinc-300">
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-3xl font-bold text-zinc-100">Purchased Albums</h1>
      </div>
      <p class="text-zinc-400">
        Albums you've bought - download anytime in high quality
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    >
      <div v-for="i in 5" :key="i">
        <USkeleton class="aspect-square rounded-lg mb-3" />
        <USkeleton class="h-5 w-3/4 mb-1" />
        <USkeleton class="h-4 w-1/2" />
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="purchases.length === 0"
      icon="i-heroicons-shopping-bag"
      title="No purchases yet"
      description="When you buy albums, they'll appear here. You can download them anytime in FLAC or AAC format."
      action-label="Discover Music"
      action-to="/discover"
    />

    <!-- Purchases Grid -->
    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
    >
      <div
        v-for="purchase in purchases"
        :key="purchase.id"
        class="group"
      >
        <!-- Album Card -->
        <NuxtLink
          v-if="purchase.album"
          :to="`/${purchase.album.artist?.slug}/${purchase.album.slug}`"
        >
          <div class="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
            <img
              v-if="albumCovers[purchase.album.id]"
              :src="albumCovers[purchase.album.id]"
              :alt="purchase.album.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-musical-note"
                class="w-12 h-12 text-zinc-600"
              />
            </div>

            <!-- Owned Badge -->
            <div class="absolute top-2 right-2">
              <UBadge color="green" size="xs">
                <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
                Owned
              </UBadge>
            </div>

            <!-- Download Hover Overlay -->
            <div
              class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <UButton
                color="violet"
                size="lg"
                icon="i-heroicons-arrow-down-tray"
                @click.prevent="openDownloadModal(purchase)"
              >
                Download
              </UButton>
            </div>
          </div>
        </NuxtLink>

        <!-- Album Info -->
        <h3 class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
          {{ purchase.album?.title || 'Unknown Album' }}
        </h3>
        <p class="text-sm text-zinc-400 truncate">
          {{ purchase.album?.artist?.name || 'Unknown Artist' }}
        </p>
        <p class="text-xs text-zinc-500 mt-1">
          {{ formatDate(purchase.purchasedAt) }}
        </p>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="mt-8 text-center">
      <UButton
        color="gray"
        variant="ghost"
        :loading="loadingMore"
        @click="loadMore"
      >
        Load more
      </UButton>
    </div>

    <!-- Download Modal -->
    <UModal v-model="showDownloadModal">
      <UCard v-if="selectedPurchase">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">
              Download {{ selectedPurchase.album?.title }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              size="sm"
              @click="showDownloadModal = false"
            />
          </div>
        </template>

        <AlbumDownloadPanel
          v-if="selectedPurchase.album"
          :album-id="selectedPurchase.album.id"
          :purchase="{
            id: selectedPurchase.id,
            amount: selectedPurchase.amount,
            currency: selectedPurchase.currency,
            purchasedAt: selectedPurchase.purchasedAt,
          }"
        />
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { PurchasedAlbum } from '~/stores/purchase'

definePageMeta({
  middleware: 'auth',
})

const purchaseStore = usePurchaseStore()
const { purchasedAlbums, loadingPurchases } = storeToRefs(purchaseStore)
const { fetchPurchases } = purchaseStore
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore

// State
const page = ref(1)
const totalPages = ref(1)
const loadingMore = ref(false)
const albumCovers = ref<Record<string, string>>({})
const showDownloadModal = ref(false)
const selectedPurchase = ref<PurchasedAlbum | null>(null)

// Computed
const purchases = computed(() => purchasedAlbums.value)
const loading = computed(() => loadingPurchases.value && purchases.value.length === 0)
const hasMore = computed(() => page.value < totalPages.value)

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Load album covers
const loadAlbumCovers = async () => {
  await Promise.all(
    purchases.value.map(async (purchase) => {
      if (!purchase.album) return
      if (purchase.album.coverKey) {
        const url = await getCachedCoverUrl(purchase.album.coverKey)
        if (url) albumCovers.value[purchase.album.id] = url
      }
    })
  )
}

// Open download modal
const openDownloadModal = (purchase: PurchasedAlbum) => {
  selectedPurchase.value = purchase
  showDownloadModal.value = true
}

// Load more purchases
const loadMore = async () => {
  loadingMore.value = true
  try {
    const data = await fetchPurchases(page.value + 1)
    page.value = data.page
    totalPages.value = data.totalPages
    await loadAlbumCovers()
  } finally {
    loadingMore.value = false
  }
}

// Initial load
const { pending } = await useLazyAsyncData(
  'user-purchases',
  async () => {
    const data = await fetchPurchases(1)
    totalPages.value = data.totalPages
    return data
  },
  { server: false }
)

// Watch for purchases to load covers
watch(
  purchases,
  () => {
    if (purchases.value.length > 0) {
      loadAlbumCovers()
    }
  },
  { immediate: true }
)
</script>
