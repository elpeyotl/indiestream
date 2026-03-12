// Global middleware: redirect to /offline when network is unavailable
export default defineNuxtRouteMiddleware((to) => {
  // Only run on client-side (server has no offline concept)
  if (import.meta.server) return

  // Allow /offline page itself
  if (to.path === '/offline') return

  // Check network status
  if (!navigator.onLine) {
    return navigateTo('/offline')
  }
})
