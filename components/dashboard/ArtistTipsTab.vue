<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-pink-400">
            {{ formatCurrency(totalNetAmount) }}
          </p>
          <p class="text-sm text-zinc-400">Total Tips Received</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ totalTips }}</p>
          <p class="text-sm text-zinc-400">Number of Tips</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">~97%</p>
          <p class="text-sm text-zinc-400">Goes to You</p>
        </div>
      </UCard>
    </div>

    <!-- Tips List -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <template #header>
        <h3 class="text-lg font-semibold text-zinc-100">Recent Tips</h3>
      </template>

      <div v-if="loading" class="space-y-4">
        <USkeleton class="h-16 w-full" />
        <USkeleton class="h-16 w-full" />
        <USkeleton class="h-16 w-full" />
      </div>

      <div v-else-if="tips.length === 0" class="text-center py-8">
        <UIcon name="i-heroicons-gift" class="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p class="text-zinc-400">No tips received yet</p>
        <p class="text-sm text-zinc-500 mt-1">
          When fans tip you, they'll appear here
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="tip in tips"
          :key="tip.id"
          class="flex items-start justify-between p-4 rounded-lg bg-zinc-800/50"
        >
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-gift" class="w-5 h-5 text-pink-400" />
            </div>
            <div class="min-w-0">
              <p class="font-medium text-zinc-100">
                {{ tip.is_anonymous ? 'Anonymous' : (tip.tipper_name || 'A fan') }}
              </p>
              <p v-if="tip.message" class="text-sm text-zinc-400 mt-1 italic">
                "{{ tip.message }}"
              </p>
              <p class="text-xs text-zinc-500 mt-1">
                {{ formatDate(tip.created_at) }}
              </p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="font-semibold text-pink-400">
              +{{ formatCurrency(tip.net_amount_cents) }}
            </p>
            <p class="text-xs text-zinc-500">
              of {{ formatCurrency(tip.amount_cents) }}
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
    <UCard class="bg-pink-500/10 border-pink-500/30">
      <div class="flex items-start gap-3">
        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-pink-400">Tips go directly to you</p>
          <p class="text-sm text-zinc-400 mt-1">
            Fairtune takes nothing from tips. You receive the full amount minus only Stripe's payment processing fee (~2.9% + $0.30).
            Tips are added to your balance and included in your monthly payout.
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

interface Tip {
  id: string
  amount_cents: number
  net_amount_cents: number
  message: string | null
  tipper_name: string | null
  is_anonymous: boolean
  created_at: string
}

const props = defineProps<Props>()

// State
const loading = ref(true)
const loadingMore = ref(false)
const tips = ref<Tip[]>([])
const totalTips = ref(0)
const totalNetAmount = ref(0)
const hasMore = ref(false)
const offset = ref(0)
const limit = 20

// Fetch tips
const fetchTips = async (append = false) => {
  try {
    const data = await $fetch<{
      tips: Tip[]
      total: number
      hasMore: boolean
    }>(`/api/tips/${props.bandId}`, {
      query: {
        limit,
        offset: append ? offset.value : 0,
      },
    })

    if (append) {
      tips.value.push(...data.tips)
    } else {
      tips.value = data.tips
    }

    totalTips.value = data.total
    hasMore.value = data.hasMore
    offset.value = tips.value.length

    // Calculate total net amount from all tips
    if (!append) {
      // Fetch stats for accurate total
      const stats = await $fetch<{
        totalTips: number
        totalAmountCents: number
      }>(`/api/tips/stats/${props.bandId}`)
      // Estimate net as ~97% of gross (Stripe fees)
      totalNetAmount.value = Math.floor(stats.totalAmountCents * 0.97)
    }
  } catch (error) {
    console.error('Failed to fetch tips:', error)
  }
}

// Load more tips
const loadMore = async () => {
  loadingMore.value = true
  await fetchTips(true)
  loadingMore.value = false
}

// Format currency
const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Initial load
onMounted(async () => {
  loading.value = true
  await fetchTips()
  loading.value = false
})

// Watch for band changes
watch(() => props.bandId, async () => {
  loading.value = true
  offset.value = 0
  await fetchTips()
  loading.value = false
})
</script>
