// Composable for Stripe Connect artist payout features
export const useStripeConnect = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  interface ConnectStatus {
    status: 'not_connected' | 'pending' | 'active' | 'restricted'
    accountId: string | null
    payoutsEnabled: boolean
    chargesEnabled: boolean
    detailsSubmitted: boolean
    requirements?: string[]
    disabledReason?: string | null
  }

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

  const connectStatus = ref<ConnectStatus | null>(null)
  const earnings = ref<EarningsData | null>(null)

  // Fetch Stripe Connect status for a band
  const fetchConnectStatus = async (bandId: string): Promise<ConnectStatus | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<ConnectStatus>('/api/stripe/connect/status', {
        query: { bandId },
      })
      connectStatus.value = data
      return data
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to fetch status'
      return null
    } finally {
      loading.value = false
    }
  }

  // Create or continue Stripe Connect onboarding
  const startOnboarding = async (bandId: string): Promise<string | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ url?: string; accountId: string; status: string }>('/api/stripe/connect/create-account', {
        method: 'POST',
        body: { bandId },
      })

      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
        return data.url
      }

      // Already connected
      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to start onboarding'
      return null
    } finally {
      loading.value = false
    }
  }

  // Get new account link for incomplete onboarding
  const getAccountLink = async (bandId: string): Promise<string | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ url: string }>('/api/stripe/connect/account-link', {
        method: 'POST',
        body: { bandId },
      })

      if (data.url) {
        window.location.href = data.url
        return data.url
      }

      return null
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to get account link'
      return null
    } finally {
      loading.value = false
    }
  }

  // Fetch earnings data
  const fetchEarnings = async (bandId: string): Promise<EarningsData | null> => {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch<EarningsData>('/api/artist/earnings', {
        query: { bandId },
      })
      earnings.value = data
      return data
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to fetch earnings'
      return null
    } finally {
      loading.value = false
    }
  }

  // Format cents to currency string
  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  // Format seconds to hours/minutes
  const formatListeningTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return {
    loading,
    error,
    connectStatus,
    earnings,
    fetchConnectStatus,
    startOnboarding,
    getAccountLink,
    fetchEarnings,
    formatCurrency,
    formatListeningTime,
  }
}
