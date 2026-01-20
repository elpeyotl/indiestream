<template>
  <div class="py-6 space-y-6">
    <!-- Loading -->
    <div v-if="earningsLoading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Payout Settings Link -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/20">
              <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 class="font-semibold text-zinc-100">Payout Settings</h3>
              <p class="text-sm text-zinc-400">
                Manage your Stripe account and view combined earnings across all your artists.
              </p>
            </div>
          </div>
          <UButton color="violet" variant="outline" to="/dashboard/earnings">
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 mr-1" />
            View All Earnings
          </UButton>
        </div>
      </UCard>

      <!-- Earnings Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-teal-400">{{ formatCurrency(earningsData?.currentBalance || 0) }}</p>
            <p class="text-sm text-zinc-400">Current Balance</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(earningsData?.thisMonthEarnings || 0) }}</p>
            <p class="text-sm text-zinc-400">This Month</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(earningsData?.lifetimeEarnings || 0) }}</p>
            <p class="text-sm text-zinc-400">Lifetime Earnings</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-violet-400">{{ formatNumber(earningsData?.thisMonthStreams || 0) }}</p>
            <p class="text-sm text-zinc-400">Streams This Month</p>
          </div>
        </UCard>
      </div>

      <!-- Payout Info -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-zinc-100 mb-1">Minimum Payout: $10.00</h3>
            <p class="text-sm text-zinc-400">
              Payouts are processed monthly for balances over $10. Your current balance:
              <span class="text-teal-400 font-medium">{{ formatCurrency(earningsData?.currentBalance || 0) }}</span>
            </p>
          </div>
          <div v-if="earningsData?.lastPayoutAt" class="text-right">
            <p class="text-xs text-zinc-500">Last payout</p>
            <p class="text-sm text-zinc-400">{{ formatDate(earningsData.lastPayoutAt) }}</p>
          </div>
        </div>
      </UCard>

      <!-- Payout History -->
      <div>
        <h3 class="text-lg font-semibold text-zinc-100 mb-4">Payout History</h3>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div v-if="!earningsData?.payouts?.length" class="text-center py-8">
            <UIcon name="i-heroicons-banknotes" class="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p class="text-zinc-400">No payouts yet</p>
            <p class="text-sm text-zinc-500">Once your balance reaches $10, payouts will appear here.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-zinc-800">
                  <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Amount</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Transfer ID</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payout in earningsData.payouts" :key="payout.id" class="border-b border-zinc-800/50">
                  <td class="py-3 px-4 text-sm text-zinc-300">{{ formatDate(payout.createdAt) }}</td>
                  <td class="py-3 px-4 text-sm text-teal-400 font-medium">{{ formatCurrency(payout.amount) }}</td>
                  <td class="py-3 px-4">
                    <UBadge
                      :color="payout.status === 'completed' ? 'green' : payout.status === 'failed' ? 'red' : 'yellow'"
                      variant="subtle"
                    >
                      {{ payout.status }}
                    </UBadge>
                  </td>
                  <td class="py-3 px-4 text-sm text-zinc-500 font-mono">
                    {{ payout.stripeTransferId || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <!-- Revenue Model Explanation -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <h3 class="font-semibold text-zinc-100 mb-3">How You Get Paid</h3>
        <div class="space-y-2 text-sm text-zinc-400">
          <p>
            <span class="text-violet-400 font-medium">User-Centric Payouts:</span>
            Each subscriber's $9.99 monthly fee is distributed only to artists they actually listened to.
          </p>
          <p>
            <span class="text-teal-400 font-medium">Transparent Split:</span>
            You receive 70% directly ($6.99). 15% goes to royalty societies (SUISA/GEMA/etc.) for performance rights. 15% platform fee.
          </p>
          <p>
            <span class="text-zinc-300 font-medium">Example:</span>
            If a subscriber spends 50% of their listening time on your music, you receive 50% of $6.99 (~$3.50) from that subscriber.
          </p>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useArtistDashboard } from '~/composables/useArtistDashboard'
import { useArtistRealtime } from '~/composables/useArtistRealtime'

interface EarningsData {
  bandId: string
  bandName: string
  stripeStatus: string
  stripeAccountId: string | null
  currentBalance: number
  lifetimeEarnings: number
  lastPayoutAt: string | null
  thisMonthEarnings: number
  thisMonthStreams: number
  minimumPayout: number
  canRequestPayout: boolean
  payouts: Array<{
    id: string
    amount: number
    status: string
    stripeTransferId: string | null
    createdAt: string
    processedAt: string | null
  }>
}

const props = defineProps<{
  bandId: string
}>()

const { formatNumber, formatCurrency, formatDate } = useArtistDashboard()
const { subscribe } = useArtistRealtime()

// State
const earningsLoading = ref(false)
const earningsData = ref<EarningsData | null>(null)

const loadEarnings = async () => {
  earningsLoading.value = true
  try {
    const data = await $fetch<EarningsData>('/api/artist/earnings', {
      query: { bandId: props.bandId },
    })
    earningsData.value = data
  } catch (e) {
    console.error('Failed to load earnings:', e)
  } finally {
    earningsLoading.value = false
  }
}

onMounted(() => {
  loadEarnings()

  // Subscribe to realtime updates for earnings
  // Streams affect this month's earnings/streams counts
  subscribe({
    table: 'listening_history',
    bandId: props.bandId,
    onUpdate: loadEarnings,
    debounce: 5000, // Debounce 5s since earnings calculations are heavier
  })

  // Payout status changes (processed, failed, etc.)
  subscribe({
    table: 'payouts',
    bandId: props.bandId,
    onUpdate: loadEarnings,
    debounce: 1000,
  })
})
</script>
