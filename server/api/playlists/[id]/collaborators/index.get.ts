import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  // Fetch collaborators with user profiles
  const { data: collaborators, error } = await client
    .from('playlist_collaborators')
    .select(`
      id,
      user_id,
      role,
      created_at
    `)
    .eq('playlist_id', playlistId)

  if (error) {
    console.error('Failed to fetch collaborators:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch collaborators',
    })
  }

  // Get the playlist owner info
  const { data: playlist } = await client
    .from('playlists')
    .select('owner_id')
    .eq('id', playlistId)
    .single()

  // Fetch profiles for all users
  const userIds = [
    ...(collaborators?.map((c) => c.user_id) || []),
    playlist?.owner_id,
  ].filter(Boolean)

  const { data: profiles } = await client
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

  // Add owner as first collaborator with owner role
  const result = []

  if (playlist?.owner_id) {
    const ownerProfile = profileMap.get(playlist.owner_id)
    result.push({
      id: 'owner',
      user_id: playlist.owner_id,
      role: 'owner',
      display_name: ownerProfile?.display_name || 'Unknown',
      avatar_url: ownerProfile?.avatar_url,
      is_owner: true,
    })
  }

  // Add other collaborators
  for (const collab of collaborators || []) {
    const profile = profileMap.get(collab.user_id)
    result.push({
      ...collab,
      display_name: profile?.display_name || 'Unknown',
      avatar_url: profile?.avatar_url,
      is_owner: false,
    })
  }

  return result
})
