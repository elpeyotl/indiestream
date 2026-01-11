<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span class="text-white font-bold">IS</span>
          </div>
          <span class="text-2xl font-bold">
            <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Indie</span><span class="text-zinc-100">stream</span>
          </span>
        </NuxtLink>
      </div>

      <!-- Card -->
      <UCard class="bg-zinc-900/50 backdrop-blur-xl border-zinc-800">
        <template #header>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-zinc-100">Create your account</h1>
            <p class="text-zinc-400 mt-1">Start supporting artists directly</p>
          </div>
        </template>

        <!-- Success State -->
        <div v-if="success" class="text-center py-6">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-teal-400" />
          </div>
          <h2 class="text-xl font-semibold text-zinc-100 mb-2">Check your email</h2>
          <p class="text-zinc-400">
            We've sent a confirmation link to<br>
            <span class="text-zinc-200 font-medium">{{ email }}</span>
          </p>
        </div>

        <!-- Registration Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <UFormGroup label="Display Name" name="displayName">
            <UInput
              v-model="displayName"
              type="text"
              placeholder="How should we call you?"
              size="lg"
              :disabled="loading"
            />
          </UFormGroup>

          <UFormGroup label="Email" name="email">
            <UInput
              v-model="email"
              type="email"
              placeholder="you@example.com"
              size="lg"
              :disabled="loading"
              required
            />
          </UFormGroup>

          <UFormGroup label="Password" name="password" hint="At least 8 characters">
            <UInput
              v-model="password"
              type="password"
              placeholder="Create a password"
              size="lg"
              :disabled="loading"
              required
            />
          </UFormGroup>

          <UFormGroup label="Confirm Password" name="confirmPassword">
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              size="lg"
              :disabled="loading"
              required
            />
          </UFormGroup>

          <!-- Terms -->
          <div class="text-sm text-zinc-400">
            By creating an account, you agree to our
            <NuxtLink to="/terms" class="text-violet-400 hover:underline">Terms of Service</NuxtLink>
            and
            <NuxtLink to="/privacy" class="text-violet-400 hover:underline">Privacy Policy</NuxtLink>.
          </div>

          <UButton
            type="submit"
            color="violet"
            size="lg"
            block
            :loading="loading"
          >
            Create account
          </UButton>

          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            icon="i-heroicons-exclamation-circle"
          />
        </form>

        <template #footer>
          <p class="text-center text-zinc-400">
            Already have an account?
            <NuxtLink to="/login" class="text-violet-400 hover:text-violet-300 font-medium">
              Sign in
            </NuxtLink>
          </p>
        </template>
      </UCard>

      <!-- Value Prop -->
      <div class="mt-8 text-center">
        <p class="text-zinc-500 text-sm">
          85% of your subscription goes directly to the artists you listen to.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { signUp } = useAuth()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleRegister = async () => {
  // Validation
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await signUp(email.value, password.value, displayName.value || undefined)
    success.value = true
  } catch (e: any) {
    error.value = e.message || 'Failed to create account'
  } finally {
    loading.value = false
  }
}
</script>
