// GET /api/admin/albums/[id] - Get single album with full details
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

  const albumId = getRouterParam(event, 'id')
  if (!albumId) {
    throw createError({ statusCode: 400, statusMessage: 'Album ID required' })
  }

  // Get album with band info
  const { data: album, error: albumError } = await client
    .from('albums')
    .select(`
      *,
      band:bands!band_id (
        id,
        name,
        slug
      )
    `)
    .eq('id', albumId)
    .single()

  if (albumError) {
    if (albumError.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'Album not found' })
    }
    console.error('Failed to fetch album:', albumError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch album' })
  }

  // Get tracks with credits
  const { data: tracks, error: tracksError } = await client
    .from('tracks')
    .select(`
      *,
      credits:track_credits (
        id,
        role,
        name,
        ipi_number
      )
    `)
    .eq('album_id', albumId)
    .order('track_number', { ascending: true })

  if (tracksError) {
    console.error('Failed to fetch tracks:', tracksError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tracks' })
  }

  return {
    album: {
      ...album,
      tracks: tracks || [],
    },
  }
})
