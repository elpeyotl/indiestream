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
        }, 250) // Match page transition duration
      })
    }

    // If navigating to a hash, scroll to element
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            el: to.hash,
            behavior: 'smooth',
          })
        }, 250)
      })
    }

    // For new page navigations, scroll to top immediately
    // Use window.scrollTo for instant scroll before transition
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    return { top: 0, left: 0 }
  },
}
