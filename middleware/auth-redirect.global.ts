// Global middleware to handle Supabase auth redirects
// When Supabase redirects back with tokens in the URL hash, redirect to /confirm

export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (import.meta.server) return

  // Only check the homepage
  if (to.path !== '/') return

  // Check if we have auth tokens in the hash
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    // If we have tokens, redirect to /confirm with the hash
    if (accessToken && refreshToken) {
      return navigateTo('/confirm' + window.location.hash)
    }
  }
})
