// GET /api/admin/featured-albums - List all featured albums for admin
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

  // Get all featured albums with album and band info
  const { data: featuredAlbums, error } = await client
    .from('featured_albums')
    .select(`
      id,
      album_id,
      position,
      description,
      featured_at,
      albums:album_id (
        id,
        title,
        slug,
        cover_key,
        cover_url,
        release_type,
        bands:band_id (
          id,
          name,
          slug
        )
      )
    `)
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to fetch featured albums:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch featured albums' })
  }

  return { featuredAlbums: featuredAlbums || [] }
})
