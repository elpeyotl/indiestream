// PATCH /api/admin/dmca/[id] - Update DMCA request status
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

  const requestId = getRouterParam(event, 'id')
  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Request ID required' })
  }

  const body = await readBody(event)
  const updates: Record<string, any> = {}

  // Handle status update
  if (body.status !== undefined) {
    const validStatuses = ['pending', 'processing', 'content_removed', 'counter_notice', 'resolved', 'rejected']
    if (!validStatuses.includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
    }
    updates.status = body.status
    updates.processed_at = new Date().toISOString()
    updates.processed_by = user.id
  }

  // Handle admin notes
  if (body.admin_notes !== undefined) {
    updates.admin_notes = body.admin_notes
  }

  // Handle counter notice tracking
  if (body.counter_notice_received !== undefined) {
    updates.counter_notice_received = body.counter_notice_received
    if (body.counter_notice_received) {
      updates.counter_notice_date = new Date().toISOString()
    }
  }

  if (body.counter_notice_details !== undefined) {
    updates.counter_notice_details = body.counter_notice_details
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No updates provided' })
  }

  const { data: request, error } = await client
    .from('dmca_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update DMCA request:', error)
    throw createError({ statusCode: 500, message: 'Failed to update DMCA request' })
  }

  return { success: true, request }
})
