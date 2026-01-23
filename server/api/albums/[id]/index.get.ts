// GET /api/albums/[id] - Get album details
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const albumId = getRouterParam(event, 'id')

  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'Album ID is required',
    })
  }

  const client = await serverSupabaseServiceRole(event)

  const { data: album, error } = await client
    .from('albums')
    .select(`
      id,
      title,
      slug,
      cover_key,
      cover_url,
      band_id,
      bands!inner (
        id,
        name,
        slug
      )
    `)
    .eq('id', albumId)
    .single()

  if (error || !album) {
    throw createError({
      statusCode: 404,
      message: 'Album not found',
    })
  }

  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    cover_key: album.cover_key,
    cover_url: album.cover_url,
    band: {
      id: album.bands.id,
      name: album.bands.name,
      slug: album.bands.slug,
    },
  }
})
