// GET /api/admin/genres - List all genres with artist counts
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

  // Get all genres (including inactive for admin)
  const { data: genres, error } = await client
    .from('genres')
    .select('*')
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch genres:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch genres' })
  }

  // Get artist counts per genre from band_genres
  const { data: bandGenres } = await client
    .from('band_genres')
    .select('genre_id, band:bands!inner(status)')

  const genreCounts = new Map<string, number>()
  for (const bg of bandGenres || []) {
    if ((bg.band as any)?.status === 'active') {
      genreCounts.set(bg.genre_id, (genreCounts.get(bg.genre_id) || 0) + 1)
    }
  }

  const enriched = (genres || []).map((g) => ({
    ...g,
    artistCount: genreCounts.get(g.id) || 0,
  }))

  return { genres: enriched }
})
