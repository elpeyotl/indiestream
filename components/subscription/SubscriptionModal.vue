<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-md' }">
    <div class="p-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-violet-400" />
        </div>
        <h3 class="text-xl font-semibold text-zinc-100">Start your subscription</h3>
        <p class="text-sm text-zinc-400 mt-1">Unlimited streaming, 85% to artists</p>
      </div>

      <!-- Plan Summary -->
      <div v-if="!showPaymentForm" class="mb-6">
        <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
          <div class="flex items-center justify-between mb-3">
            <span class="text-zinc-300 font-medium">Listener Plan</span>
            <UBadge color="violet" variant="subtle" size="xs">7-day free trial</UBadge>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-bold text-zinc-100">$9.99</span>
            <span class="text-zinc-500">/month</span>
          </div>
          <p class="text-sm text-zinc-500 mt-2">after trial ends</p>
        </div>

        <!-- Features -->
        <ul class="mt-4 space-y-2">
          <li class="flex items-center gap-2 text-sm text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 shrink-0" />
            Unlimited streaming
          </li>
          <li class="flex items-center gap-2 text-sm text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 shrink-0" />
            High quality audio
          </li>
          <li class="flex items-center gap-2 text-sm text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 shrink-0" />
            85% goes directly to artists
          </li>
          <li class="flex items-center gap-2 text-sm text-zinc-300">
            <UIcon name="i-heroicons-check" class="w-4 h-4 text-teal-500 shrink-0" />
            Cancel anytime
          </li>
        </ul>
      </div>

      <!-- Continue Button (initial state) -->
      <UButton
        v-if="!showPaymentForm"
        color="violet"
        size="lg"
        block
        :loading="loading"
        @click="initiateSubscription"
      >
        <UIcon v-if="!loading" name="i-heroicons-credit-card" class="w-5 h-5 mr-2" />
        Continue to Payment
      </UButton>

      <!-- Stripe Payment Form -->
      <div v-if="showPaymentForm" class="space-y-4">
        <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div>
            <span class="text-sm text-zinc-400">7-day free trial, then</span>
            <p class="text-lg font-semibold text-zinc-100">$9.99/month</p>
          </div>
          <UBadge color="green" variant="subtle">
            Free for 7 days
          </UBadge>
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
            Start Free Trial
          </UButton>
        </div>

        <!-- Security Note -->
        <p class="text-xs text-zinc-500 text-center">
          <UIcon name="i-heroicons-shield-check" class="w-3 h-3 inline mr-1" />
          Secure payment powered by Stripe. Cancel anytime.
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
  priceId: string
}

const props = defineProps<Props>()

const isOpen = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'subscribed'): void
}>()

const config = useRuntimeConfig()
const subscriptionStore = useSubscriptionStore()
const user = useSupabaseUser()

// State
const showPaymentForm = ref(false)
const loading = ref(false)
const processing = ref(false)
const paymentReady = ref(false)
const errorMessage = ref('')
const subscriptionId = ref<string | null>(null)
const isSetupIntent = ref(false) // true for trials, false for immediate charges

// Stripe refs
const paymentElementRef = ref<HTMLElement | null>(null)
let stripe: Stripe | null = null
let elements: StripeElements | null = null
let paymentElement: StripePaymentElement | null = null

// Reset state when modal closes
watch(isOpen, (open) => {
  if (!open) {
    resetState()
  }
})

const resetState = () => {
  showPaymentForm.value = false
  paymentReady.value = false
  errorMessage.value = ''
  subscriptionId.value = null
  isSetupIntent.value = false
  if (paymentElement) {
    paymentElement.destroy()
    paymentElement = null
  }
  elements = null
  stripe = null
}

// Initialize Stripe and create subscription
const initiateSubscription = async () => {
  if (!user.value) {
    isOpen.value = false
    navigateTo('/login')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    // Create incomplete subscription
    const { clientSecret, subscriptionId: subId } = await $fetch<{
      subscriptionId: string
      clientSecret: string
      trialEnd: number | null
    }>('/api/stripe/create-subscription', {
      method: 'POST',
      body: { priceId: props.priceId },
    })

    subscriptionId.value = subId

    // Detect if this is a SetupIntent (for trials) or PaymentIntent
    // SetupIntent secrets start with 'seti_', PaymentIntent secrets start with 'pi_'
    isSetupIntent.value = clientSecret.startsWith('seti_')

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
    console.error('Failed to initiate subscription:', error)
    errorMessage.value = error.data?.message || error.message || 'Failed to start subscription'
  } finally {
    loading.value = false
  }
}

// Confirm payment or setup
const confirmPayment = async () => {
  if (!stripe || !elements) return

  processing.value = true
  errorMessage.value = ''

  try {
    // For trials, we use confirmSetup (SetupIntent) since first charge is $0
    // For immediate charges, we use confirmPayment (PaymentIntent)
    if (isSetupIntent.value) {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        errorMessage.value = error.message || 'Setup failed'
      } else if (setupIntent?.status === 'succeeded') {
        // Setup successful - trial started
        isOpen.value = false
        emit('subscribed')

        // Refresh subscription status and redirect to success page
        await subscriptionStore.fetchSubscription()
        navigateTo('/subscription/success')
      }
    } else {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        errorMessage.value = error.message || 'Payment failed'
      } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
        // Payment successful
        isOpen.value = false
        emit('subscribed')

        // Refresh subscription status and redirect to success page
        await subscriptionStore.fetchSubscription()
        navigateTo('/subscription/success')
      }
    }
  } catch (error: any) {
    console.error('Payment error:', error)
    errorMessage.value = error.message || 'Payment failed'
  } finally {
    processing.value = false
  }
}

// Cancel payment (go back to plan view)
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
