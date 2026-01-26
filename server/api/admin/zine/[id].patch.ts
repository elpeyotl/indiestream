// PATCH /api/admin/zine/[id] - Update zine album description
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

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { description } = body

  // Update the description
  const { data: zineAlbum, error } = await client
    .from('zine_albums')
    .update({ description: description || null })
    .eq('id', id)
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
    console.error('Failed to update zine album:', error)
    throw createError({ statusCode: 500, message: 'Failed to update zine album' })
  }

  return { zineAlbum }
})
