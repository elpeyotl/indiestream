// Subscription store using plain Pinia
import type { Database } from '~/types/database'

// Types
export interface SubscriptionData {
  status: string
  plan: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
}

export interface FreeTierData {
  playsUsed: number
  playsRemaining: number
  resetsAt: string | null
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

export const useSubscriptionStore = defineStore('subscription', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Computed user ID
  const userId = computed(() => user.value?.id || null)

  // Use useState for SSR-safe shared state
  const subscription = useState<SubscriptionData | null>('subscription', () => null)
  const freeTierStatus = useState<FreeTierData | null>('freeTierStatus', () => null)
  const loading = useState<boolean>('subscriptionLoading', () => false)
  const error = useState<string>('subscriptionError', () => '')

  // Cache timestamps (client-only)
  let subscriptionFetchedAt = 0
  let freeTierFetchedAt = 0

  // Check if cache is stale
  const isSubscriptionStale = () => Date.now() - subscriptionFetchedAt > CACHE_TTL
  const isFreeTierStale = () => Date.now() - freeTierFetchedAt > CACHE_TTL

  // Fetch subscription data from Supabase
  const fetchSubscriptionData = async (force = false) => {
    if (import.meta.server) return
    if (!userId.value) {
      subscription.value = null
      return
    }
    if (!force && !isSubscriptionStale() && subscription.value !== null) return

    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('status, plan, current_period_end, cancel_at_period_end, stripe_subscription_id')
        .eq('user_id', userId.value)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine for new users
        throw fetchError
      }

      subscription.value = data as SubscriptionData | null
      subscriptionFetchedAt = Date.now()
    } catch (e: any) {
      console.error('Error fetching subscription:', e)
      error.value = e.message || 'Failed to fetch subscription'
    }
  }

  // Fetch free tier status from API
  const fetchFreeTierData = async (force = false) => {
    if (import.meta.server) return
    if (!userId.value) {
      freeTierStatus.value = null
      return
    }
    if (!force && !isFreeTierStale() && freeTierStatus.value !== null) return

    try {
      const data = await $fetch<{
        playsUsed: number
        playsRemaining: number
        resetsAt: string | null
      }>('/api/free-tier/status')

      freeTierStatus.value = {
        playsUsed: data.playsUsed,
        playsRemaining: data.playsRemaining,
        resetsAt: data.resetsAt,
      }
      freeTierFetchedAt = Date.now()
    } catch (e) {
      console.error('Error fetching free tier status:', e)
      // Default to 5 plays remaining if we can't fetch
      freeTierStatus.value = {
        playsUsed: 0,
        playsRemaining: 5,
        resetsAt: null,
      }
    }
  }

  // Fetch subscription when user logs in, clear when logged out
  watch(userId, async (newUserId, oldUserId) => {
    if (!newUserId) {
      // User logged out - clear state
      subscription.value = null
      freeTierStatus.value = null
      subscriptionFetchedAt = 0
      freeTierFetchedAt = 0
    } else if (newUserId && !oldUserId) {
      // User just logged in - fetch subscription data
      await Promise.all([
        fetchSubscriptionData(true),
        fetchFreeTierData(true),
      ])
    }
  }, { immediate: true })

  // Computed properties
  const isSubscribed = computed(() => {
    if (!subscription.value) return false
    if (!subscription.value.stripe_subscription_id) return false
    return ['active', 'trialing'].includes(subscription.value.status)
  })

  const isFree = computed(() => {
    return !isSubscribed.value
  })

  const canPlayFullTracks = computed(() => {
    if (isSubscribed.value) return true
    if (!freeTierStatus.value) return false
    return freeTierStatus.value.playsRemaining > 0
  })

  const freePlaysRemaining = computed(() => {
    if (isSubscribed.value) return Infinity
    return freeTierStatus.value?.playsRemaining ?? 5
  })

  // Fetch subscription (backward compatible API)
  const fetchSubscription = async (force = false) => {
    if (!user.value) {
      subscription.value = null
      freeTierStatus.value = null
      return
    }

    loading.value = true
    error.value = ''

    try {
      await Promise.all([
        fetchSubscriptionData(force),
        fetchFreeTierData(force),
      ])
    } finally {
      loading.value = false
    }
  }

  // Fetch free tier status (backward compatible API)
  const fetchFreeTierStatus = async () => {
    if (!user.value) {
      freeTierStatus.value = null
      return
    }

    await fetchFreeTierData(true)
  }

  // Use a free play (decrements counter locally)
  const useFreePlays = () => {
    if (freeTierStatus.value && freeTierStatus.value.playsRemaining > 0) {
      freeTierStatus.value = {
        ...freeTierStatus.value,
        playsUsed: freeTierStatus.value.playsUsed + 1,
        playsRemaining: freeTierStatus.value.playsRemaining - 1,
      }
    }
  }

  // Create checkout session and redirect to Stripe
  const startCheckout = async (priceId: string) => {
    loading.value = true
    error.value = ''

    try {
      const { data, error: checkoutError } = await useFetch('/api/stripe/create-checkout', {
        method: 'POST',
        body: { priceId },
      })

      if (checkoutError.value) {
        throw new Error(checkoutError.value.message || 'Failed to create checkout session')
      }

      if (data.value?.url) {
        window.location.href = data.value.url
      }
    } catch (e: any) {
      console.error('Checkout error:', e)
      error.value = e.message
      loading.value = false
    }
  }

  // Open customer portal for subscription management
  const openCustomerPortal = async () => {
    loading.value = true
    error.value = ''

    try {
      const { data, error: portalError } = await useFetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      if (portalError.value) {
        throw new Error(portalError.value.message || 'Failed to open customer portal')
      }

      if (data.value?.url) {
        window.location.href = data.value.url
      }
    } catch (e: any) {
      console.error('Portal error:', e)
      error.value = e.message
      loading.value = false
    }
  }

  return {
    // State
    subscription,
    freeTierStatus,
    loading,
    error,

    // Computed
    isSubscribed,
    isFree,
    canPlayFullTracks,
    freePlaysRemaining,

    // Actions
    fetchSubscription,
    fetchFreeTierStatus,
    useFreePlays,
    startCheckout,
    openCustomerPortal,
  }
})
