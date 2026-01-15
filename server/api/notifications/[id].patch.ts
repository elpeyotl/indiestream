// PATCH /api/notifications/[id] - Mark notification as read
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const notificationId = getRouterParam(event, 'id')
  if (!notificationId) {
    throw createError({ statusCode: 400, statusMessage: 'Notification ID required' })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id) // Ensure user owns this notification
    .select()
    .single()

  if (error) {
    console.error('Failed to mark notification as read:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
