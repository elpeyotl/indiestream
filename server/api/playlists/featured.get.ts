// GET /api/playlists/featured - Get featured playlists for discover page
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 10, 20)

  // Get featured playlists (public and featured)
  // Note: owner_id references auth.users, not profiles directly
  const { data: playlists, error } = await client
    .from('playlists')
    .select(`
      id,
      title,
      description,
      cover_key,
      track_count,
      is_curated,
      owner_id
    `)
    .eq('is_featured', true)
    .eq('is_public', true)
    .order('featured_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch featured playlists:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch playlists' })
  }

  // Get owner info for each playlist
  const ownerIds = [...new Set((playlists || []).map(p => p.owner_id).filter(Boolean))]
  const { data: owners } = ownerIds.length > 0
    ? await client
        .from('profiles')
        .select('id, display_name, avatar_key')
        .in('id', ownerIds)
    : { data: [] }

  const ownerMap = new Map((owners || []).map(o => [o.id, o]))

  // Get collaborators for all playlists
  const playlistIds = (playlists || []).map(p => p.id)
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

  // Get first 4 tracks for each playlist (for cover mosaic if no cover image)
  const playlistsWithData = await Promise.all(
    (playlists || []).map(async (playlist) => {
      const { data: tracks } = await client
        .from('playlist_tracks')
        .select(`
          track:tracks!track_id (
            id,
            title,
            album:albums!album_id (
              cover_key
            )
          )
        `)
        .eq('playlist_id', playlist.id)
        .order('position', { ascending: true })
        .limit(4)

      return {
        ...playlist,
        owner: ownerMap.get(playlist.owner_id) || null,
        collaborators: playlistCollaboratorsMap.get(playlist.id) || [],
        previewTracks: tracks?.map(t => t.track) || [],
      }
    })
  )

  return { playlists: playlistsWithData }
})
