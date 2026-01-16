// Global pull-to-refresh composable
// Listeners are set up once in the layout, pages just register their refresh callback

const THRESHOLD = 80
const MAX_PULL_DISTANCE = 120

// Global state using useState for SSR safety
const useGlobalPullToRefreshState = () => {
  const pullDistance = useState<number>('ptr-distance', () => 0)
  const isRefreshing = useState<boolean>('ptr-refreshing', () => false)
  const isPulling = useState<boolean>('ptr-pulling', () => false)
  const refreshCallback = useState<(() => Promise<void>) | null>('ptr-callback', () => null)

  return { pullDistance, isRefreshing, isPulling, refreshCallback }
}

/**
 * Use in layout to set up global pull-to-refresh listeners
 */
export const useGlobalPullToRefresh = () => {
  const { pullDistance, isRefreshing, isPulling, refreshCallback } = useGlobalPullToRefreshState()

  let startY = 0
  let currentY = 0
  let listenersSetup = false

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (isRefreshing.value) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop <= 0) {
      startY = e.touches[0].clientY
      isPulling.value = true
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling.value || isRefreshing.value) return

    currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    if (deltaY > 0) {
      e.preventDefault()
      const resistance = 0.5
      const distance = Math.min(deltaY * resistance, MAX_PULL_DISTANCE)
      pullDistance.value = distance

      if (distance >= THRESHOLD && (deltaY * resistance) - 1 < THRESHOLD) {
        vibrate(10)
      }
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling.value || isRefreshing.value) return

    isPulling.value = false

    if (pullDistance.value >= THRESHOLD && refreshCallback.value) {
      isRefreshing.value = true
      vibrate([10, 50, 10])

      try {
        await refreshCallback.value()
      } catch (error) {
        console.error('Pull-to-refresh error:', error)
      } finally {
        setTimeout(() => {
          isRefreshing.value = false
          pullDistance.value = 0
        }, 300)
      }
    } else {
      pullDistance.value = 0
    }

    startY = 0
    currentY = 0
  }

  const setupListeners = () => {
    if (!process.client || listenersSetup) return
    if (window.innerWidth >= 768) return // Only mobile

    document.body.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.body.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.body.addEventListener('touchend', handleTouchEnd, { passive: true })
    listenersSetup = true
  }

  const cleanupListeners = () => {
    if (!process.client || !listenersSetup) return

    document.body.removeEventListener('touchstart', handleTouchStart)
    document.body.removeEventListener('touchmove', handleTouchMove)
    document.body.removeEventListener('touchend', handleTouchEnd)
    listenersSetup = false
  }

  onMounted(() => {
    setupListeners()
  })

  onUnmounted(() => {
    cleanupListeners()
  })

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    threshold: THRESHOLD
  }
}

/**
 * Use in pages to register a refresh callback
 *
 * @example
 * usePullToRefresh(async () => {
 *   await loadData()
 * })
 */
export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const { pullDistance, isRefreshing, isPulling, refreshCallback } = useGlobalPullToRefreshState()

  // Register the callback when component mounts
  onMounted(() => {
    refreshCallback.value = onRefresh
  })

  // Clear callback when component unmounts
  onUnmounted(() => {
    if (refreshCallback.value === onRefresh) {
      refreshCallback.value = null
    }
  })

  // Update callback when route changes (in case same component instance is reused)
  if (process.client) {
    const route = useRoute()
    watch(() => route.fullPath, () => {
      refreshCallback.value = onRefresh
    })
  }

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    threshold: THRESHOLD
  }
}
