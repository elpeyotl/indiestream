// GET /api/charts/trending - Get trending tracks, albums, and artists
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  const period = (query.period as string) || '7d' // 7d, 30d, all
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)

  // Calculate date range
  let dateFilter: string | null = null
  if (period === '7d') {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  } else if (period === '30d') {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  // Get top tracks by stream count
  let tracksQuery = client
    .from('listening_history')
    .select('track_id')
    .eq('completed', true)

  if (dateFilter) {
    tracksQuery = tracksQuery.gte('created_at', dateFilter)
  }

  const { data: trackStreams, error: tracksError } = await tracksQuery

  if (tracksError) {
    console.error('Failed to fetch track streams:', tracksError)
    throw createError({ statusCode: 500, message: 'Failed to fetch trending data' })
  }

  // Count streams per track
  const trackCounts = new Map<string, number>()
  for (const stream of trackStreams || []) {
    if (stream.track_id) {
      trackCounts.set(stream.track_id, (trackCounts.get(stream.track_id) || 0) + 1)
    }
  }

  // Sort and get top track IDs
  const topTrackIds = Array.from(trackCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  // Fetch track details
  let topTracks: any[] = []
  if (topTrackIds.length > 0) {
    const { data: tracks } = await client
      .from('tracks')
      .select(`
        id,
        title,
        duration,
        track_number,
        album:albums!album_id (
          id,
          title,
          slug,
          cover_key,
          band:bands!band_id (
            id,
            name,
            slug
          )
        )
      `)
      .in('id', topTrackIds)
      .eq('moderation_status', 'approved')

    // Sort by stream count and add count
    topTracks = (tracks || [])
      .map(track => ({
        ...track,
        streams: trackCounts.get(track.id) || 0,
      }))
      .sort((a, b) => b.streams - a.streams)
  }

  // Get top albums by total track streams
  const albumCounts = new Map<string, number>()
  for (const track of topTracks) {
    if (track.album?.id) {
      albumCounts.set(track.album.id, (albumCounts.get(track.album.id) || 0) + track.streams)
    }
  }

  const topAlbumIds = Array.from(albumCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  let topAlbums: any[] = []
  if (topAlbumIds.length > 0) {
    const { data: albums } = await client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        cover_key,
        release_type,
        band:bands!band_id (
          id,
          name,
          slug
        )
      `)
      .in('id', topAlbumIds)
      .eq('is_published', true)

    topAlbums = (albums || [])
      .map(album => ({
        ...album,
        streams: albumCounts.get(album.id) || 0,
      }))
      .sort((a, b) => b.streams - a.streams)
  }

  // Get top artists by total streams
  const artistCounts = new Map<string, number>()
  for (const track of topTracks) {
    if (track.album?.band?.id) {
      artistCounts.set(track.album.band.id, (artistCounts.get(track.album.band.id) || 0) + track.streams)
    }
  }

  const topArtistIds = Array.from(artistCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  let topArtists: any[] = []
  if (topArtistIds.length > 0) {
    const { data: artists } = await client
      .from('bands')
      .select('id, name, slug, avatar_key, theme_color, is_verified, genres')
      .in('id', topArtistIds)

    topArtists = (artists || [])
      .map(artist => ({
        ...artist,
        streams: artistCounts.get(artist.id) || 0,
      }))
      .sort((a, b) => b.streams - a.streams)
  }

  return {
    period,
    tracks: topTracks,
    albums: topAlbums,
    artists: topArtists,
  }
})
