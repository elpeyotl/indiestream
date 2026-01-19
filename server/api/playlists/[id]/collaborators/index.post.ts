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
  const { email, userId, role = 'viewer' } = body

  if (!email && !userId) {
    throw createError({
      statusCode: 400,
      message: 'Email or userId is required',
    })
  }

  if (!['editor', 'viewer'].includes(role)) {
    throw createError({
      statusCode: 400,
      message: 'Role must be either "editor" or "viewer"',
    })
  }

  const client = await serverSupabaseClient(event)

  // Check ownership and get playlist details
  const { data: playlist } = await client
    .from('playlists')
    .select('owner_id, title')
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

  // Find target user by userId or email
  let targetUserId: string

  if (userId) {
    // Verify user exists
    const { data: targetUser } = await client
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }
    targetUserId = targetUser.id
  } else {
    // Find user by email (legacy support)
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
    targetUserId = targetUser.id
  }

  if (targetUserId === user.id) {
    throw createError({
      statusCode: 400,
      message: 'You cannot invite yourself',
    })
  }

  // Check if already a collaborator
  const { data: existingCollab } = await client
    .from('playlist_collaborators')
    .select('id')
    .eq('playlist_id', playlistId)
    .eq('user_id', targetUserId)
    .single()

  const isNewCollaborator = !existingCollab

  // Add collaborator
  const { data: collaborator, error } = await client
    .from('playlist_collaborators')
    .upsert({
      playlist_id: playlistId,
      user_id: targetUserId,
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

  // Get inviter's display name for notification
  const { data: inviter } = await client
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const inviterName = inviter?.display_name || 'Someone'

  // Send notification to the new collaborator (only for new collaborators, not role updates)
  if (isNewCollaborator) {
    await client
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: 'playlist_collaboration',
        title: 'Added to playlist',
        message: `${inviterName} added you as ${role === 'editor' ? 'an editor' : 'a viewer'} on "${playlist.title}"`,
        link: `/playlist/${playlistId}`,
      })
  }

  return collaborator
})
