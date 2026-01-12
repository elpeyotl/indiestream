// Like a track
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to like tracks',
    })
  }

  const body = await readBody(event)
  const trackId = body.trackId as string

  if (!trackId) {
    throw createError({
      statusCode: 400,
      message: 'trackId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('like_track', {
    p_track_id: trackId,
  })

  if (error) {
    console.error('Failed to like track:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to like track',
    })
  }

  return { success: data }
})
