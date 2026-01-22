// Admin pending counts store using plain Pinia with realtime updates
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

// Types
export interface AdminCounts {
  moderation: number
  artists: number
  reports: number
  dmca: number
}

// Client-only state (not reactive, used for realtime subscription)
let realtimeChannel: RealtimeChannel | null = null
let fetchDebounceTimer: ReturnType<typeof setTimeout> | null = null

export const useAdminCountsStore = defineStore('adminCounts', () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Use useState for SSR-safe shared state
  const adminCounts = useState<AdminCounts | null>('adminCounts', () => null)
  const isLoading = useState<boolean>('adminCountsLoading', () => false)
  const isAdmin = useState<boolean>('adminCountsIsAdmin', () => false)

  const totalPendingCount = computed(() => {
    if (!adminCounts.value) return 0
    return adminCounts.value.moderation + adminCounts.value.artists + adminCounts.value.reports + adminCounts.value.dmca
  })

  // Debounced fetch to avoid too many API calls during rapid changes
  const debouncedFetchCounts = () => {
    if (fetchDebounceTimer) {
      clearTimeout(fetchDebounceTimer)
    }
    fetchDebounceTimer = setTimeout(() => {
      fetchCounts()
    }, 500)
  }

  // Fetch counts from API - always fetches fresh data
  const fetchCounts = async () => {
    if (!isAdmin.value || isLoading.value) return

    isLoading.value = true
    try {
      adminCounts.value = await $fetch<AdminCounts>('/api/admin/pending-counts')
    } catch (e) {
      console.error('Failed to fetch admin counts:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Check if current user is admin and set up counts
  const initializeForUser = async (userId: string | undefined) => {
    // Skip on server to avoid "Auth session missing" errors
    if (import.meta.server) return

    if (!userId) {
      isAdmin.value = false
      adminCounts.value = null
      unsubscribeRealtime()
      return
    }

    // Check admin role
    const { data } = await client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    isAdmin.value = data?.role === 'admin'

    if (isAdmin.value) {
      // Fetch initial counts
      await fetchCounts()
      // Subscribe to realtime updates
      subscribeToRealtime()
    } else {
      adminCounts.value = null
      unsubscribeRealtime()
    }
  }

  // Subscribe to realtime changes for relevant tables
  const subscribeToRealtime = () => {
    if (realtimeChannel) return // Already subscribed

    realtimeChannel = client
      .channel('admin-counts-realtime')
      // Track moderation changes - listen to all track events
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracks' },
        (payload) => {
          // Refetch on INSERT (new track) or when moderation_status changes
          if (payload.eventType === 'INSERT' ||
              payload.eventType === 'DELETE' ||
              payload.old?.moderation_status !== payload.new?.moderation_status) {
            debouncedFetchCounts()
          }
        }
      )
      // Artist approval changes - also refetch all counts on DELETE
      // because cascaded track deletes won't trigger track events
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bands' },
        (payload) => {
          // Always refetch on DELETE (tracks get cascaded)
          // Also refetch on INSERT or status changes
          if (payload.eventType === 'INSERT' ||
              payload.eventType === 'DELETE' ||
              payload.old?.status !== payload.new?.status) {
            debouncedFetchCounts()
          }
        }
      )
      // Also listen to albums table - deleting album cascades to tracks
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'albums' },
        () => debouncedFetchCounts()
      )
      // Content report changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_reports' },
        (payload) => {
          if (payload.eventType === 'INSERT' ||
              payload.eventType === 'DELETE' ||
              payload.old?.status !== payload.new?.status) {
            debouncedFetchCounts()
          }
        }
      )
      // DMCA request changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dmca_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT' ||
              payload.eventType === 'DELETE' ||
              payload.old?.status !== payload.new?.status) {
            debouncedFetchCounts()
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Admin Realtime] Connected to admin counts channel')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Admin Realtime] Subscription error:', err)
          // Try to reconnect after a delay
          setTimeout(() => {
            unsubscribeRealtime()
            subscribeToRealtime()
          }, 5000)
        }
      })
  }

  // Unsubscribe from realtime
  const unsubscribeRealtime = () => {
    if (realtimeChannel) {
      client.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  // Watch for user changes
  watch(user, (newUser) => {
    initializeForUser(newUser?.id)
  }, { immediate: true })

  return {
    adminCounts,
    totalPendingCount,
    isAdmin,
    isLoading,
    fetchCounts,
  }
})
