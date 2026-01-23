// GET /api/albums/featured - Public endpoint for featured albums
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get featured albums and editorial blurb in parallel
  const [albumsResult, blurbResult] = await Promise.all([
    client
      .from('featured_albums')
      .select(`
        id,
        position,
        description,
        albums:album_id (
          id,
          title,
          slug,
          cover_key,
          cover_url,
          release_type,
          release_date,
          bands:band_id (
            id,
            name,
            slug
          )
        )
      `)
      .order('position', { ascending: true }),
    client
      .from('platform_settings')
      .select('value')
      .eq('key', 'featured_albums_blurb')
      .single(),
  ])

  if (albumsResult.error) {
    console.error('Failed to fetch featured albums:', albumsResult.error)
    throw createError({ statusCode: 500, message: 'Failed to fetch featured albums' })
  }

  // Transform to flatten the structure
  const albums = (albumsResult.data || []).map((fa) => ({
    id: fa.albums?.id,
    title: fa.albums?.title,
    slug: fa.albums?.slug,
    cover_key: fa.albums?.cover_key,
    cover_url: fa.albums?.cover_url,
    release_type: fa.albums?.release_type,
    release_date: fa.albums?.release_date,
    band: fa.albums?.bands,
    description: fa.description,
  })).filter((a) => a.id) // Filter out any nulls

  // Get blurb or return null (will use fallback on frontend)
  const blurb = blurbResult.data?.value as string | null

  return { albums, blurb }
})
