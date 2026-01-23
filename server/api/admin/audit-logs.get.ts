// GET /api/admin/audit-logs - Get paginated audit logs with filtering
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Verify user authentication
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

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = (page - 1) * limit

  // Filters
  const entityType = query.entity_type as string
  const action = query.action as string
  const adminId = query.admin_id as string
  const entityId = query.entity_id as string
  const startDate = query.start_date as string
  const endDate = query.end_date as string
  const search = query.search as string

  // Build query
  // Note: Uses 'as any' because admin_audit_logs types are generated after migration is applied
  let dbQuery = (client as any)
    .from('admin_audit_logs')
    .select(
      `
      *,
      admin:profiles!admin_id (
        id,
        email,
        display_name
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Apply filters
  if (entityType && entityType !== 'all') {
    dbQuery = dbQuery.eq('entity_type', entityType)
  }
  if (action && action !== 'all') {
    dbQuery = dbQuery.ilike('action', `%${action}%`)
  }
  if (adminId) {
    dbQuery = dbQuery.eq('admin_id', adminId)
  }
  if (entityId) {
    dbQuery = dbQuery.eq('entity_id', entityId)
  }
  if (startDate) {
    dbQuery = dbQuery.gte('created_at', startDate)
  }
  if (endDate) {
    // Add time to include the full end date
    dbQuery = dbQuery.lte('created_at', `${endDate}T23:59:59.999Z`)
  }
  if (search) {
    dbQuery = dbQuery.or(`summary.ilike.%${search}%,entity_name.ilike.%${search}%`)
  }

  // Pagination
  dbQuery = dbQuery.range(offset, offset + limit - 1)

  const { data: logs, count, error } = await dbQuery

  if (error) {
    console.error('Failed to fetch audit logs:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch audit logs' })
  }

  return {
    logs: logs || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
