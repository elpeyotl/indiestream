// GET /api/boost/status - Get user's current Artist Boost status
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { data: boost, error } = await client
    .from('artist_boosts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch boost status:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch boost status' })
  }

  // Return null if no boost, otherwise return boost data
  if (!boost) {
    return { boost: null }
  }

  return {
    boost: {
      id: boost.id,
      amount_cents: boost.amount_cents,
      status: boost.status,
      current_period_start: boost.current_period_start,
      current_period_end: boost.current_period_end,
      created_at: boost.created_at,
    },
  }
})
