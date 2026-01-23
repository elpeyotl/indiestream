// POST /api/admin/moderation-queue/[id]/request-revision - Request revision
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { createAuditLog } from '~/server/utils/auditLog'

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

  const queueId = getRouterParam(event, 'id')
  if (!queueId) {
    throw createError({ statusCode: 400, statusMessage: 'Queue ID required' })
  }

  const body = await readBody(event)
  const notes = body.notes

  if (!notes || notes.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Revision notes required' })
  }

  // Get queue item with track and band info for notification
  const { data: queueItem } = await client
    .from('moderation_queue')
    .select(`
      track_id,
      submitted_by,
      band_id,
      track:tracks!track_id(title, moderation_status, moderation_notes),
      band:bands!band_id(name)
    `)
    .eq('id', queueId)
    .single()

  if (!queueItem) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  const track = queueItem.track as { title: string; moderation_status: string; moderation_notes: string | null } | null
  const band = queueItem.band as { name: string } | null

  // Call request_track_revision function
  const { error } = await client.rpc('request_track_revision', {
    p_track_id: queueItem.track_id,
    p_notes: notes,
  })

  if (error) {
    console.error('Failed to request revision:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Create audit log
  await createAuditLog(client, {
    adminId: user.id,
    action: 'track.request_revision',
    entityType: 'track',
    entityId: queueItem.track_id,
    entityName: track?.title || 'Unknown Track',
    summary: `Requested revision for track "${track?.title || 'Unknown'}" from band "${band?.name || 'Unknown'}"`,
    oldValue: {
      moderation_status: track?.moderation_status || 'pending',
      moderation_notes: track?.moderation_notes,
    },
    newValue: {
      moderation_status: 'revision_requested',
      moderation_notes: notes,
    },
    metadata: { revision_notes: notes },
  })

  // Create notification for the artist
  if (queueItem.submitted_by) {
    const trackTitle = track?.title || 'Your track'
    await client.from('notifications').insert({
      user_id: queueItem.submitted_by,
      type: 'track_revision',
      title: 'Revision Requested',
      message: `Your track "${trackTitle}" needs changes: ${notes}`,
      link: `/dashboard/artist/${queueItem.band_id}`,
    })
  }

  return {
    success: true,
    message: 'Revision requested successfully',
  }
})
