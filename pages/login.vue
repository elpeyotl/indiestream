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
            <h1 class="text-2xl font-bold text-zinc-100">Welcome back</h1>
            <p class="text-zinc-400 mt-1">Sign in to your account</p>
          </div>
        </template>

        <form @submit.prevent="handleLogin" class="space-y-4">
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

          <UFormGroup label="Password" name="password">
            <UInput
              v-model="password"
              type="password"
              placeholder="Enter your password"
              size="lg"
              :disabled="loading"
              required
            />
          </UFormGroup>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="rememberMe" label="Remember me" />
            <NuxtLink to="/forgot-password" class="text-sm text-violet-400 hover:text-violet-300">
              Forgot password?
            </NuxtLink>
          </div>

          <UButton
            type="submit"
            color="violet"
            size="lg"
            block
            :loading="loading"
          >
            Sign in
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
            Don't have an account?
            <NuxtLink to="/register" class="text-violet-400 hover:text-violet-300 font-medium">
              Sign up
            </NuxtLink>
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    await signIn(email.value, password.value)
    navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e.message || 'Failed to sign in'
  } finally {
    loading.value = false
  }
}
</script>
