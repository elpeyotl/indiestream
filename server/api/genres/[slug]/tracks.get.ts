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

  // Convert slug back to genre name (reverse of what index.get.ts does)
  const genreName = slug.replace(/-/g, ' ')

  const client = await serverSupabaseClient(event)

  // Get bands in this genre
  const { data: bands, error: bandsError } = await client
    .from('bands')
    .select('id, name, slug')
    .eq('status', 'active')
    .contains('genres', [genreName])

  if (bandsError) {
    console.error('Failed to fetch bands:', bandsError)
    throw createError({ statusCode: 500, message: 'Failed to fetch bands' })
  }

  if (!bands || bands.length === 0) {
    // Try case-insensitive search
    const { data: allBands } = await client
      .from('bands')
      .select('id, name, slug, genres')
      .eq('status', 'active')

    const matchingBands = (allBands || []).filter(band =>
      band.genres?.some((g: string) => g.toLowerCase() === genreName.toLowerCase())
    )

    if (matchingBands.length === 0) {
      return []
    }

    // Use matching bands
    const bandIds = matchingBands.map(b => b.id)

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
          band:bands!inner (
            id,
            name,
            slug
          )
        )
      `)
      .in('album.band_id', bandIds)
      .not('audio_key', 'is', null)
      .eq('moderation_status', 'approved')
      .limit(limit * 2) // Fetch extra to account for filtering

    if (tracksError) {
      console.error('Failed to fetch tracks:', tracksError)
      throw createError({ statusCode: 500, message: 'Failed to fetch tracks' })
    }

    let result = (tracks || []).map(track => ({
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
  }

  const bandIds = bands.map(b => b.id)

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
    .limit(limit * 3) // Fetch extra to filter and shuffle

  if (tracksError) {
    console.error('Failed to fetch tracks:', tracksError)
    throw createError({ statusCode: 500, message: 'Failed to fetch tracks' })
  }

  // Filter to only tracks from bands in this genre
  let result = (tracks || [])
    .filter(track => bandIds.includes(track.album?.band_id))
    .map(track => ({
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
