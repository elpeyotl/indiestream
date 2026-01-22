<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-400" />
      </div>

      <h1 class="text-3xl font-bold text-zinc-100 mb-4">Welcome to Fairtune!</h1>

      <p class="text-zinc-400 mb-8">
        Your subscription is now active. You have full access to unlimited streaming
        and your listens will directly support the artists you love.
      </p>

      <div class="bg-zinc-900/50 rounded-xl p-6 mb-8 border border-zinc-800">
        <div class="flex items-center justify-center gap-3 mb-4">
          <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
          <span class="text-zinc-100 font-semibold">Your 7-day free trial has started</span>
        </div>
        <p class="text-zinc-500 text-sm">
          You won't be charged until your trial ends. Cancel anytime.
        </p>
      </div>

      <div class="space-y-3">
        <UButton color="violet" size="lg" block to="/discover">
          Start Discovering Music
        </UButton>
        <UButton color="gray" variant="ghost" size="lg" block to="/dashboard">
          Go to Dashboard
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Subscription Activated | Fairtune',
})

// Refresh subscription status with retry (webhook may not have processed yet)
import { storeToRefs } from 'pinia'

const subscriptionStore = useSubscriptionStore()
const { isSubscribed } = storeToRefs(subscriptionStore)
const { fetchSubscription } = subscriptionStore

const syncAndFetch = async () => {
  // First try to sync from Stripe (in case webhook didn't fire)
  try {
    await $fetch('/api/subscription/sync', { method: 'POST' })
  } catch (e) {
    console.log('Sync attempt:', e)
  }

  // Then fetch the subscription
  await fetchSubscription()
}

const pollForSubscription = async (retries = 10, delay = 1000) => {
  // Try immediate sync first
  await syncAndFetch()
  if (isSubscribed.value) return

  // If not subscribed yet, poll for webhook to process
  for (let i = 0; i < retries; i++) {
    await new Promise(resolve => setTimeout(resolve, delay))
    await fetchSubscription()
    if (isSubscribed.value) {
      return // Success!
    }
  }
}

onMounted(() => {
  pollForSubscription()
})
</script>
