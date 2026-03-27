// GET /api/genres/featured - Get featured genres with artist counts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get featured genres ordered by featured_position
  const { data: featured, error } = await client
    .from('genres')
    .select('id, name, slug')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('featured_position', { ascending: true })

  if (error) {
    console.error('Failed to fetch featured genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch featured genres' })
  }

  if (!featured?.length) {
    return { featuredGenres: [] }
  }

  // Get band_genres with avatars for featured genres only
  const featuredIds = featured.map((f) => f.id)
  const { data: bandGenres } = await client
    .from('band_genres')
    .select('genre_id, band:bands!inner(avatar_key, total_streams, status)')
    .in('genre_id', featuredIds)

  // Build stats per genre
  const genreStats = new Map<string, { count: number; avatarKeys: string[] }>()

  for (const bg of bandGenres || []) {
    const band = bg.band as any
    if (band?.status !== 'active') continue

    const existing = genreStats.get(bg.genre_id) || { count: 0, avatarKeys: [] }
    existing.count++
    if (band.avatar_key) {
      existing.avatarKeys.push(band.avatar_key)
    }
    genreStats.set(bg.genre_id, existing)
  }

  const enrichedGenres = featured.map((fg) => {
    const stats = genreStats.get(fg.id) || { count: 0, avatarKeys: [] }
    const randomAvatar = stats.avatarKeys.length > 0
      ? stats.avatarKeys[Math.floor(Math.random() * stats.avatarKeys.length)]
      : null
    return {
      id: fg.id,
      slug: fg.slug,
      name: fg.name,
      artistCount: stats.count,
      avatarKeys: randomAvatar ? [randomAvatar] : [],
    }
  })

  return { featuredGenres: enrichedGenres }
})
