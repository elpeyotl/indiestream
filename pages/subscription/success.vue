<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg">
      <!-- Progress dots -->
      <div class="flex justify-center gap-2 mb-8">
        <button
          v-for="i in totalSteps"
          :key="i"
          @click="currentStep = i"
          class="h-2 rounded-full transition-all duration-300"
          :class="currentStep === i ? 'bg-violet-500 w-6' : 'bg-zinc-700 w-2 hover:bg-zinc-600'"
        />
      </div>

      <!-- Step content with navigation arrows -->
      <div
        class="relative"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Left Arrow -->
        <button
          v-if="currentStep > 1"
          @click="prevStep"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-all opacity-60 hover:opacity-100"
        >
          <UIcon name="i-heroicons-chevron-left" class="w-5 h-5 text-zinc-300" />
        </button>

        <!-- Right Arrow -->
        <button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-all opacity-60 hover:opacity-100"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-300" />
        </button>

        <!-- Step content with transitions -->
        <Transition name="slide" mode="out-in">
          <div :key="currentStep" class="text-center">
          <!-- Step 1: Welcome -->
          <template v-if="currentStep === 1">
            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="w-14 h-14 text-green-400" />
            </div>
            <h1 class="text-3xl font-bold text-zinc-100 mb-4">Welcome to Fairtune!</h1>
            <p class="text-zinc-400 mb-6">
              You're now part of a community that supports artists directly.
            </p>
            <div class="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 inline-block">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
                <span class="text-zinc-300 text-sm">Your 7-day free trial has started</span>
              </div>
            </div>
          </template>

          <!-- Step 2: 85% to Artists -->
          <template v-else-if="currentStep === 2">
            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-heart" class="w-14 h-14 text-violet-400" />
            </div>
            <h2 class="text-3xl font-bold text-zinc-100 mb-4">85% goes to artists</h2>
            <p class="text-zinc-400 mb-8">
              Unlike other platforms, the majority of your subscription goes directly to the artists you listen to. No middlemen.
            </p>
            <div class="flex justify-center gap-12">
              <div class="text-center">
                <p class="text-5xl font-bold text-violet-400">85%</p>
                <p class="text-zinc-500 text-sm mt-1">To Artists</p>
              </div>
              <div class="text-center">
                <p class="text-5xl font-bold text-zinc-600">15%</p>
                <p class="text-zinc-500 text-sm mt-1">Platform</p>
              </div>
            </div>
          </template>

          <!-- Step 3: Track Impact -->
          <template v-else-if="currentStep === 3">
            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-chart-bar" class="w-14 h-14 text-fuchsia-400" />
            </div>
            <h2 class="text-3xl font-bold text-zinc-100 mb-4">Track your impact</h2>
            <p class="text-zinc-400 mb-8">
              See exactly which artists you're supporting. Your dashboard shows your listening stats and how your subscription is distributed.
            </p>
            <div class="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <UIcon name="i-heroicons-clock" class="w-6 h-6 text-violet-400 mx-auto mb-2" />
                  <p class="text-zinc-500 text-xs">Hours Listened</p>
                </div>
                <div>
                  <UIcon name="i-heroicons-users" class="w-6 h-6 text-fuchsia-400 mx-auto mb-2" />
                  <p class="text-zinc-500 text-xs">Artists Supported</p>
                </div>
                <div>
                  <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p class="text-zinc-500 text-xs">Your Contribution</p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </Transition>
      </div>

      <!-- Navigation -->
      <div class="mt-10 space-y-3">
        <template v-if="currentStep < totalSteps">
          <UButton color="violet" size="lg" block @click="nextStep">
            Continue
          </UButton>
          <UButton color="gray" variant="ghost" size="lg" block @click="skip">
            Skip
          </UButton>
        </template>
        <template v-else>
          <UButton color="violet" size="lg" block to="/discover">
            Start Discovering Music
          </UButton>
          <UButton color="gray" variant="ghost" size="lg" block to="/dashboard">
            Go to Dashboard
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { SubscriptionData } from '~/stores/subscription'

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Welcome to Fairtune!',
})

// Carousel state
const currentStep = ref(1)
const totalSteps = 3

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const skip = () => {
  currentStep.value = totalSteps
}

// Touch swipe support
const touchStartX = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX.value - touchEndX

  // Swipe threshold of 50px
  if (Math.abs(diff) > 50) {
    if (diff > 0 && currentStep.value < totalSteps) {
      // Swipe left = next
      nextStep()
    } else if (diff < 0 && currentStep.value > 1) {
      // Swipe right = prev
      prevStep()
    }
  }
}

// Refresh subscription status with retry (webhook may not have processed yet)
const subscriptionStore = useSubscriptionStore()
const { isSubscribed } = storeToRefs(subscriptionStore)
const { setSubscription, fetchSubscription, fetchFreeTierStatus } = subscriptionStore

const syncAndFetch = async () => {
  // Try to sync from Stripe (in case webhook didn't fire)
  try {
    const result = await $fetch<{
      synced: boolean
      subscription?: SubscriptionData
      message?: string
    }>('/api/subscription/sync', { method: 'POST' })

    if (result.synced && result.subscription) {
      // Update store directly with the synced data
      setSubscription(result.subscription)
      // Also refresh free tier status
      await fetchFreeTierStatus()
      return
    }
  } catch (e) {
    console.log('Sync attempt failed:', e)
  }

  // Fallback: fetch from database (webhook may have updated it)
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

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
