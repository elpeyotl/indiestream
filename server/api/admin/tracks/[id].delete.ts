// DELETE /api/admin/tracks/[id] - Delete track and associated data
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { deleteFromR2 } from '~/server/utils/r2'
import { sendTrackRemovedEmail } from '~/server/utils/email'
import { createAuditLog, extractTrackSnapshot } from '~/server/utils/auditLog'

export default defineEventHandler(async (event) => {
  // Verify admin access
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const trackId = getRouterParam(event, 'id')
  if (!trackId) {
    throw createError({ statusCode: 400, statusMessage: 'Track ID required' })
  }

  // Get query params for removal reason (optional)
  const query = getQuery(event)
  const reason = query.reason as 'copyright' | 'ai_generated' | 'inappropriate' | 'other' | undefined
  const details = query.details as string | undefined

  // Get track info with album and band details for email and audit log
  const { data: track } = await client
    .from('tracks')
    .select(`
      *,
      album:albums!inner(
        id,
        title,
        band_id,
        band:bands!inner(
          id,
          name,
          owner_id
        )
      )
    `)
    .eq('id', trackId)
    .single()

  if (!track) {
    throw createError({ statusCode: 404, statusMessage: 'Track not found' })
  }

  const albumTitle = (track.album as any).title
  const bandName = (track.album as any).band.name

  // Get artist email for notification
  const { data: ownerProfile } = await client
    .from('profiles')
    .select('email, display_name')
    .eq('id', (track.album as any).band.owner_id)
    .single()

  // Delete audio file from R2 storage
  if (track.audio_key) {
    try {
      await deleteFromR2(track.audio_key)
      console.log(`Deleted audio file from R2: ${track.audio_key}`)
    } catch (storageError) {
      console.error('Failed to delete audio from R2:', storageError)
      // Non-fatal, continue with database deletion
    }
  }

  // Delete track credits first (foreign key constraint)
  const { error: creditsError } = await client
    .from('track_credits')
    .delete()
    .eq('track_id', trackId)

  if (creditsError) {
    console.error('Failed to delete track credits:', creditsError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete track credits' })
  }

  // Delete stream counts (if exists)
  const { error: streamsError } = await client
    .from('stream_counts')
    .delete()
    .eq('track_id', trackId)

  if (streamsError) {
    console.error('Failed to delete stream counts:', streamsError)
    // Non-fatal, continue with deletion
  }

  // Delete content reports for this track
  const { error: reportsError } = await client
    .from('content_reports')
    .delete()
    .eq('track_id', trackId)

  if (reportsError) {
    console.error('Failed to delete content reports:', reportsError)
    // Non-fatal, continue with deletion
  }

  // Delete track
  const { error: trackError } = await client
    .from('tracks')
    .delete()
    .eq('id', trackId)

  if (trackError) {
    console.error('Failed to delete track:', trackError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete track' })
  }

  // Create audit log
  await createAuditLog(client, {
    adminId: user.id,
    action: 'track.delete',
    entityType: 'track',
    entityId: trackId,
    entityName: track.title,
    summary: `Deleted track "${track.title}" from album "${albumTitle}" by "${bandName}"`,
    oldValue: extractTrackSnapshot(track),
    newValue: null,
    metadata: {
      album_title: albumTitle,
      band_name: bandName,
      removal_reason: reason,
      removal_details: details,
    },
  })

  // Send email notification to artist
  if (ownerProfile?.email && reason) {
    try {
      await sendTrackRemovedEmail({
        to: ownerProfile.email,
        artistName: ownerProfile.display_name || 'Artist',
        trackTitle: track.title,
        albumTitle,
        bandName,
        reason,
        details,
      })
      console.log(`Sent track removal notification to ${ownerProfile.email}`)
    } catch (emailError) {
      console.error('Failed to send track removal email:', emailError)
      // Non-fatal, track is already deleted
    }
  }

  return {
    success: true,
    message: 'Track deleted successfully',
  }
})
