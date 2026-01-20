// POST /api/tracks/release-isrc - Release a platform-assigned ISRC from a track
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { trackId } = body

  if (!trackId) {
    throw createError({ statusCode: 400, statusMessage: 'Track ID is required' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Get the track and verify ownership
  const { data: track, error: trackError } = await client
    .from('tracks')
    .select('id, band_id, isrc, isrc_platform_assigned, band:bands!band_id(owner_id)')
    .eq('id', trackId)
    .single()

  if (trackError || !track) {
    throw createError({ statusCode: 404, statusMessage: 'Track not found' })
  }

  // Verify user owns the band
  if (track.band?.owner_id !== user.id) {
    // Check if user is admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'You do not own this track' })
    }
  }

  // Check if track has platform-assigned ISRC
  if (!track.isrc_platform_assigned) {
    throw createError({ statusCode: 400, statusMessage: 'Track does not have a platform-assigned ISRC' })
  }

  // Release the ISRC
  const { data: released, error: releaseError } = await client
    .rpc('release_platform_isrc', { p_track_id: trackId })

  if (releaseError) {
    console.error('Failed to release ISRC:', releaseError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to release ISRC' })
  }

  // Clear the ISRC from the track
  const { error: updateError } = await client
    .from('tracks')
    .update({
      isrc: null,
      isrc_platform_assigned: false,
    })
    .eq('id', trackId)

  if (updateError) {
    console.error('Failed to clear track ISRC:', updateError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to clear ISRC from track' })
  }

  return {
    success: true,
    released: released as boolean,
  }
})
