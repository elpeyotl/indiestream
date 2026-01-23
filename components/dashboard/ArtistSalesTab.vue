<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-green-400">
            CHF {{ totalRevenue.toFixed(2) }}
          </p>
          <p class="text-sm text-zinc-400">Total Album Sales</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ totalSales }}</p>
          <p class="text-sm text-zinc-400">Albums Sold</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">85%</p>
          <p class="text-sm text-zinc-400">Your Share</p>
        </div>
      </UCard>
    </div>

    <!-- Revenue Breakdown -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <template #header>
        <h3 class="text-lg font-semibold text-zinc-100">Revenue Breakdown</h3>
      </template>

      <div v-if="loading" class="space-y-4">
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-12 w-full" />
      </div>

      <div v-else-if="salesData.purchases.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-shopping-bag" class="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p class="text-zinc-400">No album sales yet</p>
        <p class="text-sm text-zinc-500 mt-1">
          Enable album purchases in your release settings to start selling
        </p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="purchase in salesData.purchases"
          :key="purchase.id"
          class="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-400" />
            </div>
            <div class="min-w-0">
              <p class="font-medium text-zinc-100 truncate">
                {{ purchase.album?.title || 'Unknown Album' }}
              </p>
              <p class="text-sm text-zinc-500">
                {{ formatDate(purchase.purchasedAt) }} &bull; {{ purchase.buyer?.displayName || 'Anonymous' }}
              </p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="font-semibold text-green-400">
              +CHF {{ purchase.artistShare.toFixed(2) }}
            </p>
            <p class="text-xs text-zinc-500">
              of CHF {{ purchase.amount.toFixed(2) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="mt-4 text-center">
        <UButton
          color="gray"
          variant="ghost"
          size="sm"
          :loading="loadingMore"
          @click="loadMore"
        >
          Load more
        </UButton>
      </div>
    </UCard>

    <!-- Info Card -->
    <UCard class="bg-green-500/10 border-green-500/30">
      <div class="flex items-start gap-3">
        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-green-400">Album Sales Revenue</p>
          <p class="text-sm text-zinc-400 mt-1">
            Album sales revenue is transferred directly to your Stripe Connect account.
            You receive 85% of each sale, with 15% going to the platform.
            This is separate from streaming earnings.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface Props {
  bandId: string
}

const props = defineProps<Props>()

// State
const loading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const totalPages = ref(1)
const salesData = ref<{
  totalSales: number
  totalRevenue: number
  currency: string
  purchases: Array<{
    id: string
    amount: number
    artistShare: number
    platformFee: number
    currency: string
    purchasedAt: string
    album: { id: string; title: string; slug: string } | null
    band: { id: string; name: string } | null
    buyer: { displayName: string } | null
  }>
}>({
  totalSales: 0,
  totalRevenue: 0,
  currency: 'CHF',
  purchases: [],
})

// Computed
const totalSales = computed(() => salesData.value.totalSales)
const totalRevenue = computed(() => salesData.value.totalRevenue)
const hasMore = computed(() => page.value < totalPages.value)

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Fetch sales data
const fetchSales = async (pageNum = 1) => {
  try {
    const data = await $fetch<typeof salesData.value & { total: number; totalPages: number }>(
      '/api/artist/sales',
      {
        query: {
          band_id: props.bandId,
          page: pageNum,
          limit: 10,
        },
      }
    )

    if (pageNum === 1) {
      salesData.value = {
        totalSales: data.totalSales,
        totalRevenue: data.totalRevenue,
        currency: data.currency,
        purchases: data.purchases,
      }
    } else {
      salesData.value.purchases.push(...data.purchases)
    }

    totalPages.value = data.totalPages
    page.value = pageNum
  } catch (error) {
    console.error('Failed to fetch sales:', error)
  }
}

// Load more
const loadMore = async () => {
  loadingMore.value = true
  await fetchSales(page.value + 1)
  loadingMore.value = false
}

// Initial load
onMounted(async () => {
  loading.value = true
  await fetchSales()
  loading.value = false
})

// Watch for band changes
watch(() => props.bandId, async () => {
  loading.value = true
  page.value = 1
  await fetchSales()
  loading.value = false
})
</script>
