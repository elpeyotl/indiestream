import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
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

  const query = getQuery(event)
  const status = query.status as string | undefined
  const limit = parseInt(query.limit as string) || 50
  const offset = parseInt(query.offset as string) || 0

  // Build query
  let reportsQuery = supabase
    .from('content_reports')
    .select(`
      *,
      track:tracks!inner(
        id,
        title,
        isrc,
        album:albums!inner(
          id,
          title,
          slug,
          band:bands!inner(
            id,
            name,
            slug
          )
        )
      ),
      reporter:profiles!content_reports_reporter_id_fkey(
        id,
        display_name,
        email
      ),
      resolver:profiles!content_reports_resolved_by_fkey(
        id,
        display_name
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== 'all') {
    reportsQuery = reportsQuery.eq('status', status)
  }

  const { data: reports, error, count } = await reportsQuery

  if (error) {
    console.error('Failed to fetch reports:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch reports' })
  }

  // Get stats
  const { data: statsData } = await supabase
    .from('content_reports')
    .select('status')

  const stats = {
    total: statsData?.length || 0,
    pending: statsData?.filter(r => r.status === 'pending').length || 0,
    investigating: statsData?.filter(r => r.status === 'investigating').length || 0,
    resolved: statsData?.filter(r => r.status === 'resolved').length || 0,
    dismissed: statsData?.filter(r => r.status === 'dismissed').length || 0,
  }

  return {
    reports,
    count,
    stats,
  }
})
