// Middleware for guest-only pages (login, register)
// Redirects logged-in users to discover page
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()

  if (user.value) {
    return navigateTo('/discover')
  }
})
