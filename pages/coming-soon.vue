<template>
  <div class="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
    <!-- Background gradient -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
    </div>

    <div class="relative z-10 text-center max-w-2xl">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <AppLogo size="xl" />
      </div>

      <!-- Heading -->
      <h1 class="text-2xl md:text-3xl font-bold text-zinc-100 mb-4">
        Something Amazing is Coming
      </h1>

      <!-- Tagline -->
      <p class="text-xl text-zinc-400 mb-8">
        Stream Fair. Support Direct.
      </p>

      <p class="text-zinc-500 mb-12 max-w-md mx-auto">
        A new way to stream music where your subscription directly supports the artists you love.
      </p>

      <!-- Email signup -->
      <div class="w-full max-w-md mx-auto mb-12">
        <form
          v-if="!submitted"
          class="flex flex-col sm:flex-row gap-3"
          @submit.prevent="submitEmail"
        >
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            required
            :disabled="submitting"
            class="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            :disabled="submitting || !email"
            class="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {{ submitting ? 'Sending...' : 'Get Notified' }}
          </button>
        </form>

        <!-- Success state -->
        <div v-else class="flex items-center justify-center gap-2 text-green-400">
          <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
          <span class="font-medium">You're on the list! We'll be in touch.</span>
        </div>

        <!-- Error state -->
        <p v-if="errorMessage" class="mt-2 text-sm text-red-400 text-center">
          {{ errorMessage }}
        </p>

        <!-- Privacy note -->
        <p v-if="!submitted" class="mt-3 text-xs text-zinc-600 text-center">
          We'll only use your email to notify you when Fairtune launches.
        </p>
      </div>

      <!-- Social links or additional info -->
      <p class="text-zinc-600 text-sm">
        Coming soon in 2026
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'Coming Soon - Fairtune',
  meta: [
    { name: 'description', content: 'Fairtune - Stream Fair. Support Direct. A new music streaming platform coming soon.' },
  ],
})

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

const submitEmail = async () => {
  if (!email.value || submitting.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/newsletter-signup', {
      method: 'POST',
      body: { email: email.value },
    })
    submitted.value = true
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
