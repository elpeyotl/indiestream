// Check if track(s) are liked - supports single trackId or comma-separated trackIds
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    return { likedIds: [] }
  }

  const query = getQuery(event)
  const trackIds = query.trackIds as string

  if (!trackIds) {
    throw createError({
      statusCode: 400,
      message: 'trackIds is required',
    })
  }

  const client = await serverSupabaseClient(event)
  const ids = trackIds.split(',').filter(Boolean)

  const { data, error } = await client.rpc('get_liked_track_ids', {
    p_track_ids: ids,
  })

  if (error) {
    console.error('Failed to check track status:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to check track status',
    })
  }

  return { likedIds: data || [] }
})
