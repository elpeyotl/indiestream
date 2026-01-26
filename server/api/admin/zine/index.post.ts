// POST /api/admin/zine - Add album to zine
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

  const body = await readBody(event)
  const { album_id, category, description } = body

  if (!album_id || !category) {
    throw createError({ statusCode: 400, message: 'album_id and category are required' })
  }

  if (!['staff_pick', 'overlooked'].includes(category)) {
    throw createError({ statusCode: 400, message: 'Invalid category' })
  }

  // Get the next position for this category
  const { data: existing } = await client
    .from('zine_albums')
    .select('position')
    .eq('category', category)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  // Insert the zine album
  const { data: zineAlbum, error } = await client
    .from('zine_albums')
    .insert({
      album_id,
      category,
      description: description || null,
      position: nextPosition,
    })
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
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, message: 'Album already exists in this category' })
    }
    console.error('Failed to add zine album:', error)
    throw createError({ statusCode: 500, message: 'Failed to add zine album' })
  }

  return { zineAlbum }
})
