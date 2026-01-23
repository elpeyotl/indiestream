// GET /api/user/feed/new-releases - Albums from followed artists (last 30 days)
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    return { albums: [], followsArtists: false }
  }

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 20
  const days = parseInt(query.days as string) || 30

  // Get user's followed artist IDs
  const { data: follows } = await client
    .from('follows')
    .select('band_id')
    .eq('user_id', user.id)

  if (!follows || follows.length === 0) {
    return { albums: [], followsArtists: false }
  }

  const followedBandIds = follows.map((f) => f.band_id)

  // Calculate date threshold
  const dateThreshold = new Date()
  dateThreshold.setDate(dateThreshold.getDate() - days)
  const dateThresholdStr = dateThreshold.toISOString()

  // Get recent albums from followed artists
  const { data: albums, error } = await client
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
    `)
    .in('band_id', followedBandIds)
    .eq('is_published', true)
    .gte('created_at', dateThresholdStr)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch new releases from followed artists:', error)
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
    followsArtists: true,
  }
})
