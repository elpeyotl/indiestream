<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-start gap-4 mb-6">
        <!-- Album Cover -->
        <div class="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
          <NuxtImg
            v-if="coverUrl"
            :src="coverUrl"
            :alt="album.title"
            :width="80"
            :height="80"
            format="webp"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-zinc-100 truncate">{{ album.title }}</h3>
          <p class="text-sm text-zinc-400 truncate">{{ artistName }}</p>
          <UBadge color="green" variant="subtle" size="xs" class="mt-2">
            85% to artist
          </UBadge>
        </div>
      </div>

      <!-- Price Display -->
      <div v-if="!showPaymentForm" class="mb-6">
        <div v-if="album.pay_what_you_want" class="space-y-3">
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
        <div v-else class="text-center">
          <div class="text-3xl font-bold text-zinc-100">
            {{ formatPrice(album.price_cents || 0) }}
          </div>
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
        <UIcon v-if="!loading" name="i-heroicons-credit-card" class="w-5 h-5 mr-2" />
        Continue to Payment
      </UButton>

      <!-- Stripe Payment Form -->
      <div v-if="showPaymentForm" class="space-y-4">
        <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
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
            Back
          </UButton>
          <UButton
            color="violet"
            size="lg"
            class="flex-1"
            :loading="processing"
            :disabled="!paymentReady"
            @click="confirmPayment"
          >
            <UIcon v-if="!processing" name="i-heroicons-lock-closed" class="w-4 h-4 mr-2" />
            Pay {{ formatPrice(purchaseAmount) }}
          </UButton>
        </div>

        <!-- Security Note -->
        <p class="text-xs text-zinc-500 text-center">
          <UIcon name="i-heroicons-shield-check" class="w-3 h-3 inline mr-1" />
          Secure payment powered by Stripe
        </p>
      </div>

      <!-- Close button when not in payment -->
      <UButton
        v-if="!showPaymentForm"
        color="gray"
        variant="ghost"
        block
        class="mt-3"
        @click="isOpen = false"
      >
        Cancel
      </UButton>
    </div>
  </USlideover>
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
  artistName: string
  coverUrl?: string | null
}

const props = defineProps<Props>()

const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'purchased'): void
}>()

const config = useRuntimeConfig()
const purchaseStore = usePurchaseStore()
const user = useSupabaseUser()

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

  if (props.album.pay_what_you_want) {
    const price = parseFloat(customPrice.value) * 100
    return price >= minimumPrice.value
  }

  return (props.album.price_cents || 0) >= 100
})

// Initialize custom price with minimum when opening
watch(isOpen, (open) => {
  if (open && props.album.pay_what_you_want) {
    customPrice.value = (minimumPrice.value / 100).toFixed(2)
  }
  if (!open) {
    // Reset state when closing
    resetState()
  }
})

const resetState = () => {
  showPaymentForm.value = false
  paymentReady.value = false
  errorMessage.value = ''
  if (paymentElement) {
    paymentElement.destroy()
    paymentElement = null
  }
  elements = null
  stripe = null
}

// Format price for display
const formatPrice = (cents: number): string => {
  return `CHF ${(cents / 100).toFixed(2)}`
}

// Initialize Stripe and create PaymentIntent
const initiatePurchase = async () => {
  if (!user.value) {
    isOpen.value = false
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
      isOpen.value = false
      emit('purchased')

      // Redirect to success page
      navigateTo(`/purchase/success?album=${props.album.id}`)
    }
  } catch (error: any) {
    console.error('Payment error:', error)
    errorMessage.value = error.message || 'Payment failed'
  } finally {
    processing.value = false
  }
}

// Cancel payment (go back to price view)
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
