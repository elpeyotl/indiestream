import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to add tracks',
    })
  }

  const body = await readBody(event)
  const { trackId } = body

  if (!trackId) {
    throw createError({
      statusCode: 400,
      message: 'Track ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('add_track_to_playlist', {
    p_playlist_id: playlistId,
    p_track_id: trackId,
  })

  if (error) {
    console.error('Failed to add track:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to add track to playlist',
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
