<template>
  <div class="py-6 space-y-6">
    <!-- Period Selector -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <h3 class="text-lg font-semibold text-zinc-100 mb-4">Calculate Artist Payouts</h3>
      <div class="flex flex-wrap items-end gap-4">
        <UFormGroup label="Month">
          <USelectMenu
            v-model="payoutMonth"
            :options="monthOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-40"
          />
        </UFormGroup>
        <UFormGroup label="Year">
          <USelectMenu
            v-model="payoutYear"
            :options="yearOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-32"
          />
        </UFormGroup>
        <UButton
          color="violet"
          :loading="calculatingPayouts"
          @click="calculatePayouts"
        >
          <UIcon name="i-heroicons-calculator" class="w-4 h-4 mr-2" />
          Calculate Payouts
        </UButton>
      </div>
      <p class="text-sm text-zinc-500 mt-4">
        This will calculate the user-centric revenue distribution for the selected month. 70% goes to artists, 15% to CMOs (SUISA/GEMA), 15% platform.
      </p>
    </UCard>

    <!-- Calculation Results -->
    <UCard v-if="payoutCalculation" class="bg-zinc-900/50 border-zinc-800">
      <h3 class="text-lg font-semibold text-zinc-100 mb-4">Calculation Results</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
          <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(payoutCalculation.totalRevenue) }}</p>
          <p class="text-sm text-zinc-400">Total Revenue</p>
        </div>
        <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
          <p class="text-2xl font-bold text-teal-400">{{ formatCurrency(payoutCalculation.artistPool) }}</p>
          <p class="text-sm text-zinc-400">Artist Pool (70%)</p>
        </div>
        <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
          <p class="text-2xl font-bold text-violet-400">{{ payoutCalculation.artistsCount }}</p>
          <p class="text-sm text-zinc-400">Artists</p>
        </div>
        <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
          <p class="text-2xl font-bold text-zinc-100">{{ payoutCalculation.subscribersCount }}</p>
          <p class="text-sm text-zinc-400">Subscribers</p>
        </div>
      </div>
    </UCard>

    <!-- Artist Selection for Payouts -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-zinc-100">Select Artists for Payout</h3>
        <UButton
          variant="ghost"
          size="sm"
          :loading="loadingEligible"
          @click="fetchEligibleArtists"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
          Refresh
        </UButton>
      </div>

      <div v-if="loadingEligible" class="py-8 text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin mx-auto mb-2" />
        <p class="text-sm text-zinc-500">Loading eligible artists...</p>
      </div>

      <div v-else-if="eligibleArtists.length === 0" class="py-8 text-center">
        <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p class="text-zinc-400">No artists with positive balance</p>
        <p class="text-sm text-zinc-500">Calculate payouts for a period first, then artists will appear here.</p>
      </div>

      <div v-else>
        <!-- Summary -->
        <div class="flex flex-wrap gap-4 mb-4 p-3 bg-zinc-800/30 rounded-lg">
          <div class="text-sm">
            <span class="text-zinc-400">Total Artists:</span>
            <span class="ml-1 text-zinc-100 font-medium">{{ eligibleArtists.length }}</span>
          </div>
          <div class="text-sm">
            <span class="text-zinc-400">Eligible:</span>
            <span class="ml-1 text-green-400 font-medium">{{ eligibleSummary.eligibleCount }}</span>
          </div>
          <div class="text-sm">
            <span class="text-zinc-400">Selected:</span>
            <span class="ml-1 text-violet-400 font-medium">{{ selectedArtistIds.length }}</span>
          </div>
          <div class="text-sm">
            <span class="text-zinc-400">Selected Amount:</span>
            <span class="ml-1 text-teal-400 font-medium">{{ formatCurrency(selectedTotalAmount) }}</span>
          </div>
        </div>

        <!-- Select All / None -->
        <div class="flex gap-2 mb-3">
          <UButton size="xs" variant="ghost" @click="selectAllEligible">
            Select All Eligible
          </UButton>
          <UButton size="xs" variant="ghost" @click="selectedArtistIds = []">
            Clear Selection
          </UButton>
        </div>

        <!-- Artists Table -->
        <div class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="w-full">
            <thead class="sticky top-0 bg-zinc-900">
              <tr class="border-b border-zinc-800">
                <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400 w-10">
                  <UCheckbox
                    :model-value="selectedArtistIds.length === eligibleArtists.filter(a => a.eligible).length && selectedArtistIds.length > 0"
                    :indeterminate="selectedArtistIds.length > 0 && selectedArtistIds.length < eligibleArtists.filter(a => a.eligible).length"
                    @update:model-value="toggleAllEligible"
                  />
                </th>
                <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">User</th>
                <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Artists</th>
                <th class="text-right py-2 px-3 text-sm font-medium text-zinc-400">Balance</th>
                <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="artist in eligibleArtists"
                :key="artist.userId"
                class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                :class="{ 'opacity-50': !artist.eligible }"
              >
                <td class="py-2 px-3">
                  <UCheckbox
                    :model-value="selectedArtistIds.includes(artist.userId)"
                    :disabled="!artist.eligible"
                    @update:model-value="toggleArtistSelection(artist.userId, $event)"
                  />
                </td>
                <td class="py-2 px-3">
                  <p class="text-sm text-zinc-200">{{ artist.userName }}</p>
                  <p class="text-xs text-zinc-500">{{ artist.email }}</p>
                </td>
                <td class="py-2 px-3">
                  <div class="flex flex-wrap gap-1">
                    <UBadge
                      v-for="band in artist.bands.slice(0, 3)"
                      :key="band.bandId"
                      variant="subtle"
                      color="gray"
                      size="xs"
                    >
                      {{ band.bandName }}
                    </UBadge>
                    <UBadge v-if="artist.bands.length > 3" variant="subtle" color="gray" size="xs">
                      +{{ artist.bands.length - 3 }} more
                    </UBadge>
                  </div>
                </td>
                <td class="py-2 px-3 text-right">
                  <span class="text-sm font-medium" :class="artist.eligible ? 'text-teal-400' : 'text-zinc-400'">
                    {{ formatCurrency(artist.totalBalance) }}
                  </span>
                </td>
                <td class="py-2 px-3">
                  <UBadge
                    :color="artist.eligible ? 'green' : artist.stripeStatus === 'not_connected' ? 'red' : 'yellow'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ artist.reason }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <p class="text-sm text-zinc-500">
            {{ selectedArtistIds.length > 0 ? `${selectedArtistIds.length} user(s) selected` : 'Select artists to pay' }}
          </p>
          <div class="flex gap-2">
            <UButton
              color="green"
              :loading="processingSelectedPayouts"
              :disabled="selectedArtistIds.length === 0 || processingAllPayouts"
              @click="processSelectedPayouts"
            >
              <UIcon name="i-heroicons-banknotes" class="w-4 h-4 mr-2" />
              Pay Selected ({{ formatCurrency(selectedTotalAmount) }})
            </UButton>
            <UButton
              color="violet"
              variant="outline"
              :loading="processingAllPayouts"
              :disabled="eligibleSummary.eligibleCount === 0 || processingSelectedPayouts"
              @click="processPayouts"
            >
              Pay All Eligible ({{ formatCurrency(eligibleSummary.totalEligibleAmount) }})
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Processing Results -->
    <UCard v-if="payoutResults" class="bg-zinc-900/50 border-zinc-800">
      <h3 class="text-lg font-semibold text-zinc-100 mb-4">Payout Results</h3>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p class="text-2xl font-bold text-green-400">{{ payoutResults.processed }}</p>
          <p class="text-sm text-zinc-400">Successful</p>
        </div>
        <div class="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p class="text-2xl font-bold text-red-400">{{ payoutResults.failed }}</p>
          <p class="text-sm text-zinc-400">Failed</p>
        </div>
        <div class="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p class="text-2xl font-bold text-yellow-400">{{ payoutResults.skipped }}</p>
          <p class="text-sm text-zinc-400">Skipped</p>
        </div>
      </div>

      <p class="text-teal-400 font-semibold mb-4">
        Total Paid: {{ formatCurrency(payoutResults.totalAmount) }}
      </p>

      <div v-if="payoutResults.results.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Artist</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Amount</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in payoutResults.results" :key="result.bandId" class="border-b border-zinc-800/50">
              <td class="py-2 px-3 text-sm text-zinc-300">{{ result.bandName }}</td>
              <td class="py-2 px-3 text-sm text-teal-400">{{ formatCurrency(result.amount) }}</td>
              <td class="py-2 px-3">
                <UBadge
                  :color="result.status === 'success' ? 'green' : result.status === 'failed' ? 'red' : 'yellow'"
                  variant="subtle"
                  size="xs"
                >
                  {{ result.status }}
                </UBadge>
              </td>
              <td class="py-2 px-3 text-xs text-zinc-500 font-mono">
                {{ result.transferId || result.error || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Payout History -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-zinc-100">Payout History</h3>
        <UButton
          variant="ghost"
          size="sm"
          :loading="loadingPayoutHistory"
          @click="fetchPayoutHistory"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
          Refresh
        </UButton>
      </div>

      <!-- Totals Summary -->
      <div v-if="payoutHistoryTotals" class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p class="text-lg font-bold text-green-400">{{ formatCurrency(payoutHistoryTotals.paid) }}</p>
          <p class="text-xs text-zinc-400">Total Paid</p>
        </div>
        <div class="text-center p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p class="text-lg font-bold text-yellow-400">{{ formatCurrency(payoutHistoryTotals.pending) }}</p>
          <p class="text-xs text-zinc-400">Pending</p>
        </div>
        <div class="text-center p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p class="text-lg font-bold text-red-400">{{ formatCurrency(payoutHistoryTotals.failed) }}</p>
          <p class="text-xs text-zinc-400">Failed</p>
        </div>
      </div>

      <div v-if="loadingPayoutHistory" class="py-8 text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin mx-auto mb-2" />
        <p class="text-sm text-zinc-500">Loading payout history...</p>
      </div>

      <div v-else-if="payoutHistory.length === 0" class="py-8 text-center">
        <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <p class="text-zinc-400">No payouts processed yet</p>
      </div>

      <div v-else class="overflow-x-auto max-h-80 overflow-y-auto">
        <table class="w-full">
          <thead class="sticky top-0 bg-zinc-900">
            <tr class="border-b border-zinc-800">
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Date</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">User</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Artists</th>
              <th class="text-right py-2 px-3 text-sm font-medium text-zinc-400">Amount</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Transfer ID</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payout in payoutHistory"
              :key="payout.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td class="py-2 px-3 text-sm text-zinc-400">
                {{ formatDate(payout.processedAt || payout.createdAt) }}
              </td>
              <td class="py-2 px-3">
                <p class="text-sm text-zinc-200">{{ payout.user?.name || 'Unknown' }}</p>
                <p class="text-xs text-zinc-500">{{ payout.user?.email || '' }}</p>
              </td>
              <td class="py-2 px-3">
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="band in payout.bands.slice(0, 2)"
                    :key="band.id"
                    variant="subtle"
                    color="gray"
                    size="xs"
                  >
                    {{ band.name }}
                  </UBadge>
                  <UBadge v-if="payout.bands.length > 2" variant="subtle" color="gray" size="xs">
                    +{{ payout.bands.length - 2 }}
                  </UBadge>
                </div>
              </td>
              <td class="py-2 px-3 text-right">
                <span class="text-sm font-medium text-teal-400">
                  {{ formatCurrency(payout.totalAmount) }}
                </span>
              </td>
              <td class="py-2 px-3">
                <UBadge
                  :color="payout.status === 'completed' ? 'green' : payout.status === 'failed' ? 'red' : 'yellow'"
                  variant="subtle"
                  size="xs"
                >
                  {{ payout.status }}
                </UBadge>
              </td>
              <td class="py-2 px-3">
                <span v-if="payout.stripeTransferId" class="text-xs text-zinc-500 font-mono">
                  {{ payout.stripeTransferId.slice(0, 20) }}...
                </span>
                <span v-else-if="payout.errorMessage" class="text-xs text-red-400">
                  {{ payout.errorMessage.slice(0, 30) }}...
                </span>
                <span v-else class="text-xs text-zinc-600">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Info Card -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <h3 class="font-semibold text-zinc-100 mb-3">Payout System Info</h3>
      <div class="space-y-2 text-sm text-zinc-400">
        <p><span class="text-violet-400 font-medium">User-Centric Model:</span> Each subscriber's $9.99 is distributed only to artists they listened to.</p>
        <p><span class="text-teal-400 font-medium">Transparent Split:</span> 70% to artists, 15% to CMOs (SUISA/GEMA/etc.), 15% platform fee.</p>
        <p><span class="text-zinc-300 font-medium">$10 Minimum:</span> Artists need at least $10 balance and a connected Stripe account to receive payouts.</p>
        <p><span class="text-zinc-300 font-medium">Stripe Connect:</span> Artists connect their bank account through Stripe Express onboarding in their dashboard.</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { PayoutCalculationResult, PayoutProcessResult, EligibleArtist, EligibleArtistsResponse, PayoutHistoryItem } from '~/types/admin'
import { monthOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const { toast, formatDate, formatCurrency } = useAdminUtils()

// State
const currentYear = new Date().getFullYear()
const payoutMonth = ref(new Date().getMonth())
const payoutYear = ref(currentYear)

const yearOptions = computed(() => Array.from({ length: 5 }, (_, i) => ({
  label: (currentYear - i).toString(),
  value: currentYear - i,
})))

// Calculation
const calculatingPayouts = ref(false)
const payoutCalculation = ref<PayoutCalculationResult | null>(null)

// Eligible artists
const loadingEligible = ref(false)
const eligibleArtists = ref<EligibleArtist[]>([])
const eligibleSummary = ref({
  eligibleCount: 0,
  totalEligibleAmount: 0,
})
const selectedArtistIds = ref<string[]>([])

const selectedTotalAmount = computed(() => {
  return eligibleArtists.value
    .filter(a => selectedArtistIds.value.includes(a.userId))
    .reduce((sum, a) => sum + a.totalBalance, 0)
})

// Processing
const processingAllPayouts = ref(false)
const processingSelectedPayouts = ref(false)
const payoutResults = ref<PayoutProcessResult | null>(null)

// History
const loadingPayoutHistory = ref(false)
const payoutHistory = ref<PayoutHistoryItem[]>([])
const payoutHistoryTotals = ref<{ paid: number; pending: number; failed: number } | null>(null)

const calculatePayouts = async () => {
  const periodStart = new Date(payoutYear.value, payoutMonth.value, 1)
  const periodEnd = new Date(payoutYear.value, payoutMonth.value + 1, 0)

  calculatingPayouts.value = true
  payoutCalculation.value = null
  payoutResults.value = null

  try {
    const result = await $fetch<PayoutCalculationResult>('/api/admin/calculate-payouts', {
      method: 'POST',
      body: {
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      },
    })

    payoutCalculation.value = result

    toast.add({
      title: 'Payouts Calculated',
      description: `${result.artistsCount} artists have earnings to distribute.`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Calculate payouts error:', e)
    toast.add({
      title: 'Calculation Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    calculatingPayouts.value = false
  }
}

const fetchEligibleArtists = async () => {
  loadingEligible.value = true
  try {
    const result = await $fetch<EligibleArtistsResponse>('/api/admin/payout-eligible')
    eligibleArtists.value = result.users
    eligibleSummary.value = {
      eligibleCount: result.eligibleCount,
      totalEligibleAmount: result.totalEligibleAmount,
    }
    // Clear selection when refreshing
    selectedArtistIds.value = []
  } catch (e: any) {
    console.error('Fetch eligible artists error:', e)
    toast.add({
      title: 'Failed to Load Artists',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    loadingEligible.value = false
  }
}

const toggleArtistSelection = (userId: string, selected: boolean) => {
  if (selected) {
    if (!selectedArtistIds.value.includes(userId)) {
      selectedArtistIds.value.push(userId)
    }
  } else {
    selectedArtistIds.value = selectedArtistIds.value.filter(id => id !== userId)
  }
}

const toggleAllEligible = (selectAll: boolean) => {
  if (selectAll) {
    selectedArtistIds.value = eligibleArtists.value
      .filter(a => a.eligible)
      .map(a => a.userId)
  } else {
    selectedArtistIds.value = []
  }
}

const selectAllEligible = () => {
  selectedArtistIds.value = eligibleArtists.value
    .filter(a => a.eligible)
    .map(a => a.userId)
}

const processPayouts = async () => {
  processingAllPayouts.value = true

  try {
    const result = await $fetch<PayoutProcessResult>('/api/admin/process-payouts', {
      method: 'POST',
      body: {},
    })

    payoutResults.value = result

    if (result.processed > 0) {
      toast.add({
        title: 'Payouts Processed',
        description: `${result.processed} payouts sent, ${result.failed} failed, ${result.skipped} skipped.`,
        color: 'green',
        icon: 'i-heroicons-check-circle',
      })
    } else {
      toast.add({
        title: 'No Payouts Sent',
        description: result.results[0]?.error || 'No artists have connected Stripe accounts with balance >= $10.',
        color: 'yellow',
        icon: 'i-heroicons-information-circle',
      })
    }
  } catch (e: any) {
    console.error('Process payouts error:', e)
    toast.add({
      title: 'Processing Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    processingAllPayouts.value = false
    // Refresh eligible artists after processing
    await fetchEligibleArtists()
  }
}

const processSelectedPayouts = async () => {
  if (selectedArtistIds.value.length === 0) return

  processingSelectedPayouts.value = true

  try {
    const result = await $fetch<PayoutProcessResult>('/api/admin/process-payouts', {
      method: 'POST',
      body: { userIds: selectedArtistIds.value },
    })

    payoutResults.value = result

    if (result.processed > 0) {
      toast.add({
        title: 'Payouts Processed',
        description: `${result.processed} payouts sent, ${result.failed} failed.`,
        color: 'green',
        icon: 'i-heroicons-check-circle',
      })
    } else {
      toast.add({
        title: 'No Payouts Sent',
        description: result.results[0]?.error || 'Selected artists could not be paid.',
        color: 'yellow',
        icon: 'i-heroicons-information-circle',
      })
    }
  } catch (e: any) {
    console.error('Process selected payouts error:', e)
    toast.add({
      title: 'Processing Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    processingSelectedPayouts.value = false
    // Refresh eligible artists after processing
    await fetchEligibleArtists()
  }
}

const fetchPayoutHistory = async () => {
  loadingPayoutHistory.value = true
  try {
    const result = await $fetch<{
      payouts: PayoutHistoryItem[]
      totals: { paid: number; pending: number; failed: number }
    }>('/api/admin/payout-history')
    payoutHistory.value = result.payouts
    payoutHistoryTotals.value = result.totals
  } catch (e: any) {
    console.error('Fetch payout history error:', e)
    toast.add({
      title: 'Failed to Load History',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    loadingPayoutHistory.value = false
  }
}

onMounted(() => {
  fetchEligibleArtists()
  fetchPayoutHistory()
})
</script>
