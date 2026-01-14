import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to invite collaborators',
    })
  }

  const body = await readBody(event)
  const { email, role = 'viewer' } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required',
    })
  }

  if (!['editor', 'viewer'].includes(role)) {
    throw createError({
      statusCode: 400,
      message: 'Role must be either "editor" or "viewer"',
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

  if (playlist.owner_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Only the playlist owner can invite collaborators',
    })
  }

  // Find user by email
  const { data: targetUser } = await client
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      message: 'User not found with that email',
    })
  }

  if (targetUser.id === user.id) {
    throw createError({
      statusCode: 400,
      message: 'You cannot invite yourself',
    })
  }

  // Add collaborator
  const { data: collaborator, error } = await client
    .from('playlist_collaborators')
    .upsert({
      playlist_id: playlistId,
      user_id: targetUser.id,
      role,
      invited_by: user.id,
    }, {
      onConflict: 'playlist_id,user_id',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add collaborator:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to add collaborator',
    })
  }

  return collaborator
})
