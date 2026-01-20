// Global admin pending counts with realtime updates
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface AdminCounts {
  moderation: number
  artists: number
  reports: number
  dmca: number
}

// Global state (shared across all components)
const adminCounts = ref<AdminCounts | null>(null)
const isLoading = ref(false)
const isAdmin = ref(false)
let realtimeChannel: RealtimeChannel | null = null

export const useAdminCounts = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const totalPendingCount = computed(() => {
    if (!adminCounts.value) return 0
    return adminCounts.value.moderation + adminCounts.value.artists + adminCounts.value.reports + adminCounts.value.dmca
  })

  // Fetch counts from API
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
      .channel('admin-counts')
      // Track moderation changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracks', filter: 'moderation_status=eq.pending' },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tracks' },
        (payload) => {
          // Refetch when moderation_status changes
          if (payload.old?.moderation_status !== payload.new?.moderation_status) {
            fetchCounts()
          }
        }
      )
      // Artist approval changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bands' },
        (payload) => {
          // Only care about status changes
          if (payload.eventType === 'INSERT' ||
              payload.old?.status !== payload.new?.status) {
            fetchCounts()
          }
        }
      )
      // Content report changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_reports' },
        () => fetchCounts()
      )
      // DMCA request changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dmca_requests' },
        () => fetchCounts()
      )
      .subscribe()
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

  // Cleanup on unmount (only unsubscribe if no other components need it)
  onUnmounted(() => {
    // Don't unsubscribe here since state is global
    // Cleanup happens when user logs out
  })

  return {
    adminCounts: readonly(adminCounts),
    totalPendingCount,
    isAdmin: readonly(isAdmin),
    isLoading: readonly(isLoading),
    fetchCounts,
  }
}
