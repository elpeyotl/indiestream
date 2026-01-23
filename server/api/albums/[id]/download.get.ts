// GET /api/albums/[id]/download - Get signed download URLs for purchased album
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { getDownloadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Please log in to download',
    })
  }

  const albumId = getRouterParam(event, 'id')
  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'Album ID is required',
    })
  }

  const query = getQuery(event)
  const format = (query.format as string) || 'aac' // 'aac' or 'flac'

  if (!['aac', 'flac'].includes(format)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid format. Use "aac" or "flac"',
    })
  }

  const client = await serverSupabaseClient(event)

  // Verify user owns this album
  const { data: purchase } = await client
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('album_id', albumId)
    .eq('status', 'completed')
    .single()

  if (!purchase) {
    throw createError({
      statusCode: 403,
      message: 'You have not purchased this album',
    })
  }

  // Get album with tracks
  const { data: album, error: albumError } = await client
    .from('albums')
    .select(`
      id,
      title,
      band:bands!band_id (
        id,
        name,
        slug
      ),
      tracks (
        id,
        title,
        track_number,
        audio_key,
        hifi_audio_key,
        moderation_status
      )
    `)
    .eq('id', albumId)
    .single()

  if (albumError || !album) {
    throw createError({
      statusCode: 404,
      message: 'Album not found',
    })
  }

  // Get download URLs for each approved track
  const tracks = (album.tracks as any[])
    .filter((track) => track.moderation_status === 'approved')
    .sort((a, b) => a.track_number - b.track_number)

  const downloadLinks = await Promise.all(
    tracks.map(async (track) => {
      // Use hifi_audio_key for FLAC, audio_key for AAC
      const audioKey = format === 'flac' ? track.hifi_audio_key : track.audio_key

      if (!audioKey) {
        return {
          trackId: track.id,
          title: track.title,
          trackNumber: track.track_number,
          url: null,
          error: `${format.toUpperCase()} format not available`,
        }
      }

      try {
        // Generate signed URL valid for 1 hour
        const url = await getDownloadUrl(audioKey, 3600)

        // Generate a filename for the download
        const band = album.band as { name: string; slug: string }
        const extension = format === 'flac' ? 'flac' : 'm4a'
        const filename = `${String(track.track_number).padStart(2, '0')} - ${track.title}.${extension}`

        return {
          trackId: track.id,
          title: track.title,
          trackNumber: track.track_number,
          url,
          filename,
          format: format.toUpperCase(),
        }
      } catch (err) {
        console.error(`Failed to generate download URL for track ${track.id}:`, err)
        return {
          trackId: track.id,
          title: track.title,
          trackNumber: track.track_number,
          url: null,
          error: 'Failed to generate download URL',
        }
      }
    })
  )

  const band = album.band as { name: string }

  return {
    album: {
      id: album.id,
      title: album.title,
      artist: band.name,
    },
    format: format.toUpperCase(),
    tracks: downloadLinks,
  }
})
