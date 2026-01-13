// Admin PRO Export API - Generate stream data for SUISA/GEMA reporting
// Only accessible by admin users
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface ExportRequest {
  startDate: string
  endDate: string
}

interface StreamData {
  isrc: string | null
  iswc: string | null
  track_title: string
  album_title: string
  artist_name: string
  composers: string
  country_code: string | null
  play_count: number
  total_duration: number
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  // Verify user is admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<ExportRequest>(event)
  const { startDate, endDate } = body

  if (!startDate || !endDate) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields: startDate, endDate' })
  }

  // Query ALL streams platform-wide
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
          title,
          bands!inner (
            name
          )
        )
      )
    `)
    .gte('listened_at', startDate)
    .lte('listened_at', endDate + 'T23:59:59.999Z')
    .eq('completed', true)
    .eq('is_free_play', false)

  if (streamsError) {
    console.error('Failed to fetch streams:', streamsError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch stream data' })
  }

  // Get all track IDs to fetch credits
  const trackIds = [...new Set((streams || []).map(s => s.track_id))]

  // Fetch composer credits for all tracks
  const { data: credits } = await client
    .from('track_credits')
    .select('track_id, name, role, ipi_number, share_percentage')
    .in('track_id', trackIds)
    .in('role', ['composer', 'lyricist'])

  // Group credits by track
  const creditsByTrack = new Map<string, string[]>()
  for (const credit of credits || []) {
    const existing = creditsByTrack.get(credit.track_id) || []
    const creditStr = credit.ipi_number
      ? `${credit.name} (IPI: ${credit.ipi_number}, ${credit.share_percentage}%)`
      : `${credit.name} (${credit.share_percentage}%)`
    existing.push(creditStr)
    creditsByTrack.set(credit.track_id, existing)
  }

  // Aggregate by track + country
  const aggregated = new Map<string, StreamData>()

  for (const stream of streams || []) {
    const track = stream.tracks as any
    const key = `${stream.track_id}:${stream.country_code || 'UNKNOWN'}`

    if (!aggregated.has(key)) {
      const composers = creditsByTrack.get(stream.track_id)?.join('; ') || 'N/A'
      aggregated.set(key, {
        isrc: track.isrc || null,
        iswc: track.iswc || null,
        track_title: track.title,
        album_title: track.albums?.title || 'Unknown Album',
        artist_name: track.albums?.bands?.name || 'Unknown Artist',
        composers,
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
    territories: new Set(streamData.map(s => s.country_code).filter(Boolean)).size,
    uniqueTracks: new Set(streamData.map(s => s.isrc || s.track_title)).size,
    uniqueArtists: new Set(streamData.map(s => s.artist_name)).size,
  }

  // CSV format for SUISA
  const csvRows = [
    ['ISRC', 'ISWC', 'Track Title', 'Album', 'Artist', 'Composer(s)', 'Play Count', 'Duration (sec)', 'Territory', 'Period Start', 'Period End'].join(','),
  ]

  for (const stream of streamData) {
    csvRows.push([
      stream.isrc || 'N/A',
      stream.iswc || 'N/A',
      `"${stream.track_title.replace(/"/g, '""')}"`,
      `"${stream.album_title.replace(/"/g, '""')}"`,
      `"${stream.artist_name.replace(/"/g, '""')}"`,
      `"${stream.composers.replace(/"/g, '""')}"`,
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
    'Content-Disposition': `attachment; filename="suisa-report-${startDate}-to-${endDate}.csv"`,
  })

  return csvContent
})
