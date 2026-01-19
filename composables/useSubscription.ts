// Subscription management composable
// Using global state so subscription status is shared across all components

interface SubscriptionData {
  status: string
  plan: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_subscription_id: string | null
}

interface FreeTierData {
  playsUsed: number
  playsRemaining: number
  resetsAt: string | null
}

// Cache configuration
const SUBSCRIPTION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const useSubscription = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Use useState for SSR-safe shared state
  const subscription = useState<SubscriptionData | null>('subscription', () => null)
  const freeTierStatus = useState<FreeTierData | null>('freeTierStatus', () => null)
  const loading = useState<boolean>('subscriptionLoading', () => false)
  const error = useState<string>('subscriptionError', () => '')
  // Track last fetch time to prevent redundant calls
  const lastFetchTime = useState<number>('subscriptionLastFetch', () => 0)
  const lastUserId = useState<string | null>('subscriptionLastUserId', () => null)

  // Check if user has an active subscription (must have a Stripe subscription ID)
  const isSubscribed = computed(() => {
    if (!subscription.value) return false
    if (!subscription.value.stripe_subscription_id) return false
    return ['active', 'trialing'].includes(subscription.value.status)
  })

  // Check if user is on free tier
  const isFree = computed(() => {
    return !isSubscribed.value
  })

  // Check if user can play full tracks (subscribed OR has free plays remaining)
  const canPlayFullTracks = computed(() => {
    if (isSubscribed.value) return true
    if (!freeTierStatus.value) return false
    return freeTierStatus.value.playsRemaining > 0
  })

  // Free plays remaining (0 if subscribed since they have unlimited)
  const freePlaysRemaining = computed(() => {
    if (isSubscribed.value) return Infinity
    return freeTierStatus.value?.playsRemaining ?? 5
  })

  // Check if we should skip fetching (already have fresh data)
  const shouldSkipFetch = () => {
    if (!user.value) return false
    // Skip if we have data for this user and it's still fresh
    if (
      lastUserId.value === user.value.id &&
      subscription.value !== null &&
      Date.now() - lastFetchTime.value < SUBSCRIPTION_CACHE_TTL
    ) {
      return true
    }
    return false
  }

  // Fetch subscription status
  const fetchSubscription = async (force = false) => {
    if (!user.value) {
      subscription.value = null
      freeTierStatus.value = null
      lastUserId.value = null
      return
    }

    // Skip fetch if we already have fresh data for this user
    if (!force && shouldSkipFetch()) {
      return
    }

    // Prevent concurrent fetches
    if (loading.value) {
      return
    }

    loading.value = true
    error.value = ''

    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('status, plan, current_period_end, cancel_at_period_end, stripe_subscription_id')
        .eq('user_id', user.value.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine for new users
        throw fetchError
      }

      subscription.value = data
      lastFetchTime.value = Date.now()
      lastUserId.value = user.value.id
    } catch (e: any) {
      console.error('Error fetching subscription:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }

    // Also fetch free tier status
    await fetchFreeTierStatus()
  }

  // Fetch free tier status
  const fetchFreeTierStatus = async () => {
    if (!user.value) {
      freeTierStatus.value = null
      return
    }

    try {
      const data = await $fetch('/api/free-tier/status')
      freeTierStatus.value = {
        playsUsed: data.playsUsed,
        playsRemaining: data.playsRemaining,
        resetsAt: data.resetsAt,
      }
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

  // Watch for user changes - only run on client side to avoid SSR auth issues
  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        fetchSubscription()
      } else {
        subscription.value = null
        freeTierStatus.value = null
      }
    }, { immediate: true })
  }

  return {
    subscription,
    freeTierStatus,
    loading,
    error,
    isSubscribed,
    isFree,
    canPlayFullTracks,
    freePlaysRemaining,
    fetchSubscription,
    fetchFreeTierStatus,
    useFreePlays,
    startCheckout,
    openCustomerPortal,
  }
}
