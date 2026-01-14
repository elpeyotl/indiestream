import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to reorder tracks',
    })
  }

  const body = await readBody(event)
  const { tracks } = body // Array of { id: string, position: number }

  if (!Array.isArray(tracks)) {
    throw createError({
      statusCode: 400,
      message: 'Tracks array is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Check if user can edit
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

  let canEdit = playlist.owner_id === user.id

  if (!canEdit) {
    const { data: collab } = await client
      .from('playlist_collaborators')
      .select('role')
      .eq('playlist_id', playlistId)
      .eq('user_id', user.id)
      .single()

    canEdit = collab?.role === 'editor'
  }

  if (!canEdit) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to edit this playlist',
    })
  }

  // Update positions
  for (const track of tracks) {
    await client
      .from('playlist_tracks')
      .update({ position: track.position })
      .eq('id', track.id)
      .eq('playlist_id', playlistId)
  }

  // Update playlist updated_at
  await client
    .from('playlists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', playlistId)

  return { success: true }
})
