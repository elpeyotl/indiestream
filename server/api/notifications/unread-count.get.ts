// GET /api/notifications/unread-count - Get count of unread notifications
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { count, error } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) {
    console.error('Failed to count unread notifications:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { count: count || 0 }
})
