// PATCH /api/admin/albums/[id] - Update album (admin can edit everything)
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { createAuditLog, extractAlbumSnapshot } from '~/server/utils/auditLog'

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

  const body = await readBody(event)

  // Get existing album for audit log
  const { data: existingAlbum } = await client
    .from('albums')
    .select('*, band:bands!band_id(name)')
    .eq('id', albumId)
    .single()

  if (!existingAlbum) {
    throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  }

  // Build album update object from allowed fields
  const albumUpdates: Record<string, unknown> = {}

  // Basic fields
  if (body.title !== undefined) albumUpdates.title = body.title
  if (body.slug !== undefined) albumUpdates.slug = body.slug
  if (body.description !== undefined) albumUpdates.description = body.description
  if (body.release_type !== undefined) {
    if (!['single', 'ep', 'album'].includes(body.release_type)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid release_type. Must be single, ep, or album' })
    }
    albumUpdates.release_type = body.release_type
  }
  if (body.release_date !== undefined) albumUpdates.release_date = body.release_date
  if (body.cover_key !== undefined) albumUpdates.cover_key = body.cover_key

  // Publishing status
  if (body.is_published !== undefined) albumUpdates.is_published = body.is_published

  // Metadata fields
  if (body.upc !== undefined) albumUpdates.upc = body.upc
  if (body.label_name !== undefined) albumUpdates.label_name = body.label_name
  if (body.p_line !== undefined) albumUpdates.p_line = body.p_line
  if (body.c_line !== undefined) albumUpdates.c_line = body.c_line

  // Always update updated_at if there are album updates
  if (Object.keys(albumUpdates).length > 0) {
    albumUpdates.updated_at = new Date().toISOString()

    const { error: albumError } = await client
      .from('albums')
      .update(albumUpdates)
      .eq('id', albumId)

    if (albumError) {
      console.error('Failed to update album:', albumError)
      throw createError({ statusCode: 500, statusMessage: albumError.message })
    }
  }

  // Handle track updates if provided
  if (body.tracks && Array.isArray(body.tracks)) {
    for (const trackUpdate of body.tracks) {
      if (!trackUpdate.id) continue

      const trackUpdates: Record<string, unknown> = {}

      if (trackUpdate.title !== undefined) trackUpdates.title = trackUpdate.title
      if (trackUpdate.track_number !== undefined) trackUpdates.track_number = trackUpdate.track_number
      if (trackUpdate.is_explicit !== undefined) trackUpdates.is_explicit = trackUpdate.is_explicit
      if (trackUpdate.isrc !== undefined) trackUpdates.isrc = trackUpdate.isrc
      if (trackUpdate.iswc !== undefined) trackUpdates.iswc = trackUpdate.iswc
      if (trackUpdate.moderation_status !== undefined) {
        if (!['pending', 'approved', 'rejected'].includes(trackUpdate.moderation_status)) {
          throw createError({ statusCode: 400, statusMessage: 'Invalid moderation_status. Must be pending, approved, or rejected' })
        }
        trackUpdates.moderation_status = trackUpdate.moderation_status
      }

      if (Object.keys(trackUpdates).length > 0) {
        trackUpdates.updated_at = new Date().toISOString()

        const { error: trackError } = await client
          .from('tracks')
          .update(trackUpdates)
          .eq('id', trackUpdate.id)
          .eq('album_id', albumId) // Ensure track belongs to this album

        if (trackError) {
          console.error('Failed to update track:', trackError)
          throw createError({ statusCode: 500, statusMessage: `Failed to update track: ${trackError.message}` })
        }
      }
    }
  }

  // Fetch and return updated album with tracks
  const { data: updatedAlbum, error: fetchError } = await client
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

  if (fetchError) {
    console.error('Failed to fetch updated album:', fetchError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch updated album' })
  }

  const { data: tracks } = await client
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

  // Determine action and create audit log
  let action = 'album.update'
  let summary = `Updated album "${updatedAlbum.title}"`
  const bandName = (existingAlbum.band as { name: string } | null)?.name || 'Unknown'

  if (body.is_published === true && !existingAlbum.is_published) {
    action = 'album.publish'
    summary = `Published album "${updatedAlbum.title}" from band "${bandName}"`
  } else if (body.is_published === false && existingAlbum.is_published) {
    action = 'album.unpublish'
    summary = `Unpublished album "${updatedAlbum.title}" from band "${bandName}"`
  }

  await createAuditLog(client, {
    adminId: user.id,
    action,
    entityType: 'album',
    entityId: albumId,
    entityName: updatedAlbum.title,
    summary,
    oldValue: extractAlbumSnapshot(existingAlbum),
    newValue: extractAlbumSnapshot(updatedAlbum),
  })

  return {
    success: true,
    album: {
      ...updatedAlbum,
      tracks: tracks || [],
    },
  }
})
