import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to delete a playlist',
    })
  }

  const client = await serverSupabaseClient(event)

  // Check ownership
  const { data: playlist } = await client
    .from('playlists')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!playlist) {
    throw createError({
      statusCode: 404,
      message: 'Playlist not found',
    })
  }

  if (playlist.owner_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the playlist owner can delete it',
    })
  }

  const { error } = await client
    .from('playlists')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete playlist:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete playlist',
    })
  }

  return { success: true }
})
