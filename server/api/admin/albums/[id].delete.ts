// DELETE /api/admin/albums/[id] - Delete album and associated data
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

  // Get album info first for logging
  const { data: album } = await client
    .from('albums')
    .select('id, title, band_id')
    .eq('id', albumId)
    .single()

  if (!album) {
    throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  }

  // Delete track credits first (foreign key constraint)
  const { data: tracks } = await client
    .from('tracks')
    .select('id')
    .eq('album_id', albumId)

  if (tracks && tracks.length > 0) {
    const trackIds = tracks.map(t => t.id)

    const { error: creditsError } = await client
      .from('track_credits')
      .delete()
      .in('track_id', trackIds)

    if (creditsError) {
      console.error('Failed to delete track credits:', creditsError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to delete track credits' })
    }
  }

  // Delete tracks
  const { error: tracksError } = await client
    .from('tracks')
    .delete()
    .eq('album_id', albumId)

  if (tracksError) {
    console.error('Failed to delete tracks:', tracksError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete tracks' })
  }

  // Delete album
  const { error: albumError } = await client
    .from('albums')
    .delete()
    .eq('id', albumId)

  if (albumError) {
    console.error('Failed to delete album:', albumError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete album' })
  }

  console.log(`Admin ${user.id} deleted album: ${album.title} (${albumId})`)

  return {
    success: true,
    message: 'Album deleted successfully',
  }
})
