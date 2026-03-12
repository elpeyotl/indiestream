// Composable to sync deferred stream recordings when back online
import { getAllDeferredStreams, clearDeferredStreams } from '~/utils/offlineDb'

export const useDeferredSync = () => {
  const syncing = ref(false)

  const syncDeferredStreams = async () => {
    if (syncing.value || import.meta.server) return

    syncing.value = true

    try {
      const streams = await getAllDeferredStreams()
      if (streams.length === 0) {
        syncing.value = false
        return
      }

      let allSucceeded = true

      for (const stream of streams) {
        try {
          await $fetch('/api/streams/record', {
            method: 'POST',
            body: {
              trackId: stream.trackId,
              durationSeconds: stream.durationSeconds,
              isFreePlay: stream.isFreePlay,
            },
          })
        } catch (e) {
          console.error('Failed to sync deferred stream:', e)
          allSucceeded = false
        }
      }

      // Only clear if all succeeded; otherwise retry next time
      if (allSucceeded) {
        await clearDeferredStreams()
      }
    } catch (e) {
      console.error('Deferred sync error:', e)
    } finally {
      syncing.value = false
    }
  }

  // Sync on mount and when coming back online
  if (import.meta.client) {
    onMounted(() => {
      syncDeferredStreams()
      window.addEventListener('online', syncDeferredStreams)
    })

    onUnmounted(() => {
      window.removeEventListener('online', syncDeferredStreams)
    })
  }

  return { syncing: readonly(syncing) }
}
