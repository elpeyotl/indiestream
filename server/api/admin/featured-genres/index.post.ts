// POST /api/admin/featured-genres - Feature a genre (toggle is_featured on genres table)
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole(event)

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

  // Find the genre by slug
  const { data: existingGenre } = await client
    .from('genres')
    .select('id, is_featured')
    .eq('slug', genre_slug)
    .single()

  if (existingGenre?.is_featured) {
    throw createError({ statusCode: 400, statusMessage: 'Genre is already featured' })
  }

  // Get max featured_position
  const { data: maxPos } = await client
    .from('genres')
    .select('featured_position')
    .eq('is_featured', true)
    .order('featured_position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPos?.featured_position ?? -1) + 1

  if (existingGenre) {
    // Genre exists, just toggle featured
    const { data, error } = await client
      .from('genres')
      .update({
        is_featured: true,
        featured_position: newPosition,
      })
      .eq('id', existingGenre.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to feature genre:', error)
      throw createError({ statusCode: 500, message: 'Failed to feature genre' })
    }

    return {
      success: true,
      featuredGenre: {
        id: data.id,
        genre_slug: data.slug,
        genre_name: data.name,
        position: data.featured_position,
      },
    }
  }

  // Genre doesn't exist yet, create it as featured
  const { data, error } = await client
    .from('genres')
    .insert({
      name: genre_name,
      slug: genre_slug,
      is_featured: true,
      featured_position: newPosition,
      position: 2000,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add featured genre:', error)
    throw createError({ statusCode: 500, message: 'Failed to add featured genre' })
  }

  return {
    success: true,
    featuredGenre: {
      id: data.id,
      genre_slug: data.slug,
      genre_name: data.name,
      position: data.featured_position,
    },
  }
})
