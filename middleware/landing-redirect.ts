// Middleware to redirect authenticated users from landing page to discover
// This runs on both server and client to prevent flash of landing page

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  // If user is authenticated, redirect to discover
  if (user.value) {
    return navigateTo('/discover', { replace: true })
  }
})
