// POST /api/notifications/read-all - Mark all notifications as read
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Failed to mark all notifications as read:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
