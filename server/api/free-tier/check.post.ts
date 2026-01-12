// Check if user can play a full track (for pre-play validation)
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    return {
      canPlay: false,
      reason: 'unauthenticated',
    }
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('check_free_play_allowance')

  if (error) {
    console.error('Failed to check free play allowance:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to check free play allowance',
    })
  }

  // data is the return value: 'allowed', 'limit_reached', or 'subscribed'
  const status = data as string

  return {
    canPlay: status === 'allowed' || status === 'subscribed',
    reason: status,
    isSubscribed: status === 'subscribed',
    isFree: status === 'allowed' || status === 'limit_reached',
  }
})
