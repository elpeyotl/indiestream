// POST /api/admin/featured-albums - Add an album to featured list
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
  const { albumId, description } = body

  if (!albumId) {
    throw createError({ statusCode: 400, statusMessage: 'albumId is required' })
  }

  // Verify album exists and is published
  const { data: album, error: albumError } = await client
    .from('albums')
    .select('id, is_published')
    .eq('id', albumId)
    .single()

  if (albumError || !album) {
    throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  }

  if (!album.is_published) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot feature unpublished album' })
  }

  // Check if album is already featured
  const { data: existing } = await client
    .from('featured_albums')
    .select('id')
    .eq('album_id', albumId)
    .single()

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Album is already featured' })
  }

  // Get max position to add at the end
  const { data: maxPos } = await client
    .from('featured_albums')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPos?.position ?? -1) + 1

  // Insert the new featured album
  const { data, error } = await client
    .from('featured_albums')
    .insert({
      album_id: albumId,
      description: description || null,
      position: newPosition,
      featured_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add featured album:', error)
    throw createError({ statusCode: 500, message: 'Failed to add featured album' })
  }

  return { success: true, featuredAlbum: data }
})
