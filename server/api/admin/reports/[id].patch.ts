import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, 'id')
  if (!reportId) {
    throw createError({ statusCode: 400, message: 'Report ID is required' })
  }

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const body = await readBody(event)
  const { status, resolution_notes } = body

  // Validate status
  const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed']
  if (status && !validStatuses.includes(status)) {
    throw createError({
      statusCode: 400,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    })
  }

  // Build update object
  const updateData: Record<string, any> = {}

  if (status) {
    updateData.status = status

    // Set resolved_at and resolved_by when resolving or dismissing
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }
  }

  if (resolution_notes !== undefined) {
    updateData.resolution_notes = resolution_notes
  }

  const { data: report, error } = await supabase
    .from('content_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update report:', error)
    throw createError({ statusCode: 500, message: 'Failed to update report' })
  }

  return {
    success: true,
    report,
  }
})
