// Royalty Export API - Generate stream data for PRO reporting
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface ExportRequest {
  bandId: string
  startDate: string
  endDate: string
  format: 'csv' | 'json'
}

interface StreamData {
  isrc: string | null
  iswc: string | null
  track_title: string
  album_title: string
  artist_name: string
  country_code: string | null
  play_count: number
  total_duration: number
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<ExportRequest>(event)
  const { bandId, startDate, endDate, format } = body

  if (!bandId || !startDate || !endDate || !format) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  // Validate format
  if (format !== 'csv' && format !== 'json') {
    throw createError({ statusCode: 400, statusMessage: 'Format must be csv or json' })
  }

  const client = await serverSupabaseClient(event)

  // Verify user owns this band
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, name, owner_id')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    throw createError({ statusCode: 404, statusMessage: 'Band not found' })
  }

  if (band.owner_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to export this band\'s data' })
  }

  // Query stream data grouped by track and country
  const { data: streams, error: streamsError } = await client
    .from('listening_history')
    .select(`
      track_id,
      country_code,
      duration_seconds,
      tracks!inner (
        id,
        title,
        isrc,
        iswc,
        albums!inner (
          title
        )
      )
    `)
    .eq('band_id', bandId)
    .gte('listened_at', startDate)
    .lte('listened_at', endDate + 'T23:59:59.999Z')
    .eq('completed', true)
    .eq('is_free_play', false)

  if (streamsError) {
    console.error('Failed to fetch streams:', streamsError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch stream data' })
  }

  // Aggregate by track + country
  const aggregated = new Map<string, StreamData>()

  for (const stream of streams || []) {
    const track = stream.tracks as any
    const key = `${stream.track_id}:${stream.country_code || 'UNKNOWN'}`

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        isrc: track.isrc || null,
        iswc: track.iswc || null,
        track_title: track.title,
        album_title: track.albums?.title || 'Unknown Album',
        artist_name: band.name,
        country_code: stream.country_code || null,
        play_count: 0,
        total_duration: 0,
      })
    }

    const entry = aggregated.get(key)!
    entry.play_count += 1
    entry.total_duration += stream.duration_seconds || 0
  }

  const streamData = Array.from(aggregated.values()).sort((a, b) => b.play_count - a.play_count)

  // Calculate totals
  const totals = {
    playCount: streamData.reduce((sum, s) => sum + s.play_count, 0),
    durationSeconds: streamData.reduce((sum, s) => sum + s.total_duration, 0),
    territories: new Set(streamData.map((s) => s.country_code).filter(Boolean)).size,
  }

  if (format === 'json') {
    // Group by track for JSON output
    const trackMap = new Map<string, {
      isrc: string | null
      iswc: string | null
      title: string
      album: string
      streams: { country: string; playCount: number; durationSeconds: number }[]
    }>()

    for (const stream of streamData) {
      const key = `${stream.isrc || stream.track_title}`
      if (!trackMap.has(key)) {
        trackMap.set(key, {
          isrc: stream.isrc,
          iswc: stream.iswc,
          title: stream.track_title,
          album: stream.album_title,
          streams: [],
        })
      }
      trackMap.get(key)!.streams.push({
        country: stream.country_code || 'UNKNOWN',
        playCount: stream.play_count,
        durationSeconds: stream.total_duration,
      })
    }

    return {
      reportPeriod: { start: startDate, end: endDate },
      artist: { id: band.id, name: band.name },
      tracks: Array.from(trackMap.values()),
      totals,
    }
  }

  // CSV format
  const csvRows = [
    ['ISRC', 'ISWC', 'Track Title', 'Album', 'Artist', 'Play Count', 'Duration (sec)', 'Territory', 'Period Start', 'Period End'].join(','),
  ]

  for (const stream of streamData) {
    csvRows.push([
      stream.isrc || 'N/A',
      stream.iswc || 'N/A',
      `"${stream.track_title.replace(/"/g, '""')}"`,
      `"${stream.album_title.replace(/"/g, '""')}"`,
      `"${stream.artist_name.replace(/"/g, '""')}"`,
      stream.play_count.toString(),
      stream.total_duration.toString(),
      stream.country_code || 'UNKNOWN',
      startDate,
      endDate,
    ].join(','))
  }

  const csvContent = csvRows.join('\n')

  // Set headers for file download
  setResponseHeaders(event, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="royalty-report-${startDate}-to-${endDate}.csv"`,
  })

  return csvContent
})
