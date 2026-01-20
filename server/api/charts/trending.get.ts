// GET /api/charts/trending - Get trending tracks, albums, and artists
import { serverSupabaseServiceRole } from '#supabase/server'

// In-memory cache for chart data (reduces DB load for popular endpoint)
interface ChartCache {
  data: any
  timestamp: number
}
const chartCache = new Map<string, ChartCache>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const period = (query.period as string) || '7d' // 7d, 30d, all
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)

  // Check cache first
  const cacheKey = `${period}-${limit}`
  const cached = chartCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Use service role to bypass RLS for aggregate chart data
  const client = await serverSupabaseServiceRole(event)

  // For "all" time, use the stream_count/total_streams fields directly
  // For time-based periods, use listening_history
  if (period === 'all') {
    const result = await getAllTimeCharts(client, limit)
    chartCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }

  // Calculate date range for time-based queries
  let dateFilter: string
  if (period === '7d') {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  } else {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  // Get streams from listening_history for the time period
  const { data: trackStreams, error: tracksError } = await client
    .from('listening_history')
    .select('track_id')
    .eq('completed', true)
    .gte('listened_at', dateFilter)

  if (tracksError) {
    console.error('Failed to fetch track streams:', tracksError)
    // Fall back to all-time charts if listening_history query fails
    const result = await getAllTimeCharts(client, limit)
    chartCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }

  // If no listening history data, fall back to all-time charts
  if (!trackStreams || trackStreams.length === 0) {
    const result = await getAllTimeCharts(client, limit)
    chartCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  }

  // Count streams per track
  const trackCounts = new Map<string, number>()
  for (const stream of trackStreams) {
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
        duration_seconds,
        track_number,
        audio_key,
        streaming_audio_key,
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

    topTracks = (tracks || [])
      .map(track => ({
        ...track,
        duration: track.duration_seconds,
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
      .eq('status', 'active') // Only show approved artists
      .in('id', topArtistIds)

    topArtists = (artists || [])
      .map(artist => ({
        ...artist,
        streams: artistCounts.get(artist.id) || 0,
      }))
      .sort((a, b) => b.streams - a.streams)
  }

  const result = {
    period,
    tracks: topTracks,
    albums: topAlbums,
    artists: topArtists,
  }

  // Cache the result
  chartCache.set(cacheKey, { data: result, timestamp: Date.now() })

  return result
})

// Helper function to get all-time charts using stream_count/total_streams
async function getAllTimeCharts(client: any, limit: number) {
  // Get top tracks by stream_count (include tracks with 0 streams)
  const { data: tracks } = await client
    .from('tracks')
    .select(`
      id,
      title,
      duration_seconds,
      track_number,
      stream_count,
      audio_key,
      streaming_audio_key,
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
    .eq('moderation_status', 'approved')
    .order('stream_count', { ascending: false, nullsFirst: false })
    .limit(limit)

  const topTracks = (tracks || []).map((track: any) => ({
    ...track,
    duration: track.duration_seconds,
    streams: track.stream_count || 0,
  }))

  // Get top artists by total_streams (include artists with 0 streams)
  const { data: artists } = await client
    .from('bands')
    .select('id, name, slug, avatar_key, theme_color, is_verified, genres, total_streams')
    .eq('status', 'active')
    .order('total_streams', { ascending: false, nullsFirst: false })
    .limit(limit)

  const topArtists = (artists || []).map((artist: any) => ({
    ...artist,
    streams: artist.total_streams || 0,
  }))

  // Get top albums - sum up track stream_counts per album
  const albumStreams = new Map<string, number>()
  for (const track of topTracks) {
    if (track.album?.id) {
      albumStreams.set(track.album.id, (albumStreams.get(track.album.id) || 0) + track.streams)
    }
  }

  const topAlbumIds = Array.from(albumStreams.entries())
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
      .map((album: any) => ({
        ...album,
        streams: albumStreams.get(album.id) || 0,
      }))
      .sort((a: any, b: any) => b.streams - a.streams)
  }

  return {
    period: 'all',
    tracks: topTracks,
    albums: topAlbums,
    artists: topArtists,
  }
}
