import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const client = await serverSupabaseClient(event)

  // Fetch public playlist by share token
  const { data: playlist, error } = await client
    .from('playlists')
    .select(`
      id,
      title,
      description,
      is_public,
      track_count,
      owner_id,
      created_at,
      playlist_tracks (
        id,
        position,
        created_at,
        track:tracks (
          id,
          title,
          duration_seconds,
          track_number,
          audio_key,
          album:albums (
            id,
            title,
            slug,
            cover_url,
            cover_key,
            band:bands (
              id,
              name,
              slug
            )
          )
        )
      )
    `)
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (error || !playlist) {
    throw createError({
      statusCode: 404,
      message: 'Playlist not found or not public',
    })
  }

  // Get owner profile
  const { data: ownerProfile } = await client
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', playlist.owner_id)
    .single()

  // Sort tracks by position
  const sortedTracks = playlist.playlist_tracks?.sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  ) || []

  return {
    ...playlist,
    playlist_tracks: sortedTracks,
    owner: ownerProfile || { id: playlist.owner_id, display_name: 'Unknown' },
    canEdit: false,
    role: 'viewer',
  }
})
