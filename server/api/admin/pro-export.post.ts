// Admin PRO Export API - Generate stream data for SUISA/GEMA reporting
// Only accessible by admin users
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface ExportRequest {
  startDate: string
  endDate: string
}

interface TerritoryStats {
  play_count: number
  duration: number
}

interface StreamData {
  isrc: string | null
  iswc: string | null
  track_title: string
  album_title: string
  artist_name: string
  composers: string
  territory_plays: Map<string, TerritoryStats>
  play_count: number
  total_duration: number
}

const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`

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
    .select('track_id, name, role, ipi_number')
    .in('track_id', trackIds)
    .in('role', ['composer', 'lyricist'])

  // Group credits by track
  const creditsByTrack = new Map<string, string[]>()
  for (const credit of credits || []) {
    const existing = creditsByTrack.get(credit.track_id) || []
    const creditStr = credit.ipi_number
      ? `${credit.name} (IPI: ${credit.ipi_number})`
      : credit.name
    existing.push(creditStr)
    creditsByTrack.set(credit.track_id, existing)
  }

  // Aggregate by track (one row per song)
  const aggregated = new Map<string, StreamData>()

  for (const stream of streams || []) {
    const track = stream.tracks as any
    const key = stream.track_id

    if (!aggregated.has(key)) {
      const composers = creditsByTrack.get(stream.track_id)?.join('; ') || 'N/A'
      aggregated.set(key, {
        isrc: track.isrc || null,
        iswc: track.iswc || null,
        track_title: track.title,
        album_title: track.albums?.title || 'Unknown Album',
        artist_name: track.albums?.bands?.name || 'Unknown Artist',
        composers,
        territory_plays: new Map(),
        play_count: 0,
        total_duration: 0,
      })
    }

    const entry = aggregated.get(key)!
    entry.play_count += 1
    entry.total_duration += stream.duration_seconds || 0

    // Track per-territory stats
    const territory = stream.country_code || 'UNKNOWN'
    const territoryEntry = entry.territory_plays.get(territory) || { play_count: 0, duration: 0 }
    territoryEntry.play_count += 1
    territoryEntry.duration += stream.duration_seconds || 0
    entry.territory_plays.set(territory, territoryEntry)
  }

  const streamData = Array.from(aggregated.values()).sort((a, b) => b.play_count - a.play_count)

  // Calculate totals
  const allTerritories = new Set<string>()
  for (const s of streamData) {
    for (const t of s.territory_plays.keys()) allTerritories.add(t)
  }
  const totals = {
    playCount: streamData.reduce((sum, s) => sum + s.play_count, 0),
    durationSeconds: streamData.reduce((sum, s) => sum + s.total_duration, 0),
    territories: allTerritories.size,
    uniqueTracks: new Set(streamData.map(s => s.isrc || s.track_title)).size,
    uniqueArtists: new Set(streamData.map(s => s.artist_name)).size,
  }

  // CSV format for SUISA
  const headers = ['ISRC', 'ISWC', 'Track Title', 'Album', 'Artist', 'Composer(s)', 'Play Count', 'Duration (sec)', 'Territories', 'Period Start', 'Period End']
  const csvRows = [
    headers.map(csvEscape).join(','),
  ]

  for (const stream of streamData) {
    // Format territory breakdown as "CH:45;DE:120;AT:30"
    const territories = Array.from(stream.territory_plays.entries())
      .sort((a, b) => b[1].play_count - a[1].play_count)
      .map(([code, stats]) => `${code}:${stats.play_count}`)
      .join(';')

    csvRows.push([
      csvEscape(stream.isrc || 'N/A'),
      csvEscape(stream.iswc || 'N/A'),
      csvEscape(stream.track_title),
      csvEscape(stream.album_title),
      csvEscape(stream.artist_name),
      csvEscape(stream.composers),
      csvEscape(stream.play_count.toString()),
      csvEscape(stream.total_duration.toString()),
      csvEscape(territories),
      csvEscape(startDate),
      csvEscape(endDate),
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
