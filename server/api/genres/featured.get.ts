// GET /api/genres/featured - Get featured genres with artist counts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get featured genres ordered by position
  const { data: featured, error } = await client
    .from('featured_genres')
    .select('id, genre_slug, genre_name, position')
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to fetch featured genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch featured genres' })
  }

  if (!featured?.length) {
    return { featuredGenres: [] }
  }

  // Get all active bands to count artists per genre and get avatar keys
  const { data: bands } = await client
    .from('bands')
    .select('genres, avatar_key, total_streams')
    .eq('status', 'active')
    .order('total_streams', { ascending: false })

  // Build genre stats map - collect all avatar keys for random selection
  const genreStats = new Map<string, { count: number; avatarKeys: string[] }>()

  for (const band of bands || []) {
    if (band.genres && Array.isArray(band.genres)) {
      for (const genre of band.genres) {
        const slug = genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const existing = genreStats.get(slug) || { count: 0, avatarKeys: [] }
        existing.count++
        // Collect all avatar keys for random selection
        if (band.avatar_key) {
          existing.avatarKeys.push(band.avatar_key)
        }
        genreStats.set(slug, existing)
      }
    }
  }

  // Enrich featured genres with stats, picking random avatar
  const enrichedGenres = featured.map((fg) => {
    const stats = genreStats.get(fg.genre_slug) || { count: 0, avatarKeys: [] }
    // Pick a random avatar from all available
    const randomAvatar = stats.avatarKeys.length > 0
      ? stats.avatarKeys[Math.floor(Math.random() * stats.avatarKeys.length)]
      : null
    return {
      id: fg.id,
      slug: fg.genre_slug,
      name: fg.genre_name,
      artistCount: stats.count,
      avatarKeys: randomAvatar ? [randomAvatar] : [],
    }
  })

  return { featuredGenres: enrichedGenres }
})
