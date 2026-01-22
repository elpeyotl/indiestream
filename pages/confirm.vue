<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md text-center">
      <!-- Loading State -->
      <div v-if="loading">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-violet-400 animate-spin" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 mb-2">Confirming your email...</h1>
        <p class="text-zinc-400">Please wait while we verify your account.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-teal-400" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 mb-2">Email confirmed!</h1>
        <p class="text-zinc-400 mb-6">Your account is now active. Welcome to Fairtune!</p>
        <UButton color="violet" size="lg" to="/dashboard">
          Go to Dashboard
        </UButton>
      </div>

      <!-- Error State -->
      <div v-else>
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-400" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 mb-2">Confirmation failed</h1>
        <p class="text-zinc-400 mb-6">{{ errorMessage || 'The confirmation link may be expired or invalid.' }}</p>
        <div class="space-x-3">
          <UButton color="gray" variant="outline" to="/login">
            Sign in
          </UButton>
          <UButton color="violet" to="/register">
            Try again
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const user = useSupabaseUser()
const route = useRoute()

const loading = ref(true)
const success = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  // Check for error from server-side auth callback
  const error = route.query.error as string
  if (error) {
    errorMessage.value = decodeURIComponent(error)
    loading.value = false
    return
  }

  // Check if user is already logged in (redirected from /auth/confirm)
  // Wait a moment for session to be established
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (user.value) {
    success.value = true
  } else {
    errorMessage.value = 'No confirmation token found. Please try signing up again.'
  }

  loading.value = false
})
</script>
