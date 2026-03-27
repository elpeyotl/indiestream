// GET /api/genres - Get all genres with artist counts and preview avatars
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get all active genres
  const { data: genres, error } = await client
    .from('genres')
    .select('id, name, slug')
    .eq('is_active', true)

  if (error) {
    console.error('Failed to fetch genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch genres' })
  }

  // Get band_genres with band avatar keys for artist counts and avatars
  const { data: bandGenres } = await client
    .from('band_genres')
    .select('genre_id, band:bands!inner(id, avatar_key, total_streams, status)')

  // Build genre stats
  const genreData = new Map<string, { count: number; avatarKeys: string[] }>()

  for (const bg of bandGenres || []) {
    const band = bg.band as any
    if (band?.status !== 'active') continue

    const existing = genreData.get(bg.genre_id) || { count: 0, avatarKeys: [] }
    existing.count++
    if (band.avatar_key) {
      existing.avatarKeys.push(band.avatar_key)
    }
    genreData.set(bg.genre_id, existing)
  }

  // Build response with random avatar per genre
  const result = (genres || [])
    .map((g) => {
      const data = genreData.get(g.id) || { count: 0, avatarKeys: [] }
      const randomAvatar = data.avatarKeys.length > 0
        ? data.avatarKeys[Math.floor(Math.random() * data.avatarKeys.length)]
        : null
      return {
        name: g.name,
        slug: g.slug,
        artistCount: data.count,
        avatarKeys: randomAvatar ? [randomAvatar] : [],
      }
    })
    .filter((g) => g.artistCount > 0)
    .sort((a, b) => b.artistCount - a.artistCount)

  return { genres: result }
})
