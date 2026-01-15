import type { RouterConfig } from '@nuxt/schema'

// Custom scroll behavior for better navigation UX
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (back/forward navigation), restore it
    if (savedPosition) {
      // Wait for page transition to complete before scrolling
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(savedPosition)
        }, 100)
      })
    }

    // If navigating to a hash, scroll to element
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    // For new page navigations, scroll to top
    return { top: 0, behavior: 'instant' }
  },
}
