// GET /api/admin/zine - Get all zine albums (staff picks + overlooked)
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

  // Get all zine albums with album and band info
  const { data: zineAlbums, error } = await client
    .from('zine_albums')
    .select(`
      id,
      album_id,
      category,
      description,
      position,
      created_at,
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

  console.log('Raw zine albums from DB:', JSON.stringify(zineAlbums, null, 2))

  // Split by category
  const staffPicks = (zineAlbums || []).filter(z => z.category === 'staff_pick')
  const overlooked = (zineAlbums || []).filter(z => z.category === 'overlooked')

  console.log('Returning staffPicks:', staffPicks.length, 'overlooked:', overlooked.length)

  return { staffPicks, overlooked }
})
