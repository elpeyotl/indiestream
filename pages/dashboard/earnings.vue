<template>
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <DashboardPageHeader
      title="Earnings & Payouts"
      description="Combined earnings across all your artists"
    />

    <LoadingSpinner v-if="loading" />

    <template v-else-if="earnings">
      <!-- Stripe Connect Status -->
      <UCard class="bg-zinc-900/50 border-zinc-800 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="{
                'bg-green-500/20': earnings.stripeStatus === 'active',
                'bg-yellow-500/20': earnings.stripeStatus === 'pending',
                'bg-zinc-800': earnings.stripeStatus === 'not_connected',
                'bg-red-500/20': earnings.stripeStatus === 'restricted',
              }"
            >
              <UIcon
                :name="earnings.stripeStatus === 'active' ? 'i-heroicons-check-circle' : earnings.stripeStatus === 'pending' ? 'i-heroicons-clock' : 'i-heroicons-credit-card'"
                class="w-6 h-6"
                :class="{
                  'text-green-400': earnings.stripeStatus === 'active',
                  'text-yellow-400': earnings.stripeStatus === 'pending',
                  'text-zinc-400': earnings.stripeStatus === 'not_connected',
                  'text-red-400': earnings.stripeStatus === 'restricted',
                }"
              />
            </div>
            <div>
              <h3 class="font-semibold text-zinc-100">
                {{ earnings.stripeStatus === 'active' ? 'Payouts Enabled' : earnings.stripeStatus === 'pending' ? 'Setup Incomplete' : 'Connect Stripe' }}
              </h3>
              <p class="text-sm text-zinc-400">
                <template v-if="earnings.stripeStatus === 'active'">
                  Your Stripe account is connected. Payouts are sent to all your artists from this single account.
                </template>
                <template v-else-if="earnings.stripeStatus === 'pending'">
                  Complete your Stripe account setup to start receiving payouts.
                </template>
                <template v-else-if="earnings.stripeStatus === 'restricted'">
                  Your account needs attention. Please update your Stripe information.
                </template>
                <template v-else>
                  Connect with Stripe to receive earnings from all your artists. You receive 70% of streaming revenue directly.
                </template>
              </p>
            </div>
          </div>
          <UButton
            v-if="earnings.stripeStatus !== 'active'"
            color="violet"
            :loading="connectLoading"
            @click="handleStripeConnect"
          >
            {{ earnings.stripeStatus === 'pending' ? 'Complete Setup' : 'Set Up Payouts' }}
          </UButton>
        </div>
      </UCard>

      <!-- Combined Earnings Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-teal-400">{{ formatCurrency(earnings.totalBalance) }}</p>
            <p class="text-sm text-zinc-400">Total Balance</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(earnings.thisMonthEarnings) }}</p>
            <p class="text-sm text-zinc-400">This Month</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(earnings.totalLifetimeEarnings) }}</p>
            <p class="text-sm text-zinc-400">Lifetime Earnings</p>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center">
            <p class="text-2xl font-bold text-violet-400">{{ formatNumber(earnings.thisMonthStreams) }}</p>
            <p class="text-sm text-zinc-400">Streams This Month</p>
          </div>
        </UCard>
      </div>

      <!-- Payout Info -->
      <UCard class="bg-zinc-900/50 border-zinc-800 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-zinc-100 mb-1">Minimum Payout: $10.00</h3>
            <p class="text-sm text-zinc-400">
              Payouts are processed monthly for combined balances over $10. Your total balance:
              <span class="text-teal-400 font-medium">{{ formatCurrency(earnings.totalBalance) }}</span>
              <span v-if="earnings.canRequestPayout" class="ml-2 text-green-400">(Eligible for payout)</span>
              <span v-else-if="earnings.stripeStatus !== 'active'" class="ml-2 text-yellow-400">(Connect Stripe first)</span>
            </p>
          </div>
        </div>
      </UCard>

      <!-- Per-Artist Breakdown -->
      <UCard class="bg-zinc-900/50 border-zinc-800 mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-zinc-100">Earnings by Artist</h2>
            <span class="text-sm text-zinc-400">{{ earnings.bandCount }} artist{{ earnings.bandCount !== 1 ? 's' : '' }}</span>
          </div>
        </template>

        <div v-if="earnings.bands.length === 0" class="text-center py-8 text-zinc-400">
          <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-4 text-zinc-600" />
          <p>No artists yet. Create an artist profile to start earning.</p>
          <UButton color="violet" to="/dashboard/artist/new" class="mt-4">
            Create Artist Profile
          </UButton>
        </div>

        <div v-else class="divide-y divide-zinc-800">
          <div
            v-for="band in earnings.bands"
            :key="band.id"
            class="py-4 first:pt-0 last:pb-0"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <NuxtLink :to="`/dashboard/artist/${band.id}`" class="font-medium text-zinc-100 hover:text-violet-400 transition-colors">
                  {{ band.name }}
                </NuxtLink>
                <span class="text-sm text-zinc-500">{{ formatNumber(band.totalStreams) }} streams</span>
              </div>
              <div class="flex items-center gap-6 text-right">
                <div>
                  <p class="text-sm text-zinc-400">Balance</p>
                  <p class="font-medium text-teal-400">{{ formatCurrency(band.currentBalance) }}</p>
                </div>
                <div>
                  <p class="text-sm text-zinc-400">Lifetime</p>
                  <p class="font-medium text-zinc-100">{{ formatCurrency(band.lifetimeEarnings) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Payout History -->
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Payout History</h2>
        </template>

        <div v-if="earnings.payouts.length === 0" class="text-center py-8 text-zinc-400">
          <UIcon name="i-heroicons-banknotes" class="w-12 h-12 mx-auto mb-4 text-zinc-600" />
          <p>No payouts yet. Payouts are processed monthly once your balance reaches $10.</p>
        </div>

        <div v-else class="divide-y divide-zinc-800">
          <div
            v-for="payout in earnings.payouts"
            :key="payout.id"
            class="py-4 first:pt-0 last:pb-0 flex items-center justify-between"
          >
            <div>
              <p class="font-medium text-zinc-100">{{ formatCurrency(payout.amount) }}</p>
              <p class="text-sm text-zinc-400">
                {{ payout.bands.join(', ') }}
              </p>
            </div>
            <div class="text-right">
              <UBadge
                :color="payout.status === 'completed' ? 'green' : payout.status === 'failed' ? 'red' : 'yellow'"
                variant="subtle"
              >
                {{ payout.status }}
              </UBadge>
              <p class="text-xs text-zinc-500 mt-1">{{ formatDate(payout.processedAt || payout.createdAt) }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- No bands state -->
    <div v-else class="text-center py-20">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-banknotes" class="w-10 h-10 text-violet-400" />
      </div>
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">No Earnings Yet</h2>
      <p class="text-zinc-400 mb-6">Create an artist profile and upload music to start earning.</p>
      <UButton color="violet" to="/dashboard/artist/new">
        Create Artist Profile
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { fetchUserEarnings, startOnboarding, getAccountLink, formatCurrency } = useStripeConnect()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const connectLoading = ref(false)

interface BandEarnings {
  id: string
  name: string
  slug: string
  totalStreams: number
  currentBalance: number
  lifetimeEarnings: number
  lastPayoutAt: string | null
}

interface UserEarningsData {
  stripeStatus: string
  stripeAccountId: string | null
  stripeOnboardingComplete: boolean
  totalBalance: number
  totalLifetimeEarnings: number
  thisMonthEarnings: number
  thisMonthStreams: number
  minimumPayout: number
  canRequestPayout: boolean
  bandCount: number
  bands: BandEarnings[]
  payouts: Array<{
    id: string
    amount: number
    status: string
    stripeTransferId: string | null
    createdAt: string
    processedAt: string | null
    bands: string[]
  }>
}

const earnings = ref<UserEarningsData | null>(null)

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const loadEarnings = async () => {
  loading.value = true
  try {
    earnings.value = await fetchUserEarnings()
  } catch (e) {
    console.error('Failed to load earnings:', e)
  } finally {
    loading.value = false
  }
}

const handleStripeConnect = async () => {
  connectLoading.value = true
  try {
    if (earnings.value?.stripeStatus === 'pending') {
      await getAccountLink()
    } else {
      await startOnboarding()
    }
  } catch (e: any) {
    console.error('Stripe connect error:', e)
    toast.add({
      title: 'Connection Failed',
      description: e.data?.message || 'Failed to start Stripe onboarding',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    })
  } finally {
    connectLoading.value = false
  }
}

// Handle return from Stripe
onMounted(async () => {
  await loadEarnings()

  if (route.query.connected === 'true') {
    toast.add({
      title: 'Stripe Connected',
      description: 'Your account is being verified. This may take a few minutes.',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
    router.replace({ query: { ...route.query, connected: undefined } })
  }

  if (route.query.refresh === 'true') {
    toast.add({
      title: 'Session Expired',
      description: 'Please try setting up your payout account again.',
      icon: 'i-heroicons-information-circle',
      color: 'amber',
    })
    router.replace({ query: { ...route.query, refresh: undefined } })
  }
})
</script>
