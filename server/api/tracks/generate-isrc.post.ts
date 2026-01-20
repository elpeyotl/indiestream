// POST /api/tracks/generate-isrc - Generate a platform ISRC code for a track
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { bandId, trackId } = body

  if (!bandId) {
    throw createError({ statusCode: 400, statusMessage: 'Band ID is required' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Verify user owns the band
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, owner_id')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    throw createError({ statusCode: 404, statusMessage: 'Band not found' })
  }

  if (band.owner_id !== user.id) {
    // Check if user is admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'You do not own this band' })
    }
  }

  // If trackId provided, verify track belongs to band and doesn't already have platform ISRC
  if (trackId) {
    const { data: track, error: trackError } = await client
      .from('tracks')
      .select('id, band_id, isrc, isrc_platform_assigned')
      .eq('id', trackId)
      .single()

    if (trackError || !track) {
      throw createError({ statusCode: 404, statusMessage: 'Track not found' })
    }

    if (track.band_id !== bandId) {
      throw createError({ statusCode: 403, statusMessage: 'Track does not belong to this band' })
    }

    if (track.isrc_platform_assigned) {
      throw createError({ statusCode: 409, statusMessage: 'Track already has a platform-assigned ISRC' })
    }
  }

  // Allocate a platform ISRC
  const { data: isrcResult, error: allocError } = await client
    .rpc('allocate_platform_isrc', { p_band_id: bandId })

  if (allocError) {
    console.error('Failed to allocate ISRC:', allocError)
    if (allocError.message?.includes('exhausted')) {
      throw createError({ statusCode: 503, statusMessage: 'ISRC codes temporarily unavailable. Please contact support.' })
    }
    if (allocError.message?.includes('No ISRC range configured')) {
      throw createError({ statusCode: 503, statusMessage: 'ISRC code generation not available for the current year.' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate ISRC code' })
  }

  const isrc = isrcResult as string

  // If trackId provided, assign the ISRC to the track
  if (trackId) {
    const { error: assignError } = await client
      .rpc('assign_platform_isrc_to_track', { p_track_id: trackId, p_isrc: isrc })

    if (assignError) {
      console.error('Failed to assign ISRC to track:', assignError)
      // Try to release the allocated ISRC since we couldn't assign it
      await client.rpc('release_platform_isrc', { p_track_id: trackId }).catch(() => {})
      throw createError({ statusCode: 500, statusMessage: 'Failed to assign ISRC to track' })
    }
  }

  return {
    success: true,
    isrc,
    platformAssigned: true,
  }
})
