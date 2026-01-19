// GET /api/genres - Get all genres with artist counts and preview avatars
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get all bands with their genres and avatar keys (ordered by streams for best artists first)
  const { data: bands, error } = await client
    .from('bands')
    .select('id, genres, avatar_key, total_streams')
    .eq('status', 'active')
    .order('total_streams', { ascending: false })

  if (error) {
    console.error('Failed to fetch genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch genres' })
  }

  // Count artists per genre and collect avatar keys (up to 4 per genre)
  const genreData = new Map<string, { count: number; avatarKeys: string[] }>()

  for (const band of bands || []) {
    if (band.genres && Array.isArray(band.genres)) {
      for (const genre of band.genres) {
        const existing = genreData.get(genre) || { count: 0, avatarKeys: [] }
        existing.count++
        // Only add avatar if we have one and haven't collected 4 yet
        if (band.avatar_key && existing.avatarKeys.length < 4) {
          existing.avatarKeys.push(band.avatar_key)
        }
        genreData.set(genre, existing)
      }
    }
  }

  // Convert to sorted array
  const genres = Array.from(genreData.entries())
    .map(([name, data]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      artistCount: data.count,
      avatarKeys: data.avatarKeys,
    }))
    .sort((a, b) => b.artistCount - a.artistCount)

  return { genres }
})
