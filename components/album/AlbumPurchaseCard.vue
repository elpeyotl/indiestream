<template>
  <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-zinc-100">Buy this album</h3>
      <UBadge color="green" variant="subtle">
        85% to artist
      </UBadge>
    </div>

    <!-- Price Display -->
    <div v-if="!showPaymentForm" class="mb-6">
      <div v-if="album.pay_what_you_want" class="space-y-4">
        <p class="text-sm text-zinc-400">
          Name your price (minimum {{ formatPrice(minimumPrice) }})
        </p>
        <div class="flex items-center gap-2">
          <span class="text-zinc-400">CHF</span>
          <UInput
            v-model="customPrice"
            type="number"
            :min="minimumPrice / 100"
            step="0.50"
            size="lg"
            class="w-32"
            :ui="{ base: 'text-xl font-bold text-center' }"
          />
        </div>
      </div>
      <div v-else class="text-3xl font-bold text-zinc-100">
        {{ formatPrice(album.price_cents || 0) }}
      </div>
    </div>

    <!-- Purchase Button (initial state) -->
    <UButton
      v-if="!showPaymentForm"
      color="violet"
      size="lg"
      block
      :loading="loading"
      :disabled="!canPurchase"
      @click="initiatePurchase"
    >
      <UIcon name="i-heroicons-credit-card" class="w-5 h-5 mr-2" />
      Buy Now
    </UButton>

    <!-- Stripe Payment Form -->
    <div v-if="showPaymentForm" class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-zinc-400">Total</span>
        <span class="text-lg font-semibold text-zinc-100">
          {{ formatPrice(purchaseAmount) }}
        </span>
      </div>

      <!-- Stripe Elements Container -->
      <div
        ref="paymentElementRef"
        class="p-4 bg-zinc-950 rounded-lg border border-zinc-800"
      />

      <!-- Error Message -->
      <p v-if="errorMessage" class="text-sm text-red-400">
        {{ errorMessage }}
      </p>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <UButton
          color="gray"
          variant="outline"
          size="lg"
          :disabled="processing"
          @click="cancelPayment"
        >
          Cancel
        </UButton>
        <UButton
          color="violet"
          size="lg"
          class="flex-1"
          :loading="processing"
          :disabled="!paymentReady"
          @click="confirmPayment"
        >
          <UIcon name="i-heroicons-lock-closed" class="w-4 h-4 mr-2" />
          Pay {{ formatPrice(purchaseAmount) }}
        </UButton>
      </div>

      <!-- Security Note -->
      <p class="text-xs text-zinc-500 text-center">
        <UIcon name="i-heroicons-shield-check" class="w-3 h-3 inline mr-1" />
        Secure payment powered by Stripe
      </p>
    </div>

    <!-- Already Owned State -->
    <div v-if="owned" class="text-center py-4">
      <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-500 mx-auto mb-2" />
      <p class="text-zinc-100 font-medium">You own this album</p>
      <p class="text-sm text-zinc-400 mt-1">Download in FLAC or AAC format anytime</p>
      <NuxtLink
        to="/library/purchases"
        class="mt-3 inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm"
      >
        <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
        Go to downloads
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadStripe, type Stripe, type StripeElements, type StripePaymentElement, type StripePaymentElementChangeEvent } from '@stripe/stripe-js'

interface Props {
  album: {
    id: string
    title: string
    price_cents: number | null
    pay_what_you_want: boolean | null
    minimum_price_cents: number | null
  }
  owned?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  owned: false,
})

const emit = defineEmits<{
  (e: 'purchased'): void
}>()

const config = useRuntimeConfig()
const purchaseStore = usePurchaseStore()
const user = useSupabaseUser()
const toast = useToast()

// State
const showPaymentForm = ref(false)
const loading = ref(false)
const processing = ref(false)
const paymentReady = ref(false)
const errorMessage = ref('')
const customPrice = ref('')
const purchaseAmount = ref(0)

