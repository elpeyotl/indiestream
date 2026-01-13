// Admin Users API - List all users with their data
import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  // Verify user is admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  // Use service role client to bypass RLS for admin queries
  const serviceClient = serverSupabaseServiceRole(event)

  // Get query params
  const query = getQuery(event)
  const search = (query.search as string) || ''
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const offset = (page - 1) * limit

  // Build query for profiles
  let profilesQuery = serviceClient
    .from('profiles')
    .select(`
      id,
      email,
      display_name,
      role,
      created_at,
      updated_at
    `, { count: 'exact' })

  // Search filter
  if (search) {
    profilesQuery = profilesQuery.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  // Pagination and ordering
  profilesQuery = profilesQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: profiles, error: profilesError, count } = await profilesQuery

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch users' })
  }

  // Get band counts for each user
  const userIds = profiles?.map(p => p.id) || []

  const { data: bandCounts } = await serviceClient
    .from('bands')
    .select('owner_id')
    .in('owner_id', userIds)

  // Count bands per user
  const bandCountMap = new Map<string, number>()
  for (const band of bandCounts || []) {
    bandCountMap.set(band.owner_id, (bandCountMap.get(band.owner_id) || 0) + 1)
  }

  // Get stream counts for each user
  const { data: streamCounts } = await serviceClient
    .from('listening_history')
    .select('user_id')
    .in('user_id', userIds)
    .eq('completed', true)

  // Count streams per user
  const streamCountMap = new Map<string, number>()
  for (const stream of streamCounts || []) {
    streamCountMap.set(stream.user_id, (streamCountMap.get(stream.user_id) || 0) + 1)
  }

  // Combine data
  const users = profiles?.map(p => ({
    ...p,
    band_count: bandCountMap.get(p.id) || 0,
    stream_count: streamCountMap.get(p.id) || 0,
  })) || []

  return {
    users,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
