import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to update a playlist',
    })
  }

  const body = await readBody(event)
  const { title, description, is_public } = body

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
      message: 'Only the playlist owner can update it',
    })
  }

  // Build update object
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title.trim()
  if (description !== undefined) updates.description = description?.trim() || null
  if (is_public !== undefined) updates.is_public = is_public

  const { data: updated, error } = await client
    .from('playlists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update playlist:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update playlist',
    })
  }

  return updated
})
