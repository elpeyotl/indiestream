import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface PullToRefreshOptions {
  /**
   * Callback function to execute when refresh is triggered
   */
  onRefresh: () => Promise<void>

  /**
   * Distance in pixels required to trigger refresh (default: 80)
   */
  threshold?: number

  /**
   * Maximum pull distance in pixels (default: 120)
   */
  maxPullDistance?: number

  /**
   * Enable haptic feedback (default: true)
   */
  hapticFeedback?: boolean
}

/**
 * Composable for implementing native-feeling pull-to-refresh on mobile
 *
 * @example
 * const { pullDistance, isRefreshing } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData()
 *   }
 * })
 */
export const usePullToRefresh = (options: PullToRefreshOptions) => {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 120,
    hapticFeedback = true
  } = options

  const pullDistance = ref(0)
  const isRefreshing = ref(false)
  const isPulling = ref(false)

  let startY = 0
  let currentY = 0
  let scrollableElement: HTMLElement | null = null

  const vibrate = (pattern: number | number[]) => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    // Only start if we're at the top of the page and not already refreshing
    if (isRefreshing.value) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop === 0) {
      startY = e.touches[0].clientY
      isPulling.value = true
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling.value || isRefreshing.value) return

    currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    // Only allow pulling down (positive deltaY)
    if (deltaY > 0) {
      // Prevent default scrolling behavior when pulling
      e.preventDefault()

      // Apply resistance curve (diminishing returns as you pull further)
      const resistance = 0.5
      const distance = Math.min(deltaY * resistance, maxPullDistance)
      pullDistance.value = distance

      // Haptic feedback when reaching threshold
      if (distance >= threshold && deltaY - 1 < threshold) {
        vibrate(10)
      }
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling.value || isRefreshing.value) return

    isPulling.value = false

    // Trigger refresh if threshold was reached
    if (pullDistance.value >= threshold) {
      isRefreshing.value = true
      vibrate([10, 50, 10]) // Success pattern

      try {
        await onRefresh()
      } catch (error) {
        console.error('Pull-to-refresh error:', error)
      } finally {
        // Smooth animation back to 0
        setTimeout(() => {
          isRefreshing.value = false
          pullDistance.value = 0
        }, 300)
      }
    } else {
      // Didn't reach threshold, animate back to 0
      pullDistance.value = 0
    }

    startY = 0
    currentY = 0
  }

  onMounted(() => {
    // Only enable on mobile devices
    if (process.client && window.innerWidth < 768) {
      scrollableElement = document.body

      scrollableElement.addEventListener('touchstart', handleTouchStart, { passive: true })
      scrollableElement.addEventListener('touchmove', handleTouchMove, { passive: false })
      scrollableElement.addEventListener('touchend', handleTouchEnd, { passive: true })
    }
  })

  onUnmounted(() => {
    if (scrollableElement) {
      scrollableElement.removeEventListener('touchstart', handleTouchStart)
      scrollableElement.removeEventListener('touchmove', handleTouchMove)
      scrollableElement.removeEventListener('touchend', handleTouchEnd)
    }
  })

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    threshold
  }
}
