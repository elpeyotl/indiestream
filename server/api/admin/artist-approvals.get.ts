// GET /api/admin/artist-approvals - List pending artist profiles for approval
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
  const status = (query.status as string) || 'pending'
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const offset = (page - 1) * limit

  // Build query for bands
  let bandsQuery = client
    .from('bands')
    .select(`
      id,
      name,
      slug,
      bio,
      location,
      website,
      avatar_key,
      genres,
      status,
      created_at,
      instagram,
      twitter,
      facebook,
      youtube,
      spotify,
      soundcloud,
      bandcamp,
      tiktok,
      owner:profiles!owner_id(id, email, display_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Filter by status
  if (status !== 'all') {
    bandsQuery = bandsQuery.eq('status', status)
  }

  const { data: bands, error, count } = await bandsQuery

  if (error) {
    console.error('Failed to fetch artist approvals:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Generate avatar URLs from avatar_key
  const bandsWithUrls = await Promise.all(
    (bands || []).map(async (band) => {
      let avatar_url = null
      if (band.avatar_key) {
        try {
          const { getSignedUrl } = await import('~/server/utils/r2')
          avatar_url = await getSignedUrl(band.avatar_key)
        } catch (e) {
          console.error('Failed to get avatar URL for band:', band.id, e)
        }
      }
      return {
        ...band,
        avatar_url,
      }
    })
  )

  // Get stats for all statuses
  const [
    { count: pendingCount },
    { count: activeCount },
    { count: rejectedCount },
  ] = await Promise.all([
    client.from('bands').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    client.from('bands').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    client.from('bands').select('*', { count: 'exact', head: true }).eq('status', 'removed'),
  ])

  const stats = {
    total: (pendingCount || 0) + (activeCount || 0) + (rejectedCount || 0),
    pending: pendingCount || 0,
    active: activeCount || 0,
    rejected: rejectedCount || 0,
  }

  return {
    bands: bandsWithUrls,
    total: count || 0,
    pendingCount: pendingCount || 0,
    stats,
    page,
    limit,
  }
})
