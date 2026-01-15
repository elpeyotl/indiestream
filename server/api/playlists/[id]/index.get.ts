import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)
  const serviceClient = await serverSupabaseServiceRole(event)

  // Check if moderation filtering is enabled
  const { data: moderationSetting } = await serviceClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'require_track_moderation')
    .single()
  const requireModeration = moderationSetting?.value === true || moderationSetting?.value === 'true'

  // Fetch playlist with tracks and collaborators
  const { data: playlist, error } = await client
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
      updated_at,
      playlist_tracks (
        id,
        position,
        added_by,
        created_at,
        track:tracks (
          id,
          title,
          duration_seconds,
          track_number,
          audio_key,
          moderation_status,
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
      ),
      playlist_collaborators (
        id,
        user_id,
        role,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        message: 'Playlist not found',
      })
    }
    console.error('Failed to fetch playlist:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch playlist',
    })
  }

  // Determine user's role
  let role = 'viewer'
  let canEdit = false

  if (user) {
    if (playlist.owner_id === user.id) {
      role = 'owner'
      canEdit = true
    } else {
      const collab = playlist.playlist_collaborators?.find(
        (c: { user_id: string; role: string }) => c.user_id === user.id
      )
      if (collab) {
        role = collab.role
        canEdit = collab.role === 'editor'
      }
    }
  }

  // Sort tracks by position and filter by moderation status if enabled
  let sortedTracks = playlist.playlist_tracks?.sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  ) || []

  // Filter out non-approved tracks if moderation is enabled
  if (requireModeration) {
    sortedTracks = sortedTracks.filter(
      (pt: { track: { moderation_status?: string } }) =>
        pt.track?.moderation_status === 'approved'
    )
  }

  return {
    ...playlist,
    playlist_tracks: sortedTracks,
    role,
    canEdit,
  }
})
