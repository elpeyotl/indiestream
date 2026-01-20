// Composable for admin tab realtime updates
// Provides easy way to subscribe to table changes and auto-refresh data
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

type TableName = 'bands' | 'albums' | 'tracks' | 'playlists' | 'content_reports' | 'dmca_requests' | 'moderation_queue'

interface RealtimeOptions {
  // Table to subscribe to
  table: TableName
  // Callback when data changes (should refetch data)
  onUpdate: () => void
  // Optional filter for specific events
  filter?: string
  // Optional: only trigger on specific fields changing
  watchFields?: string[]
}

export const useAdminRealtime = () => {
  const client = useSupabaseClient<Database>()
  const channels = ref<Map<string, RealtimeChannel>>(new Map())

  /**
   * Subscribe to realtime changes for an admin table
   * Returns a cleanup function
   */
  const subscribe = (options: RealtimeOptions): (() => void) => {
    const { table, onUpdate, filter, watchFields } = options
    const channelName = `admin-${table}-${Date.now()}`

    // Create channel with postgres_changes listener
    const channelConfig: any = {
      event: '*',
      schema: 'public',
      table,
    }

    // Add filter if provided (e.g., 'status=eq.pending')
    if (filter) {
      channelConfig.filter = filter
    }

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        channelConfig,
        (payload: RealtimePostgresChangesPayload<any>) => {
          // If watchFields specified, only trigger on those field changes
          if (watchFields && watchFields.length > 0 && payload.eventType === 'UPDATE') {
            const hasRelevantChange = watchFields.some(
              field => payload.old?.[field] !== payload.new?.[field]
            )
            if (!hasRelevantChange) return
          }

          // Debounce rapid updates
          onUpdate()
        }
      )
      .subscribe()

    channels.value.set(channelName, channel)

    // Return cleanup function
    return () => {
      const chan = channels.value.get(channelName)
      if (chan) {
        client.removeChannel(chan)
        channels.value.delete(channelName)
      }
    }
  }

  /**
   * Subscribe to multiple tables at once
   * Returns a cleanup function that unsubscribes from all
   */
  const subscribeMultiple = (subscriptions: RealtimeOptions[]): (() => void) => {
    const cleanupFns = subscriptions.map(sub => subscribe(sub))
    return () => {
      cleanupFns.forEach(fn => fn())
    }
  }

  // Cleanup all channels on unmount
  onUnmounted(() => {
    channels.value.forEach((channel) => {
      client.removeChannel(channel)
    })
    channels.value.clear()
  })

  return {
    subscribe,
    subscribeMultiple,
  }
}
