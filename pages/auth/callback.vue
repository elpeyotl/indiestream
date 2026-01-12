<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-violet-400 animate-spin" />
      </div>
      <p class="text-zinc-400">Completing sign in...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()

onMounted(async () => {
  // Handle the OAuth callback
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Auth callback error:', error)
    navigateTo('/login?error=auth_failed')
    return
  }

  if (data.session) {
    // Successfully authenticated, redirect to dashboard
    navigateTo('/dashboard')
  } else {
    // No session, redirect to login
    navigateTo('/login')
  }
})
</script>
