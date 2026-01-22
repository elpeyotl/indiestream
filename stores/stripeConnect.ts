// Stripe Connect store using plain Pinia

// Types
export interface ConnectStatus {
  status: 'not_connected' | 'pending' | 'active' | 'restricted'
  accountId: string | null
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements?: string[]
  disabledReason?: string | null
}

export interface BandEarnings {
  id: string
  name: string
  slug: string
  totalStreams: number
  currentBalance: number
  lifetimeEarnings: number
  lastPayoutAt: string | null
}

export interface UserEarningsData {
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

export interface BandEarningsData {
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
  earningsByPeriod: Array<{
    id: string
    streamCount: number
    listeningSeconds: number
    grossEarnings: number
    netEarnings: number
    payoutStatus: string
    createdAt: string
    periodStart: string | null
    periodEnd: string | null
  }>
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

export const useStripeConnectStore = defineStore('stripeConnect', () => {
  const user = useSupabaseUser()

  // Computed user ID
  const userId = computed(() => user.value?.id || null)

  // State
  const connectStatus = ref<ConnectStatus | null>(null)
  const userEarnings = ref<UserEarningsData | null>(null)
  const bandEarnings = ref<BandEarningsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Cache timestamp
  let connectStatusFetchedAt = 0

  // Check if cache is stale
  const isConnectStatusStale = () => Date.now() - connectStatusFetchedAt > CACHE_TTL

  // Fetch connect status
  const fetchConnectStatus = async (force = false): Promise<ConnectStatus | null> => {
    if (import.meta.server) return null
    if (!userId.value) return null
    if (!force && !isConnectStatusStale() && connectStatus.value !== null) {
      return connectStatus.value
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<ConnectStatus>('/api/stripe/connect/status')
      connectStatus.value = data
      connectStatusFetchedAt = Date.now()
      return data
    } catch (e: any) {
      console.error('Failed to fetch connect status:', e)
      error.value = e.message || 'Failed to fetch connect status'
      return null
    } finally {
      loading.value = false
    }
  }

  // Start onboarding (create account or continue)
  const startOnboarding = async (): Promise<string | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ url?: string; accountId: string; status: string }>('/api/stripe/connect/create-account', {
        method: 'POST',
      })

      // Invalidate cache
      connectStatusFetchedAt = 0

      if (data.url) {
        window.location.href = data.url
        return data.url
      }

      // Already connected
      return null
    } catch (e: any) {
      console.error('Failed to start onboarding:', e)
      error.value = e.message || 'Failed to start onboarding'
      return null
    } finally {
      loading.value = false
    }
  }

  // Get account link for incomplete onboarding
  const getAccountLink = async (): Promise<string | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ url: string }>('/api/stripe/connect/account-link', {
        method: 'POST',
      })

      if (data.url) {
        window.location.href = data.url
        return data.url
      }

      return null
    } catch (e: any) {
      console.error('Failed to get account link:', e)
      error.value = e.message || 'Failed to get account link'
      return null
    } finally {
      loading.value = false
    }
  }

  // Fetch user earnings
  const fetchUserEarnings = async (): Promise<UserEarningsData | null> => {
    if (import.meta.server) return null

    try {
      const data = await $fetch<UserEarningsData>('/api/user/earnings')
      userEarnings.value = data
      return data
    } catch (e: any) {
      console.error('Failed to fetch earnings:', e)
      return null
    }
  }

  // Fetch band earnings
  const fetchBandEarnings = async (bandId: string): Promise<BandEarningsData | null> => {
    if (import.meta.server) return null

    try {
      const data = await $fetch<BandEarningsData>('/api/artist/earnings', {
        query: { bandId },
      })
      bandEarnings.value = data
      return data
    } catch (e: any) {
      console.error('Failed to fetch band earnings:', e)
      return null
    }
  }

  // Helper functions
  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatListeningTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return {
    // State
    loading,
    error,
    connectStatus,
    userEarnings,
    bandEarnings,

    // Actions
    fetchConnectStatus,
    startOnboarding,
    getAccountLink,
    fetchUserEarnings,
    fetchBandEarnings,

    // Helpers
    formatCurrency,
    formatListeningTime,
  }
})
