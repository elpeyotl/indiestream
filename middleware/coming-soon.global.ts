// Global middleware to show coming soon page on production domain
export default defineNuxtRouteMiddleware((to) => {
  // Skip if already on coming-soon page
  if (to.path === '/coming-soon') return

  // Only run on client-side for domain check
  if (import.meta.server) {
    // On server, check via runtime config
    const config = useRuntimeConfig()
    if (config.public.comingSoonMode) {
      return navigateTo('/coming-soon')
    }
    return
  }

  // Client-side: check runtime config
  const config = useRuntimeConfig()
  if (config.public.comingSoonMode) {
    return navigateTo('/coming-soon')
  }
})
