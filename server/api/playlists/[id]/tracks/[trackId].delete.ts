import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const trackId = getRouterParam(event, 'trackId')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to remove tracks',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('remove_track_from_playlist', {
    p_playlist_id: playlistId,
    p_track_id: trackId,
  })

  if (error) {
    console.error('Failed to remove track:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to remove track from playlist',
    })
  }

  if (!data) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to edit this playlist',
    })
  }

  return { success: true }
})
