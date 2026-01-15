// Get user's liked tracks
import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to view your library',
    })
  }

  const client = await serverSupabaseClient(event)
  const serviceClient = await serverSupabaseServiceRole(event)

  // Check if moderation filtering is enabled
  const { data: moderationSetting } = await serviceClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'require_track_moderation')
    .single()
  const requireModeration = moderationSetting?.value === true || moderationSetting?.value === 'true'

  const { data, error } = await client
    .from('liked_tracks')
    .select(`
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
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch liked tracks:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch liked tracks',
    })
  }

  // Filter out non-approved tracks if moderation is enabled
  let result = data || []
  if (requireModeration) {
    result = result.filter(
      (item: { track: { moderation_status?: string } }) =>
        item.track?.moderation_status === 'approved'
    )
  }

  return result
})
