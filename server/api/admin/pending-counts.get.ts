// GET /api/admin/pending-counts - Get pending counts for all admin tabs
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

  // Fetch all counts in parallel for efficiency
  const [
    moderationResult,
    artistsResult,
    reportsResult,
    dmcaResult,
  ] = await Promise.all([
    // Pending track moderation
    client
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('moderation_status', 'pending'),

    // Pending artist approvals
    client
      .from('bands')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Pending content reports
    client
      .from('content_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Pending DMCA requests
    client
      .from('dmca_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return {
    moderation: moderationResult.count || 0,
    artists: artistsResult.count || 0,
    reports: reportsResult.count || 0,
    dmca: dmcaResult.count || 0,
  }
})
