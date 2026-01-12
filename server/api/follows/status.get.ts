// API endpoint to check if user is following a band
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    // Not logged in = not following
    return { isFollowing: false }
  }

  const query = getQuery(event)
  const bandId = query.bandId as string

  if (!bandId) {
    throw createError({
      statusCode: 400,
      message: 'bandId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('is_following_band', {
    p_band_id: bandId,
  })

  if (error) {
    console.error('Failed to check follow status:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to check follow status',
    })
  }

  return { isFollowing: data }
})
