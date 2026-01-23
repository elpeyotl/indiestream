// GET /api/releases/recent - All new releases chronologically (NOT by popularity)
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = parseInt(query.offset as string) || 0
  const days = parseInt(query.days as string) || 90 // Default to 90 days for full page

  // Calculate date threshold
  const dateThreshold = new Date()
  dateThreshold.setDate(dateThreshold.getDate() - days)
  const dateThresholdStr = dateThreshold.toISOString()

  // Get recent albums, chronologically ordered (newest first)
  // IMPORTANT: No ordering by popularity/streams - pure chronological
  const { data: albums, error, count } = await client
    .from('albums')
    .select(`
      id,
      title,
      slug,
      cover_key,
      cover_url,
      release_type,
      release_date,
      created_at,
      bands:band_id (
        id,
        name,
        slug
      )
    `, { count: 'exact' })
    .eq('is_published', true)
    .gte('created_at', dateThresholdStr)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch recent releases:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch releases' })
  }

  // Transform to match expected format
  const transformedAlbums = (albums || []).map((album) => ({
    id: album.id,
    title: album.title,
    slug: album.slug,
    cover_key: album.cover_key,
    cover_url: album.cover_url,
    release_type: album.release_type,
    release_date: album.release_date,
    created_at: album.created_at,
    band: album.bands,
  }))

  return {
    albums: transformedAlbums,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
})
