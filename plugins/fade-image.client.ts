/**
 * Vue directive for fade-in image loading
 *
 * Usage: <img v-fade-image src="..." alt="..." />
 */

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('fade-image', {
    mounted(el: HTMLImageElement) {
      // Set initial state
      el.style.opacity = '0'
      el.style.transition = 'opacity 500ms ease-out'

      // Handle load
      const handleLoad = () => {
        el.style.opacity = '1'
      }

      // Handle error
      const handleError = () => {
        el.style.opacity = '1'
      }

      // If image is already loaded (cached)
      if (el.complete) {
        handleLoad()
      } else {
        el.addEventListener('load', handleLoad)
        el.addEventListener('error', handleError)
      }

      // Cleanup
      el._fadeImageCleanup = () => {
        el.removeEventListener('load', handleLoad)
        el.removeEventListener('error', handleError)
      }
    },
    unmounted(el: HTMLImageElement & { _fadeImageCleanup?: () => void }) {
      if (el._fadeImageCleanup) {
        el._fadeImageCleanup()
      }
    }
  })
})
