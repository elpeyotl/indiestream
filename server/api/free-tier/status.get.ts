// Get free tier status for current user
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    return {
      playsUsed: 0,
      playsRemaining: 5,
      resetsAt: null,
      isSubscribed: false,
      isAuthenticated: false,
    }
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('get_free_tier_status')

  if (error) {
    console.error('Failed to get free tier status:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get free tier status',
    })
  }

  const status = data?.[0]

  return {
    playsUsed: status?.plays_used ?? 0,
    playsRemaining: status?.plays_remaining ?? 5,
    resetsAt: status?.resets_at ?? null,
    isSubscribed: status?.is_subscribed ?? false,
    isAuthenticated: true,
  }
})
