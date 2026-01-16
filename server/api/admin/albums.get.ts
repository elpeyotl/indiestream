// GET /api/admin/albums - List all albums with admin filters
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
  const published = query.published as string // true, false, all

  const offset = (page - 1) * limit

  // Build query
  let albumsQuery = client
    .from('albums')
    .select(`
      id,
      band_id,
      title,
      slug,
      description,
      release_type,
      release_date,
      cover_key,
      is_published,
      upc,
      label_name,
      p_line,
      c_line,
      created_at,
      updated_at,
      band:bands!band_id (
        id,
        name,
        slug
      )
    `, { count: 'exact' })

  // Apply filters
  if (search) {
    albumsQuery = albumsQuery.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  if (published === 'true') {
    albumsQuery = albumsQuery.eq('is_published', true)
  } else if (published === 'false') {
    albumsQuery = albumsQuery.eq('is_published', false)
  }

  // Order and paginate
  albumsQuery = albumsQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: albums, error, count } = await albumsQuery

  if (error) {
    console.error('Failed to fetch albums:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch albums' })
  }

  // Get track counts for each album
  const albumIds = albums?.map(a => a.id) || []

  const { data: trackCounts } = await client
    .from('tracks')
    .select('album_id')
    .in('album_id', albumIds)

  // Count tracks per album
  const trackCountMap = new Map<string, number>()
  trackCounts?.forEach(t => {
    trackCountMap.set(t.album_id, (trackCountMap.get(t.album_id) || 0) + 1)
  })

  // Enrich albums with track counts
  const enrichedAlbums = albums?.map(album => ({
    ...album,
    track_count: trackCountMap.get(album.id) || 0,
  }))

  return {
    albums: enrichedAlbums,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
