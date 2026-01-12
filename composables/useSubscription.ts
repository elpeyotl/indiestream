// Subscription management composable
export const useSubscription = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const config = useRuntimeConfig()

  const subscription = ref<{
    status: string
    plan: string
    current_period_end: string | null
    cancel_at_period_end: boolean
    stripe_subscription_id: string | null
  } | null>(null)

  const loading = ref(false)
  const error = ref('')

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

  // Fetch subscription status
  const fetchSubscription = async () => {
    if (!user.value) {
      subscription.value = null
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
    } catch (e: any) {
      console.error('Error fetching subscription:', e)
      error.value = e.message
    } finally {
      loading.value = false
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

  // Watch for user changes
  watch(user, (newUser) => {
    if (newUser) {
      fetchSubscription()
    } else {
      subscription.value = null
    }
  }, { immediate: true })

  return {
    subscription,
    loading,
    error,
    isSubscribed,
    isFree,
    fetchSubscription,
    startCheckout,
    openCustomerPortal,
  }
}
