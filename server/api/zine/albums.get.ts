// GET /api/zine/albums - Public endpoint for zine curated albums
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get all zine albums with album and band info
  const { data: zineAlbums, error } = await client
    .from('zine_albums')
    .select(`
      id,
      album_id,
      category,
      description,
      position,
      albums:album_id (
        id,
        title,
        slug,
        cover_key,
        cover_url,
        bands:band_id (
          id,
          name,
          slug
        )
      )
    `)
    .order('category')
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to fetch zine albums:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch zine albums' })
  }

  // Transform and split by category
  const transform = (item: any) => ({
    id: item.albums?.id,
    title: item.albums?.title,
    slug: item.albums?.slug,
    cover_key: item.albums?.cover_key,
    cover_url: item.albums?.cover_url,
    band: item.albums?.bands,
    description: item.description,
  })

  const staffPicks = (zineAlbums || [])
    .filter(z => z.category === 'staff_pick')
    .map(transform)
    .filter(a => a.id) // Filter out any nulls

  const overlooked = (zineAlbums || [])
    .filter(z => z.category === 'overlooked')
    .map(transform)
    .filter(a => a.id)

  return { staffPicks, overlooked }
})
