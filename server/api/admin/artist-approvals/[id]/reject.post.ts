// POST /api/admin/artist-approvals/[id]/reject - Reject an artist profile
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

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

  const bandId = getRouterParam(event, 'id')
  if (!bandId) {
    throw createError({ statusCode: 400, statusMessage: 'Band ID required' })
  }

  const body = await readBody(event)
  const reason = body.reason

  if (!reason || reason.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Rejection reason required' })
  }

  // Get band details for notification
  const { data: band, error: fetchError } = await client
    .from('bands')
    .select('id, name, owner_id, status')
    .eq('id', bandId)
    .single()

  if (fetchError || !band) {
    throw createError({ statusCode: 404, statusMessage: 'Artist not found' })
  }

  if (band.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Artist is not pending approval' })
  }

  // Update band status to removed (or could delete entirely)
  const { error: updateError } = await client
    .from('bands')
    .update({
      status: 'removed',
      suspension_reason: reason,
      suspended_at: new Date().toISOString(),
      suspended_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bandId)

  if (updateError) {
    console.error('Failed to reject artist:', updateError)
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  // Create notification for the artist
  if (band.owner_id) {
    await client.from('notifications').insert({
      user_id: band.owner_id,
      type: 'artist_rejected',
      title: 'Artist Profile Not Approved',
      message: `Your artist profile "${band.name}" was not approved: ${reason}`,
      link: '/dashboard',
    })
  }

  return {
    success: true,
    message: 'Artist rejected',
  }
})
