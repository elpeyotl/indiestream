// DELETE /api/notifications/[id] - Delete a notification
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

  const { error } = await client
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id) // Ensure user owns this notification

  if (error) {
    console.error('Failed to delete notification:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
