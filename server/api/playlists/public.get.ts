// GET /api/playlists/public - Get all public playlists with optional curated filter
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = parseInt(query.offset as string) || 0
  const curated = query.curated === 'true'

  // Build query for public playlists
  let playlistQuery = client
    .from('playlists')
    .select(`
      id,
      title,
      description,
      cover_key,
      track_count,
      is_curated,
      owner_id,
      created_at
    `, { count: 'exact' })
    .eq('is_public', true)
    .gt('track_count', 0) // Only playlists with tracks

  // Filter by curated if requested
  if (curated) {
    playlistQuery = playlistQuery.eq('is_curated', true)
  }

  // Order: curated first, then by track count
  playlistQuery = playlistQuery
    .order('is_curated', { ascending: false })
    .order('track_count', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: playlists, error, count } = await playlistQuery

  if (error) {
    console.error('Failed to fetch public playlists:', error)
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
        previewTracks: tracks?.map(t => t.track) || [],
      }
    })
  )

  return {
    playlists: playlistsWithData,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
})
