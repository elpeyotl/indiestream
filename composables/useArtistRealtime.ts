// Composable for artist dashboard realtime updates
// Provides subscriptions for streams, earnings, and moderation status changes
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = 'listening_history' | 'bands' | 'albums' | 'tracks' | 'payouts'

interface RealtimeOptions {
  table: TableName
  bandId: string
  onUpdate: () => void
  // Optional: debounce rapid updates (ms)
  debounce?: number
}

export const useArtistRealtime = () => {
  const client = useSupabaseClient()
  // Using 'any' for channel type to avoid Supabase typing issues between subscribe() return and RealtimeChannel
  const channels = ref<Map<string, any>>(new Map())
  const debounceTimers = ref<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const createDebouncedUpdate = (channelName: string, onUpdate: () => void, debounce: number) => {
    return () => {
      // Clear any existing timer
      const existingTimer = debounceTimers.value.get(channelName)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Set new debounced timer
      const timer = setTimeout(() => {
        onUpdate()
        debounceTimers.value.delete(channelName)
      }, debounce)

      debounceTimers.value.set(channelName, timer)
    }
  }

  /**
   * Subscribe to realtime changes for an artist-specific table
   * Returns a cleanup function
   */
  const subscribe = (options: RealtimeOptions): (() => void) => {
    const { table, bandId, onUpdate, debounce = 1000 } = options
    const channelName = `artist-${table}-${bandId}-${Date.now()}`

    // Build the channel config based on table type
    const channelConfig: any = {
      event: '*',
      schema: 'public',
      table,
    }

    // Add appropriate filter based on table
    if (table === 'listening_history' || table === 'payouts') {
      channelConfig.filter = `band_id=eq.${bandId}`
    } else if (table === 'bands') {
      channelConfig.filter = `id=eq.${bandId}`
    } else if (table === 'albums') {
      channelConfig.filter = `band_id=eq.${bandId}`
    }

    const debouncedUpdate = createDebouncedUpdate(channelName, onUpdate, debounce)

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        (_payload: RealtimePostgresChangesPayload<any>) => {
          debouncedUpdate()
        }
      )
      .subscribe()

    channels.value.set(channelName, channel)

    // Return cleanup function
    return () => {
      // Clear debounce timer
      const timer = debounceTimers.value.get(channelName)
      if (timer) {
        clearTimeout(timer)
        debounceTimers.value.delete(channelName)
      }

      // Remove channel
      const chan = channels.value.get(channelName)
      if (chan) {
        client.removeChannel(chan)
        channels.value.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to track changes for a specific album
   * Useful for monitoring moderation status
   */
  const subscribeToAlbumTracks = (
    albumId: string,
    onUpdate: () => void,
    debounce = 1000
  ): (() => void) => {
    const channelName = `artist-tracks-${albumId}-${Date.now()}`

    const debouncedUpdate = createDebouncedUpdate(channelName, onUpdate, debounce)

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
          filter: `album_id=eq.${albumId}`,
        },
        () => debouncedUpdate()
      )
      .subscribe()

    channels.value.set(channelName, channel)

    return () => {
      const timer = debounceTimers.value.get(channelName)
      if (timer) {
        clearTimeout(timer)
        debounceTimers.value.delete(channelName)
      }

      const chan = channels.value.get(channelName)
      if (chan) {
        client.removeChannel(chan)
        channels.value.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to multiple tables at once for a band
   * Commonly used pattern for dashboard overview
   */
  const subscribeToAll = (
    bandId: string,
    callbacks: {
      onStreamUpdate?: () => void
      onBandUpdate?: () => void
      onAlbumUpdate?: () => void
      onPayoutUpdate?: () => void
    }
  ): (() => void) => {
    const cleanupFns: (() => void)[] = []

    if (callbacks.onStreamUpdate) {
      cleanupFns.push(
        subscribe({
          table: 'listening_history',
          bandId,
          onUpdate: callbacks.onStreamUpdate,
          debounce: 2000, // Streams can be frequent, debounce more
        })
      )
    }

    if (callbacks.onBandUpdate) {
      cleanupFns.push(
        subscribe({
          table: 'bands',
          bandId,
          onUpdate: callbacks.onBandUpdate,
          debounce: 500,
        })
      )
    }

    if (callbacks.onAlbumUpdate) {
      cleanupFns.push(
        subscribe({
          table: 'albums',
          bandId,
          onUpdate: callbacks.onAlbumUpdate,
          debounce: 500,
        })
      )
    }

    if (callbacks.onPayoutUpdate) {
      cleanupFns.push(
        subscribe({
          table: 'payouts',
          bandId,
          onUpdate: callbacks.onPayoutUpdate,
          debounce: 500,
        })
      )
    }

    return () => {
      cleanupFns.forEach(fn => fn())
    }
  }

  // Cleanup all channels on unmount
  onUnmounted(() => {
    // Clear all debounce timers
    debounceTimers.value.forEach(timer => clearTimeout(timer))
    debounceTimers.value.clear()

    // Remove all channels
    channels.value.forEach((channel) => {
      client.removeChannel(channel)
    })
    channels.value.clear()
  })

  return {
    subscribe,
    subscribeToAlbumTracks,
    subscribeToAll,
  }
}
