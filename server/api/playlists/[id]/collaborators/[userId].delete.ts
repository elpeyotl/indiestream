import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const userId = getRouterParam(event, 'userId')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to remove collaborators',
    })
  }

  const client = await serverSupabaseClient(event)

  // Check ownership
  const { data: playlist } = await client
    .from('playlists')
    .select('owner_id')
    .eq('id', playlistId)
    .single()

  if (!playlist) {
    throw createError({
      statusCode: 404,
      message: 'Playlist not found',
    })
  }

  // Allow owner to remove anyone, or user to remove themselves
  if (playlist.owner_id !== user.id && userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the playlist owner can remove collaborators',
    })
  }

  const { error } = await client
    .from('playlist_collaborators')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to remove collaborator:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to remove collaborator',
    })
  }

  return { success: true }
})
