// GET /api/admin/bands - List all bands with admin filters
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

  // Get query parameters
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const search = query.search as string
  const status = query.status as string // active, suspended, removed, all
  const featured = query.featured as string // true, false, all
  const verified = query.verified as string // true, false, all

  const offset = (page - 1) * limit

  // Build query
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
      banner_key,
      theme_color,
      genres,
      is_verified,
      is_featured,
      featured_at,
      featured_by,
      status,
      flag_count,
      suspended_at,
      suspended_by,
      suspension_reason,
      stripe_account_id,
      stripe_onboarding_complete,
      total_streams,
      total_earnings_cents,
      created_at,
      updated_at,
      owner:profiles!owner_id (
        id,
        email,
        display_name
      )
    `, { count: 'exact' })

  // Apply filters
  if (search) {
    bandsQuery = bandsQuery.or(`name.ilike.%${search}%,slug.ilike.%${search}%,location.ilike.%${search}%`)
  }

  if (status && status !== 'all') {
    bandsQuery = bandsQuery.eq('status', status)
  }

  if (featured === 'true') {
    bandsQuery = bandsQuery.eq('is_featured', true)
  } else if (featured === 'false') {
    bandsQuery = bandsQuery.eq('is_featured', false)
  }

  if (verified === 'true') {
    bandsQuery = bandsQuery.eq('is_verified', true)
  } else if (verified === 'false') {
    bandsQuery = bandsQuery.eq('is_verified', false)
  }

  // Order and paginate
  bandsQuery = bandsQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: bands, error, count } = await bandsQuery

  if (error) {
    console.error('Failed to fetch bands:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch bands' })
  }

  // Get album and track counts for each band
  const bandIds = bands?.map(b => b.id) || []

  const { data: albumCounts } = await client
    .from('albums')
    .select('band_id')
    .in('band_id', bandIds)

  const { data: trackCounts } = await client
    .from('tracks')
    .select('band_id')
    .in('band_id', bandIds)

  // Count albums and tracks per band
  const albumCountMap = new Map<string, number>()
  const trackCountMap = new Map<string, number>()

  albumCounts?.forEach(a => {
    albumCountMap.set(a.band_id, (albumCountMap.get(a.band_id) || 0) + 1)
  })

  trackCounts?.forEach(t => {
    trackCountMap.set(t.band_id, (trackCountMap.get(t.band_id) || 0) + 1)
  })

  // Enrich bands with counts
  const enrichedBands = bands?.map(band => ({
    ...band,
    album_count: albumCountMap.get(band.id) || 0,
    track_count: trackCountMap.get(band.id) || 0,
  }))

  return {
    bands: enrichedBands,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
