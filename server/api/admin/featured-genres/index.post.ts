// POST /api/admin/featured-genres - Add a genre to featured list
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
  const { genre_slug, genre_name } = body

  if (!genre_slug || !genre_name) {
    throw createError({ statusCode: 400, statusMessage: 'genre_slug and genre_name are required' })
  }

  // Check if genre is already featured
  const { data: existing } = await client
    .from('featured_genres')
    .select('id')
    .eq('genre_slug', genre_slug)
    .single()

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Genre is already featured' })
  }

  // Get max position to add at the end
  const { data: maxPos } = await client
    .from('featured_genres')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPos?.position ?? -1) + 1

  // Insert the new featured genre
  const { data, error } = await client
    .from('featured_genres')
    .insert({
      genre_slug,
      genre_name,
      position: newPosition,
      featured_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add featured genre:', error)
    throw createError({ statusCode: 500, message: 'Failed to add featured genre' })
  }

  return { success: true, featuredGenre: data }
})
