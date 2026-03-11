// POST /api/admin/moderation-queue/[id]/approve - Approve track
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { createAuditLog } from '~/server/utils/auditLog'
import { sendUploadApprovedEmail } from '~/server/utils/email'

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
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const queueId = getRouterParam(event, 'id')
  if (!queueId) {
    throw createError({ statusCode: 400, statusMessage: 'Queue ID required' })
  }

  const body = await readBody(event)
  const notes = body.notes || null

  // Get queue item with track and band info for notification
  const { data: queueItem } = await client
    .from('moderation_queue')
    .select(`
      track_id,
      submitted_by,
      band_id,
      track:tracks!track_id(title, album_id, moderation_status, moderation_notes),
      band:bands!band_id(name)
    `)
    .eq('id', queueId)
    .single()

  if (!queueItem) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  const track = queueItem.track as { title: string; album_id: string; moderation_status: string; moderation_notes: string | null } | null
  const band = queueItem.band as { name: string } | null

  // Call approve_track function
  const { error } = await client.rpc('approve_track', {
    p_track_id: queueItem.track_id,
    p_notes: notes,
  })

  if (error) {
    console.error('Failed to approve track:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Create audit log
  await createAuditLog(client, {
    adminId: user.id,
    action: 'track.approve',
    entityType: 'track',
    entityId: queueItem.track_id,
    entityName: track?.title || 'Unknown Track',
    summary: `Approved track "${track?.title || 'Unknown'}" from band "${band?.name || 'Unknown'}"`,
    oldValue: {
      moderation_status: track?.moderation_status || 'pending',
      moderation_notes: track?.moderation_notes,
    },
    newValue: {
      moderation_status: 'approved',
      moderation_notes: notes,
    },
    metadata: notes ? { notes } : undefined,
  })

  // Create notification for the artist
  if (queueItem.submitted_by) {
    const trackTitle = track?.title || 'Your track'
    await client.from('notifications').insert({
      user_id: queueItem.submitted_by,
      type: 'track_approved',
      title: 'Track Approved',
      message: `Your track "${trackTitle}" has been approved and is now live.`,
      link: `/dashboard/artist/${queueItem.band_id}`,
    })
  }

  // Check if ALL tracks of this album are now approved — send contract email if so
  if (track?.album_id && queueItem.submitted_by) {
    try {
      // Get all tracks for this album
      const { data: albumTracks } = await client
        .from('tracks')
        .select('id, title, moderation_status')
        .eq('album_id', track.album_id)

      const allApproved = albumTracks && albumTracks.length > 0 &&
        albumTracks.every(t => t.moderation_status === 'approved')

      if (allApproved) {
        // Get album details
        const { data: album } = await client
          .from('albums')
          .select('id, title, created_at, terms_version, terms_accepted_at, ip_address')
          .eq('id', track.album_id)
          .single()

        // Get artist profile
        const { data: artistProfile } = await client
          .from('profiles')
          .select('display_name, email')
          .eq('id', queueItem.submitted_by)
          .single()

        if (album && artistProfile) {
          const approvalDate = new Date().toISOString()
          const trackTitles = albumTracks.map(t => t.title)

          await sendUploadApprovedEmail({
            to: artistProfile.email,
            displayName: artistProfile.display_name || 'Artist',
            email: artistProfile.email,
            uploadId: album.id,
            uploadType: 'Music Upload',
            albumTitle: album.title,
            submissionDate: album.terms_accepted_at || album.created_at || approvalDate,
            approvalDate,
            adminName: profile.display_name || 'Fairtune Team',
            numberOfTracks: albumTracks.length,
            trackList: trackTitles,
            termsVersion: album.terms_version || '2026-02',
            ipAddress: album.ip_address || null,
            dashboardUrl: `/dashboard/artist/${queueItem.band_id}`,
          })

          console.log(`[Email] Upload approved email sent for album "${album.title}" to ${artistProfile.email}`)
        }
      }
    } catch (emailError) {
      // Don't fail the approval if email sending fails
      console.error('[Email] Failed to send upload approved email:', emailError)
    }
  }

  return {
    success: true,
    message: 'Track approved successfully',
  }
})
