// GET /api/genres - Get all genres with artist counts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get all bands with their genres
  const { data: bands, error } = await client
    .from('bands')
    .select('genres')
    .eq('status', 'active')

  if (error) {
    console.error('Failed to fetch genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch genres' })
  }

  // Count artists per genre
  const genreCounts = new Map<string, number>()
  for (const band of bands || []) {
    if (band.genres && Array.isArray(band.genres)) {
      for (const genre of band.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
      }
    }
  }

  // Convert to sorted array
  const genres = Array.from(genreCounts.entries())
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      artistCount: count,
    }))
    .sort((a, b) => b.artistCount - a.artistCount)

  return { genres }
})
