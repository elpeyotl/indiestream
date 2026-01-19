<template>
  <div class="py-6 space-y-6">
    <!-- Loading State -->
    <div v-if="revenueLoading" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <template v-else-if="revenueStats">
      <!-- Key Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-3xl font-bold text-emerald-400">${{ formatCents(revenueStats.monthlyRecurringRevenue) }}</p>
            <p class="text-sm text-zinc-400">Monthly Revenue</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-3xl font-bold text-violet-400">${{ formatCents(revenueStats.totalPaidOut) }}</p>
            <p class="text-sm text-zinc-400">Total Paid Out</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-3xl font-bold text-amber-400">${{ formatCents(revenueStats.pendingBalance) }}</p>
            <p class="text-sm text-zinc-400">Pending Balance</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-3xl font-bold text-teal-400">${{ formatCents(revenueStats.platformFee) }}</p>
            <p class="text-sm text-zinc-400">Platform Fee (15%)</p>
          </div>
        </UCard>
      </div>

      <!-- Charts Row -->
      <div class="grid md:grid-cols-3 gap-6">
        <!-- Revenue Trend Chart -->
        <UCard class="bg-zinc-900/50 border-zinc-800 md:col-span-2">
          <template #header>
            <h3 class="text-lg font-semibold text-zinc-100">Revenue Trend</h3>
          </template>
          <div class="h-[300px]">
            <AdminRevenueLineChart :data="revenueStats.monthlyTrend" />
          </div>
        </UCard>

        <!-- Revenue Split Chart -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <h3 class="text-lg font-semibold text-zinc-100">Revenue Split</h3>
          </template>
          <div class="h-[300px]">
            <AdminRevenuePieChart :total-revenue="revenueStats.monthlyRecurringRevenue" />
          </div>
        </UCard>
      </div>

      <!-- Subscriber Metrics -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h3 class="text-lg font-semibold text-zinc-100">Subscriber Metrics</h3>
        </template>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
            <p class="text-2xl font-bold text-green-400">{{ revenueStats.subscribers.active }}</p>
            <p class="text-sm text-zinc-400">Active</p>
          </div>
          <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
            <p class="text-2xl font-bold text-blue-400">{{ revenueStats.subscribers.trialing }}</p>
            <p class="text-sm text-zinc-400">Trialing</p>
          </div>
          <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
            <p class="text-2xl font-bold text-zinc-400">{{ revenueStats.subscribers.canceled }}</p>
            <p class="text-sm text-zinc-400">Canceled</p>
          </div>
          <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
            <p class="text-2xl font-bold text-amber-400">{{ revenueStats.subscribers.pastDue }}</p>
            <p class="text-sm text-zinc-400">Past Due</p>
          </div>
          <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
            <p class="text-2xl font-bold text-zinc-100">{{ revenueStats.subscribers.total }}</p>
            <p class="text-sm text-zinc-400">Total Active</p>
          </div>
        </div>
      </UCard>

      <!-- Growth Charts Row -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Subscriber Growth Chart -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <h3 class="text-lg font-semibold text-zinc-100">Subscriber Growth</h3>
          </template>
          <div class="h-[300px]">
            <AdminSubscriberGrowthChart :data="revenueStats.subscriberGrowth" />
          </div>
        </UCard>

        <!-- Artist Growth Chart -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <h3 class="text-lg font-semibold text-zinc-100">Artist Growth</h3>
          </template>
          <div class="h-[300px]">
            <AdminArtistGrowthChart :data="revenueStats.artistGrowth" />
          </div>
        </UCard>
      </div>

      <!-- Top Earning Artists -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h3 class="text-lg font-semibold text-zinc-100">Top Earning Artists (Lifetime)</h3>
        </template>
        <div v-if="revenueStats.topArtists.length === 0" class="py-8 text-center text-zinc-500">
          No artist earnings yet
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(artist, index) in revenueStats.topArtists"
            :key="artist.bandId"
            class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg font-bold text-zinc-500 w-6">{{ index + 1 }}</span>
              <div>
                <p class="font-medium text-zinc-100">{{ artist.name }}</p>
                <p class="text-sm text-zinc-500">
                  Current balance: ${{ formatCents(artist.balance) }}
                  <span v-if="artist.lifetime > artist.balance" class="text-emerald-500">
                    (paid out: ${{ formatCents(artist.lifetime - artist.balance) }})
                  </span>
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-violet-400">${{ formatCents(artist.lifetime) }}</p>
              <div class="w-24 bg-zinc-700 rounded-full h-2 mt-1">
                <div
                  class="bg-violet-500 h-2 rounded-full"
                  :style="{ width: `${Math.min(100, (artist.lifetime / (revenueStats.topArtists[0]?.lifetime || 1)) * 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- No Data State -->
    <div v-else class="py-12 text-center">
      <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 text-zinc-600 mx-auto mb-4" />
      <p class="text-zinc-400">No revenue data available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RevenueStats } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const { toast, formatCents } = useAdminUtils()

// State
const revenueStats = ref<RevenueStats | null>(null)
const revenueLoading = ref(false)

const fetchRevenueStats = async () => {
  revenueLoading.value = true
  try {
    revenueStats.value = await $fetch<RevenueStats>('/api/admin/revenue-stats')
  } catch (e: any) {
    console.error('Fetch revenue stats error:', e)
    toast.add({
      title: 'Failed to Load Revenue Stats',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    revenueLoading.value = false
  }
}

onMounted(() => {
  fetchRevenueStats()
})
</script>
