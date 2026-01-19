// GET /api/admin/dmca - List all DMCA requests
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

  const query = getQuery(event)
  const status = query.status as string || 'all'
  const page = parseInt(query.page as string) || 0
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)

  let dbQuery = client
    .from('dmca_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    dbQuery = dbQuery.eq('status', status)
  }

  dbQuery = dbQuery.range(page * limit, (page + 1) * limit - 1)

  const { data: requests, error, count } = await dbQuery

  if (error) {
    console.error('Failed to fetch DMCA requests:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch DMCA requests' })
  }

  return {
    requests: requests || [],
    total: count || 0,
    page,
    limit,
  }
})
