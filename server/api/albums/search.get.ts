// GET /api/albums/search - Search for albums by title or artist name (admin only)
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

  const query = getQuery(event)
  const searchQuery = (query.q as string || '').trim()

  if (!searchQuery || searchQuery.length < 2) {
    return { albums: [] }
  }

  // Search albums by title OR artist name
  // Run both queries in parallel
  const [albumsByTitle, bandsByName] = await Promise.all([
    // Search by album title
    client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        cover_key,
        cover_url,
        release_type,
        is_published,
        bands:band_id (
          id,
          name,
          slug
        )
      `)
      .ilike('title', `%${searchQuery}%`)
      .eq('is_published', true)
      .order('title', { ascending: true })
      .limit(20),
    // Search by artist name
    client
      .from('bands')
      .select('id')
      .ilike('name', `%${searchQuery}%`)
      .limit(10),
  ])

  if (albumsByTitle.error) {
    console.error('Failed to search albums:', albumsByTitle.error)
    throw createError({ statusCode: 500, message: 'Failed to search albums' })
  }

  // Get albums from matching bands
  let albumsByArtist: typeof albumsByTitle.data = []
  if (bandsByName.data?.length) {
    const bandIds = bandsByName.data.map((b) => b.id)
    const { data, error } = await client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        cover_key,
        cover_url,
        release_type,
        is_published,
        bands:band_id (
          id,
          name,
          slug
        )
      `)
      .in('band_id', bandIds)
      .eq('is_published', true)
      .order('title', { ascending: true })
      .limit(20)

    if (!error && data) {
      albumsByArtist = data
    }
  }

  // Combine and deduplicate results
  const seen = new Set<string>()
  const albums = []
  for (const album of [...albumsByTitle.data || [], ...albumsByArtist]) {
    if (!seen.has(album.id)) {
      seen.add(album.id)
      albums.push(album)
    }
  }

  return { albums: albums.slice(0, 20) }
})