// Stripe refs
const paymentElementRef = ref<HTMLElement | null>(null)
let stripe: Stripe | null = null
let elements: StripeElements | null = null
let paymentElement: StripePaymentElement | null = null

// Computed
const minimumPrice = computed(() => {
  if (props.album.pay_what_you_want) {
    return props.album.minimum_price_cents || 100
  }
  return props.album.price_cents || 0
})

const canPurchase = computed(() => {
  if (!user.value) return false
  if (props.owned) return false

  if (props.album.pay_what_you_want) {
    const price = parseFloat(customPrice.value) * 100
    return price >= minimumPrice.value
  }

  return (props.album.price_cents || 0) >= 100
})

// Initialize custom price with minimum
onMounted(() => {
  if (props.album.pay_what_you_want) {
    customPrice.value = (minimumPrice.value / 100).toFixed(2)
  }
})

// Format price for display
const formatPrice = (cents: number): string => {
  return `CHF ${(cents / 100).toFixed(2)}`
}

// Initialize Stripe and create PaymentIntent
const initiatePurchase = async () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    // Calculate amount
    let amountCents: number | undefined
    if (props.album.pay_what_you_want) {
      amountCents = Math.round(parseFloat(customPrice.value) * 100)
    }

    // Create PaymentIntent
    const { clientSecret, amount } = await purchaseStore.createPurchase(
      props.album.id,
      amountCents
    )

    purchaseAmount.value = amount

    // Load Stripe
    stripe = await loadStripe(config.public.stripePublishableKey)
    if (!stripe) {
      throw new Error('Failed to load Stripe')
    }

    // Create Elements
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#09090b',
          colorText: '#f4f4f5',
          colorDanger: '#ef4444',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    })

    // Show payment form
    showPaymentForm.value = true

    // Mount Payment Element after DOM update
    await nextTick()

    if (paymentElementRef.value) {
      paymentElement = elements.create('payment', {
        layout: 'tabs',
      })
      paymentElement.mount(paymentElementRef.value)

      paymentElement.on('ready', () => {
        paymentReady.value = true
      })

      paymentElement.on('change', (event: StripePaymentElementChangeEvent) => {
        if (event.complete) {
          errorMessage.value = ''
        }
      })
    }
  } catch (error: any) {
    console.error('Failed to initiate purchase:', error)
    errorMessage.value = error.data?.message || error.message || 'Failed to start purchase'
  } finally {
    loading.value = false
  }
}

// Confirm payment
const confirmPayment = async () => {
  if (!stripe || !elements) return

  processing.value = true
  errorMessage.value = ''

  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?purchased=true`,
      },
      redirect: 'if_required',
    })

    if (error) {
      errorMessage.value = error.message || 'Payment failed'
    } else if (paymentIntent?.status === 'succeeded') {
      // Payment successful
      purchaseStore.markPurchaseComplete(props.album.id)
      showPaymentForm.value = false
      emit('purchased')

      // Show success toast with link to downloads
      toast.add({
        title: 'Purchase successful!',
        description: 'Your album is ready to download.',
        icon: 'i-heroicons-check-circle',
        color: 'green',
        timeout: 8000,
        actions: [{
          label: 'Go to downloads',
          click: () => navigateTo('/library/purchases'),
        }],
      })
    }
  } catch (error: any) {
    console.error('Payment error:', error)
    errorMessage.value = error.message || 'Payment failed'
  } finally {
    processing.value = false
  }
}

// Cancel payment
const cancelPayment = () => {
  if (paymentElement) {
    paymentElement.destroy()
    paymentElement = null
  }
  elements = null
  stripe = null
  showPaymentForm.value = false
  paymentReady.value = false
  errorMessage.value = ''
}

// Cleanup on unmount
onUnmounted(() => {
  if (paymentElement) {
    paymentElement.destroy()
  }
})
</script>
