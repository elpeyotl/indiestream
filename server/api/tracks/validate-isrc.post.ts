import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { isrc } = body

  if (!isrc || typeof isrc !== 'string') {
    throw createError({ statusCode: 400, message: 'ISRC is required' })
  }

  // Normalize ISRC (remove hyphens, uppercase)
  const normalizedIsrc = isrc.replace(/-/g, '').toUpperCase()

  // Validate ISRC format (12 alphanumeric characters)
  if (!/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(normalizedIsrc)) {
    return {
      valid: false,
      error: 'Invalid ISRC format. Expected format: CC-XXX-YY-NNNNN (e.g., USRC12345678)',
      normalizedIsrc,
    }
  }

  const supabase = await serverSupabaseClient(event)

  // Check if ISRC already exists in our database
  const { data: existingTrack, error } = await supabase
    .from('tracks')
    .select(`
      id,
      title,
      album:albums!inner(
        id,
        title,
        band:bands!inner(
          id,
          name,
          slug
        )
      )
    `)
    .eq('isrc', normalizedIsrc)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    console.error('ISRC validation error:', error)
    throw createError({ statusCode: 500, message: 'Failed to validate ISRC' })
  }

  if (existingTrack) {
    const album = existingTrack.album as any
    const band = album?.band as any

    return {
      valid: false,
      error: 'ISRC already exists in our database',
      normalizedIsrc,
      existingTrack: {
        id: existingTrack.id,
        title: existingTrack.title,
        albumTitle: album?.title,
        artistName: band?.name,
        artistSlug: band?.slug,
      },
    }
  }

  return {
    valid: true,
    normalizedIsrc,
  }
})
