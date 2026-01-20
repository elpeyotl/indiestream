import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to view playlists',
    })
  }

  const client = await serverSupabaseClient(event)

  // Get playlists owned by user
  const { data: ownedPlaylists, error: ownedError } = await client
    .from('playlists')
    .select(`
      id,
      title,
      description,
      is_public,
      share_token,
      track_count,
      owner_id,
      created_at,
      updated_at
    `)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (ownedError) {
    console.error('Failed to fetch owned playlists:', ownedError)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch playlists',
    })
  }

  // Get playlists where user is a collaborator
  const { data: collaborations, error: collabError } = await client
    .from('playlist_collaborators')
    .select(`
      role,
      playlist:playlists (
        id,
        title,
        description,
        is_public,
        share_token,
        track_count,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)

  if (collabError) {
    console.error('Failed to fetch collaborated playlists:', collabError)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch playlists',
    })
  }

  // Merge and dedupe playlists
  const playlistMap = new Map<string, any>()

  // Add owned playlists with 'owner' role
  for (const playlist of ownedPlaylists || []) {
    playlistMap.set(playlist.id, { ...playlist, role: 'owner' })
  }

  // Add collaborated playlists with their role
  for (const collab of collaborations || []) {
    const playlist = collab.playlist as any
    if (playlist && !playlistMap.has(playlist.id)) {
      playlistMap.set(playlist.id, { ...playlist, role: collab.role })
    }
  }

  // Get all unique owner IDs to fetch their profiles
  const ownerIds = [...new Set(Array.from(playlistMap.values()).map(p => p.owner_id).filter(Boolean))]

  // Fetch owner profiles
  const { data: owners } = ownerIds.length > 0
    ? await client
        .from('profiles')
        .select('id, display_name')
        .in('id', ownerIds)
    : { data: [] }

  const ownerMap = new Map((owners || []).map(o => [o.id, o]))

  // Fetch collaborators for all playlists
  const playlistIds = Array.from(playlistMap.keys())
  const { data: allCollaborators } = playlistIds.length > 0
    ? await client
        .from('playlist_collaborators')
        .select('playlist_id, user_id')
        .in('playlist_id', playlistIds)
    : { data: [] }

  // Get profiles for all collaborators
  const collaboratorUserIds = [...new Set((allCollaborators || []).map(c => c.user_id).filter(Boolean))]
  const { data: collaboratorProfiles } = collaboratorUserIds.length > 0
    ? await client
        .from('profiles')
        .select('id, display_name')
        .in('id', collaboratorUserIds)
    : { data: [] }

  const collaboratorProfileMap = new Map((collaboratorProfiles || []).map(p => [p.id, p]))

  // Group collaborators by playlist
  const playlistCollaboratorsMap = new Map<string, Array<{ id: string; display_name: string | null }>>()
  for (const collab of allCollaborators || []) {
    const profile = collaboratorProfileMap.get(collab.user_id)
    if (profile) {
      const existing = playlistCollaboratorsMap.get(collab.playlist_id) || []
      existing.push({ id: profile.id, display_name: profile.display_name })
      playlistCollaboratorsMap.set(collab.playlist_id, existing)
    }
  }

  // Convert to array, add owner info, and sort by updated_at
  const playlists = Array.from(playlistMap.values())
    .map(playlist => ({
      ...playlist,
      owner: ownerMap.get(playlist.owner_id) || null,
      collaborators: playlistCollaboratorsMap.get(playlist.id) || [],
    }))
    .sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

  return playlists
})
