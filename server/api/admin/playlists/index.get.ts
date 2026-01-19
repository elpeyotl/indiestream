// GET /api/admin/playlists - List all playlists for admin management
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
  const page = parseInt(query.page as string) || 0
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const search = query.search as string || ''
  const filter = query.filter as string || 'all' // all, featured, curated, public

  // Build query - note: owner_id references auth.users, not profiles directly
  // We need to fetch playlists first, then get owner info separately
  let dbQuery = client
    .from('playlists')
    .select(`
      id,
      title,
      description,
      is_public,
      is_featured,
      is_curated,
      featured_at,
      track_count,
      cover_key,
      created_at,
      owner_id
    `, { count: 'exact' })

  // Apply filters
  if (filter === 'featured') {
    dbQuery = dbQuery.eq('is_featured', true)
  } else if (filter === 'curated') {
    dbQuery = dbQuery.eq('is_curated', true)
  } else if (filter === 'public') {
    dbQuery = dbQuery.eq('is_public', true)
  } else if (filter === 'private') {
    dbQuery = dbQuery.eq('is_public', false)
  }

  // Search
  if (search) {
    dbQuery = dbQuery.ilike('title', `%${search}%`)
  }

  // Pagination and ordering
  dbQuery = dbQuery
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  const { data: playlists, error, count } = await dbQuery

  if (error) {
    console.error('Failed to fetch playlists:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch playlists' })
  }

  // Get owner info for each playlist
  const ownerIds = [...new Set((playlists || []).map(p => p.owner_id).filter(Boolean))]
  const { data: owners } = ownerIds.length > 0
    ? await client
        .from('profiles')
        .select('id, display_name, email')
        .in('id', ownerIds)
    : { data: [] }

  const ownerMap = new Map((owners || []).map(o => [o.id, o]))

  // Attach owner info to playlists
  const playlistsWithOwners = (playlists || []).map(p => ({
    ...p,
    owner: ownerMap.get(p.owner_id) || null,
  }))

  return {
    playlists: playlistsWithOwners,
    total: count || 0,
    page,
    limit,
  }
})
