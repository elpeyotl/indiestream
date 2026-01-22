// GET /api/admin/featured-genres - List all featured genres for admin
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

  // Get all featured genres
  const { data: featuredGenres, error } = await client
    .from('featured_genres')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to fetch featured genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch featured genres' })
  }

  // Get artist counts for each genre
  const { data: bands } = await client
    .from('bands')
    .select('genres')
    .eq('status', 'active')

  // Count artists per genre
  const genreCounts = new Map<string, number>()
  for (const band of bands || []) {
    if (band.genres && Array.isArray(band.genres)) {
      for (const genre of band.genres) {
        const slug = genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        genreCounts.set(slug, (genreCounts.get(slug) || 0) + 1)
      }
    }
  }

  // Enrich with artist counts
  const enriched = (featuredGenres || []).map((fg) => ({
    ...fg,
    artistCount: genreCounts.get(fg.genre_slug) || 0,
  }))

  return { featuredGenres: enriched }
})
