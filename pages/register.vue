<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <span class="text-4xl font-black uppercase tracking-tighter text-fuchsia-500">FAIRTUNE</span>
        </NuxtLink>
      </div>

      <!-- Card -->
      <div class="bg-zinc-950 border-2 border-zinc-800 p-8 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
        <div class="text-center mb-8 border-b-2 border-zinc-800 pb-6">
          <h1 class="text-2xl font-black uppercase tracking-tighter text-white">CREATE ACCOUNT</h1>
          <p class="text-zinc-400 font-mono text-sm mt-1">Start supporting artists directly</p>
        </div>

        <!-- Success State -->
        <div v-if="success" class="text-center py-6">
          <div class="w-16 h-16 mx-auto mb-4 border-2 border-fuchsia-500 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-fuchsia-500" />
          </div>
          <h2 class="text-xl font-black uppercase tracking-tighter text-white mb-2">CHECK YOUR EMAIL</h2>
          <p class="text-zinc-400 font-mono text-sm">
            We've sent a confirmation link to<br>
            <span class="text-fuchsia-500 font-bold">{{ email }}</span>
          </p>
        </div>

        <!-- Registration Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Display Name</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="How should we call you?"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              :disabled="loading"
            />
          </div>

          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              :disabled="loading"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">
              Password
              <span class="text-zinc-500 font-mono text-xs ml-2">(at least 8 characters)</span>
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="Create a password"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              :disabled="loading"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-bold uppercase tracking-tight text-zinc-300 mb-2">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              class="w-full px-4 py-3 bg-black border-2 border-zinc-800 text-white font-mono rounded-none focus:border-fuchsia-500 focus:outline-none transition-colors"
              :disabled="loading"
              required
            />
          </div>

          <!-- Terms -->
          <div class="text-sm text-zinc-400 font-mono">
            By creating an account, you agree to our
            <NuxtLink to="/terms" class="text-fuchsia-500 hover:text-fuchsia-400">Terms of Service</NuxtLink>
            and
            <NuxtLink to="/privacy" class="text-fuchsia-500 hover:text-fuchsia-400">Privacy Policy</NuxtLink>.
          </div>

          <button
            type="submit"
            class="w-full px-4 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50"
            :disabled="loading"
          >
            {{ loading ? 'Creating account...' : 'Create account' }}
          </button>

          <div
            v-if="error"
            class="p-4 border-2 border-red-500 bg-red-500/10 text-red-400 font-mono text-sm"
          >
            {{ error }}
          </div>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t-2 border-zinc-800" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-zinc-950 text-zinc-400 font-mono">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            class="w-full px-4 py-3 border-2 border-zinc-800 text-white font-bold uppercase tracking-tight rounded-none hover:border-fuchsia-500 transition-colors flex items-center justify-center gap-2"
            :disabled="googleLoading"
            @click="handleGoogleSignUp"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ googleLoading ? 'Loading...' : 'Continue with Google' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t-2 border-zinc-800 text-center">
          <p class="text-zinc-400 font-mono text-sm">
            Already have an account?
            <NuxtLink to="/login" class="text-fuchsia-500 hover:text-fuchsia-400 font-bold">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>

      <!-- Value Prop -->
      <div class="mt-8 text-center">
        <p class="text-zinc-500 font-mono text-sm uppercase">
          70% of your subscription goes directly to artists
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'brutalist',
  middleware: 'guest',
})

const { signUp, signInWithGoogle } = useAuth()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const googleLoading = ref(false)
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

const handleGoogleSignUp = async () => {
  googleLoading.value = true
  error.value = ''

  try {
    await signInWithGoogle()
  } catch (e: any) {
    error.value = e.message || 'Failed to sign up with Google'
    googleLoading.value = false
  }
}
</script>
