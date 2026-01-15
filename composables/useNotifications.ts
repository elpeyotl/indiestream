// Composable for managing in-app notifications
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

// Shared state across components
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const lastFetch = ref<number>(0)
const realtimeChannel = ref<RealtimeChannel | null>(null)

export const useNotifications = () => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()

  // Fetch unread count (lightweight, for badge)
  const fetchUnreadCount = async () => {
    if (!user.value) {
      unreadCount.value = 0
      return
    }

    try {
      const { count } = await $fetch<{ count: number }>('/api/notifications/unread-count')
      unreadCount.value = count
    } catch (e) {
      console.error('Failed to fetch unread count:', e)
    }
  }

  // Fetch full notifications list
  const fetchNotifications = async (force = false) => {
    if (!user.value) {
      notifications.value = []
      return
    }

    // Prevent too frequent fetches (cache for 30 seconds unless forced)
    const now = Date.now()
    if (!force && lastFetch.value && now - lastFetch.value < 30000) {
      return
    }

    loading.value = true
    try {
      const data = await $fetch<Notification[]>('/api/notifications')
      notifications.value = data
      lastFetch.value = now

      // Update unread count from fetched data
      unreadCount.value = data.filter(n => !n.read).length
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      loading.value = false
    }
  }

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      await $fetch(`/api/notifications/${id}`, { method: 'PATCH' })

      // Update local state
      const notification = notifications.value.find(n => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await $fetch('/api/notifications/read-all', { method: 'POST' })

      // Update local state
      notifications.value.forEach(n => { n.read = true })
      unreadCount.value = 0
    } catch (e) {
      console.error('Failed to mark all as read:', e)
    }
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'track_approved':
        return 'i-heroicons-check-circle'
      case 'track_rejected':
        return 'i-heroicons-x-circle'
      case 'track_revision':
        return 'i-heroicons-exclamation-triangle'
      case 'new_follower':
        return 'i-heroicons-user-plus'
      default:
        return 'i-heroicons-bell'
    }
  }

  // Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'track_approved':
        return 'text-green-400'
      case 'track_rejected':
        return 'text-red-400'
      case 'track_revision':
        return 'text-orange-400'
      case 'new_follower':
        return 'text-fuchsia-400'
      default:
        return 'text-violet-400'
    }
  }

  // Format relative time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Subscribe to real-time notifications
  const subscribeToRealtime = () => {
    if (!user.value || realtimeChannel.value) return

    realtimeChannel.value = client
      .channel(`notifications:${user.value.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.value.id}`,
        },
        (payload) => {
          // Add new notification to the top of the list
          const newNotification = payload.new as Notification
          notifications.value = [newNotification, ...notifications.value]
          unreadCount.value += 1
        }
      )
      .subscribe()
  }

  // Unsubscribe from real-time notifications
  const unsubscribeFromRealtime = () => {
    if (realtimeChannel.value) {
      client.removeChannel(realtimeChannel.value)
      realtimeChannel.value = null
    }
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationIcon,
    getNotificationColor,
    formatTime,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  }
}
