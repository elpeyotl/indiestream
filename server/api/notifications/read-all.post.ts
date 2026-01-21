// POST /api/notifications/read-all - Delete all notifications (clear all)
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { error } = await client
    .from('notifications')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to delete all notifications:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true }
})
