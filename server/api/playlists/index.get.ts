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

  // Convert to array and sort by updated_at
  const playlists = Array.from(playlistMap.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return playlists
})
