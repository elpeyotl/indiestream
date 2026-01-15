// GET /api/notifications - Get user's notifications
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const offset = Number(query.offset) || 0

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch notifications:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data || []
})
