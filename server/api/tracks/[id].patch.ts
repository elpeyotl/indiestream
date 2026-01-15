// PATCH /api/tracks/[id] - Update track with re-review logic
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

// Fields that trigger re-review when changed
const SUBSTANTIVE_FIELDS = ['title', 'audio_key', 'is_explicit', 'is_cover']

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const trackId = getRouterParam(event, 'id')
  if (!trackId) {
    throw createError({ statusCode: 400, statusMessage: 'Track ID required' })
  }

  const client = await serverSupabaseServiceRole(event)
  const body = await readBody(event)

  // Get current track to check ownership and compare fields
  const { data: currentTrack, error: fetchError } = await client
    .from('tracks')
    .select('*, band:bands!band_id(owner_id)')
    .eq('id', trackId)
    .single()

  if (fetchError || !currentTrack) {
    throw createError({ statusCode: 404, statusMessage: 'Track not found' })
  }

  // Verify ownership (user must own the band)
  if (currentTrack.band?.owner_id !== user.id) {
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

  // Check if any substantive field changed
  const hasSubstantiveChanges = SUBSTANTIVE_FIELDS.some(field => {
    if (body[field] === undefined) return false
    return body[field] !== currentTrack[field]
  })

  // Build update object
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  // Copy allowed fields from body
  const allowedFields = [
    'title', 'track_number', 'duration_seconds', 'audio_key',
    'preview_start_seconds', 'is_explicit', 'lyrics',
    'isrc', 'iswc', 'is_cover', 'spotify_track_id', 'musicbrainz_work_id'
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  // If substantive changes, reset moderation status
  let wasResetToReview = false
  if (hasSubstantiveChanges && currentTrack.moderation_status !== 'pending') {
    updateData.moderation_status = 'pending'
    updateData.moderation_notes = null
    updateData.moderated_at = null
    updateData.moderated_by = null
    wasResetToReview = true
  }

  // Update track
  const { data: updatedTrack, error: updateError } = await client
    .from('tracks')
    .update(updateData)
    .eq('id', trackId)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update track:', updateError)
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  // If reset to review, update/create moderation queue entry
  if (wasResetToReview) {
    const { error: queueError } = await client
      .from('moderation_queue')
      .upsert({
        track_id: trackId,
        band_id: currentTrack.band_id,
        submitted_by: currentTrack.band?.owner_id,
        status: 'pending',
        priority: 'normal',
        notes: null,
        reviewed_by: null,
        reviewed_at: null,
      }, {
        onConflict: 'track_id',
      })

    if (queueError) {
      console.error('Failed to update moderation queue:', queueError)
      // Don't fail the request, track is already updated
    }
  }

  return {
    success: true,
    track: updatedTrack,
    wasResetToReview,
  }
})
