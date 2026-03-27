// GET /api/genres/[slug]/tracks - Get tracks from artists in a genre
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const shuffle = query.shuffle === 'true'
  const limit = Math.min(Number(query.limit) || 20, 50)

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Genre slug required' })
  }

  const client = await serverSupabaseClient(event)

  // Find the genre by slug
  const { data: genre } = await client
    .from('genres')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!genre) {
    return []
  }

  // Get band IDs in this genre via band_genres junction
  const { data: bandGenres, error: bgError } = await client
    .from('band_genres')
    .select('band_id')
    .eq('genre_id', genre.id)

  if (bgError) {
    console.error('Failed to fetch band genres:', bgError)
    throw createError({ statusCode: 500, message: 'Failed to fetch band genres' })
  }

  const bandIds = (bandGenres || []).map((bg) => bg.band_id)

  if (bandIds.length === 0) {
    return []
  }

  // Get tracks from these bands
  const { data: tracks, error: tracksError } = await client
    .from('tracks')
    .select(`
      id,
      title,
      audio_key,
      duration_seconds,
      album:albums!inner (
        id,
        title,
        slug,
        cover_key,
        band_id,
        band:bands!inner (
          id,
          name,
          slug
        )
      )
    `)
    .not('audio_key', 'is', null)
    .eq('moderation_status', 'approved')
    .limit(limit * 3)

  if (tracksError) {
    console.error('Failed to fetch tracks:', tracksError)
    throw createError({ statusCode: 500, message: 'Failed to fetch tracks' })
  }

  // Filter to only tracks from bands in this genre
  let result = (tracks || [])
    .filter((track) => bandIds.includes(track.album?.band_id))
    .map((track) => ({
      id: track.id,
      title: track.title,
      audioKey: track.audio_key,
      duration: track.duration_seconds || 0,
      albumTitle: track.album?.title || '',
      albumSlug: track.album?.slug || '',
      coverKey: track.album?.cover_key || null,
      artistName: track.album?.band?.name || '',
      artistSlug: track.album?.band?.slug || '',
    }))

  if (shuffle) {
    result = result.sort(() => Math.random() - 0.5)
  }

  return result.slice(0, limit)
})
