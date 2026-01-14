// Listener stats/wrapped endpoint - comprehensive listening insights
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

interface TopArtist {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  streamCount: number
  listeningSeconds: number
  percentageOfTotal: number
  firstListenedAt: string
}

interface TopTrack {
  trackId: string
  trackTitle: string
  artistName: string
  artistSlug: string
  albumTitle: string
  coverKey: string | null
  coverUrl: string | null
  playCount: number
  listeningSeconds: number
  percentageOfTotal: number
}

interface TopAlbum {
  albumId: string
  albumTitle: string
  artistName: string
  artistSlug: string
  coverKey: string | null
  coverUrl: string | null
  streamCount: number
  listeningSeconds: number
  percentageOfTotal: number
}

interface TopGenre {
  genre: string
  streamCount: number
  artistCount: number
  percentageOfTotal: number
}

interface ListeningStats {
  period: string
  periodLabel: string

  // Overview Stats
  totalListeningSeconds: number
  totalStreams: number
  uniqueArtists: number
  uniqueTracks: number
  uniqueAlbums: number

  // Listening Patterns
  averageSessionDuration: number
  totalListeningDays: number
  longestStreak: number
  currentStreak: number

  // Time-based
  mostActiveDay: string
  mostActiveHour: number
  listeningByHour: { hour: number, minutes: number }[]
  listeningByDayOfWeek: { day: string, minutes: number }[]
  listeningByMonth: { month: string, minutes: number }[]

  // Top Content
  topArtists: TopArtist[]
  topTracks: TopTrack[]
  topAlbums: TopAlbum[]
  topGenres: TopGenre[]

  // Discovery
  newArtistsDiscovered: number
  artistDiversity: number
  repeatListenerScore: number

  // Comparisons
  vsLastPeriod?: {
    listeningSecondsChange: number
    streamsChange: number
    newArtistsChange: number
  }

  // Superlatives
  topListeningDay: { date: string, minutes: number }
  favoriteArtist: TopArtist | null
  mostPlayedTrack: TopTrack | null
}

export default defineEventHandler(async (event): Promise<ListeningStats> => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  // Get period parameter (default to this-year)
  const period = (query.period as string) || 'this-year'

  if (!['this-year', 'last-month', 'all-time'].includes(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid period. Must be "this-year", "last-month", or "all-time"' })
  }

  // Calculate period dates
  const now = new Date()
  let periodStart: string
  let periodEnd: string
  let periodLabel: string

  switch (period) {
    case 'this-year':
      periodStart = new Date(now.getFullYear(), 0, 1).toISOString()
      periodEnd = now.toISOString()
      periodLabel = now.getFullYear().toString()
      break
    case 'last-month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      periodStart = lastMonth.toISOString()
      periodEnd = lastMonthEnd.toISOString()
      periodLabel = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      break
    case 'all-time':
    default:
      periodStart = '2020-01-01' // Platform launch
      periodEnd = now.toISOString()
      periodLabel = 'All Time'
      break
  }

  // Get all listening data for the period
  const { data: listeningData, error: listenError } = await client
    .from('listening_history')
    .select('id, track_id, album_id, band_id, duration_seconds, listened_at')
    .eq('user_id', user.id)
    .eq('completed', true)
    .eq('is_free_play', false)
    .gte('listened_at', periodStart)
    .lte('listened_at', periodEnd)

  if (listenError) {
    console.error('Failed to fetch listening data:', listenError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch listening data' })
  }

  // If no listening data, return empty stats
  if (!listeningData || listeningData.length === 0) {
    return {
      period,
      periodLabel,
      totalListeningSeconds: 0,
      totalStreams: 0,
      uniqueArtists: 0,
      uniqueTracks: 0,
      uniqueAlbums: 0,
      averageSessionDuration: 0,
      totalListeningDays: 0,
      longestStreak: 0,
      currentStreak: 0,
      mostActiveDay: '',
      mostActiveHour: 0,
      listeningByHour: [],
      listeningByDayOfWeek: [],
      listeningByMonth: [],
      topArtists: [],
      topTracks: [],
      topAlbums: [],
      topGenres: [],
      newArtistsDiscovered: 0,
      artistDiversity: 0,
      repeatListenerScore: 0,
      topListeningDay: { date: '', minutes: 0 },
      favoriteArtist: null,
      mostPlayedTrack: null,
    }
  }

  // Calculate overview stats
  const totalListeningSeconds = listeningData.reduce((sum, item) => sum + (item.duration_seconds || 0), 0)
  const totalStreams = listeningData.length
  const uniqueArtists = new Set(listeningData.map(item => item.band_id)).size
  const uniqueTracks = new Set(listeningData.map(item => item.track_id)).size
  const uniqueAlbums = new Set(listeningData.map(item => item.album_id)).size

  // Calculate listening patterns by date
  const dateMap = new Map<string, number>()
  const hourMap = new Map<number, number>()
  const dayOfWeekMap = new Map<string, number>()
  const monthMap = new Map<string, number>()

  for (const item of listeningData) {
    const date = new Date(item.listened_at)
    const dateStr = date.toISOString().split('T')[0]
    const hour = date.getUTCHours()
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
    const month = date.toLocaleDateString('en-US', { month: 'short' })

    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + (item.duration_seconds || 0))
    hourMap.set(hour, (hourMap.get(hour) || 0) + (item.duration_seconds || 0))
    dayOfWeekMap.set(dayOfWeek, (dayOfWeekMap.get(dayOfWeek) || 0) + (item.duration_seconds || 0))
    monthMap.set(month, (monthMap.get(month) || 0) + (item.duration_seconds || 0))
  }

  const totalListeningDays = dateMap.size

  // Calculate average session duration
  const averageSessionDuration = totalListeningDays > 0 ? Math.floor(totalListeningSeconds / totalListeningDays) : 0

  // Find most active day of week
  let mostActiveDay = ''
  let maxDayMinutes = 0
  for (const [day, seconds] of dayOfWeekMap.entries()) {
    if (seconds > maxDayMinutes) {
      maxDayMinutes = seconds
      mostActiveDay = day
    }
  }

  // Find most active hour
  let mostActiveHour = 0
  let maxHourMinutes = 0
  for (const [hour, seconds] of hourMap.entries()) {
    if (seconds > maxHourMinutes) {
      maxHourMinutes = seconds
      mostActiveHour = hour
    }
  }

  // Build listening by hour array (24 entries)
  const listeningByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    minutes: Math.floor((hourMap.get(i) || 0) / 60)
  }))

  // Build listening by day of week array
  const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const listeningByDayOfWeek = daysOrder.map(day => ({
    day,
    minutes: Math.floor((dayOfWeekMap.get(day) || 0) / 60)
  }))

  // Build listening by month array (for year view)
  const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const listeningByMonth = monthsOrder.map(month => ({
    month,
    minutes: Math.floor((monthMap.get(month) || 0) / 60)
  }))

  // Find top listening day
  let topListeningDay = { date: '', minutes: 0 }
  for (const [date, seconds] of dateMap.entries()) {
    const minutes = Math.floor(seconds / 60)
    if (minutes > topListeningDay.minutes) {
      topListeningDay = { date, minutes }
    }
  }

  // Calculate streaks
  const sortedDates = Array.from(dateMap.keys()).sort()
  let longestStreak = 0
  let currentStreak = 0
  let tempStreak = 1
  let lastDate: Date | null = null

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr)
    if (lastDate) {
      const diffDays = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    lastDate = date
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // Calculate current streak (from most recent date)
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    currentStreak = 1
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i + 1])
      const prevDate = new Date(sortedDates[i])
      const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        currentStreak++
      } else {
        break
      }
    }
  } else {
    currentStreak = 0
  }

  // Get top artists (aggregate by band_id)
  const artistMap = new Map<string, { streamCount: number, listeningSeconds: number, firstListenedAt: string }>()
  for (const item of listeningData) {
    const existing = artistMap.get(item.band_id)
    if (existing) {
      existing.streamCount++
      existing.listeningSeconds += item.duration_seconds || 0
      if (item.listened_at < existing.firstListenedAt) {
        existing.firstListenedAt = item.listened_at
      }
    } else {
      artistMap.set(item.band_id, {
        streamCount: 1,
        listeningSeconds: item.duration_seconds || 0,
        firstListenedAt: item.listened_at
      })
    }
  }

  // Fetch band details for top artists
  const topArtistIds = Array.from(artistMap.entries())
    .sort((a, b) => b[1].listeningSeconds - a[1].listeningSeconds)
    .slice(0, 10)
    .map(([bandId]) => bandId)

  const { data: bandsData } = await client
    .from('bands')
    .select('id, name, slug, avatar_key')
    .in('id', topArtistIds)

  const topArtists: TopArtist[] = topArtistIds
    .map(bandId => {
      const stats = artistMap.get(bandId)!
      const band = bandsData?.find(b => b.id === bandId)
      return {
        bandId,
        bandName: band?.name || 'Unknown Artist',
        bandSlug: band?.slug || '',
        avatarKey: band?.avatar_key || null,
        avatarUrl: null, // Will be filled by frontend
        streamCount: stats.streamCount,
        listeningSeconds: stats.listeningSeconds,
        percentageOfTotal: (stats.listeningSeconds / totalListeningSeconds) * 100,
        firstListenedAt: stats.firstListenedAt
      }
    })

  // Get top tracks (aggregate by track_id)
  const trackMap = new Map<string, { playCount: number, listeningSeconds: number }>()
  for (const item of listeningData) {
    const existing = trackMap.get(item.track_id)
    if (existing) {
      existing.playCount++
      existing.listeningSeconds += item.duration_seconds || 0
    } else {
      trackMap.set(item.track_id, {
        playCount: 1,
        listeningSeconds: item.duration_seconds || 0
      })
    }
  }

  // Fetch track details for top tracks
  const topTrackIds = Array.from(trackMap.entries())
    .sort((a, b) => b[1].playCount - a[1].playCount)
    .slice(0, 10)
    .map(([trackId]) => trackId)

  const { data: tracksData } = await client
    .from('tracks')
    .select(`
      id,
      title,
      albums!inner (
        id,
        title,
        cover_key,
        bands!inner (
          name,
          slug
        )
      )
    `)
    .in('id', topTrackIds)

  const topTracks: TopTrack[] = topTrackIds
    .map(trackId => {
      const stats = trackMap.get(trackId)!
      const track = tracksData?.find(t => t.id === trackId)
      return {
        trackId,
        trackTitle: track?.title || 'Unknown Track',
        artistName: (track?.albums as any)?.bands?.name || 'Unknown Artist',
        artistSlug: (track?.albums as any)?.bands?.slug || '',
        albumTitle: (track?.albums as any)?.title || 'Unknown Album',
        coverKey: (track?.albums as any)?.cover_key || null,
        coverUrl: null, // Will be filled by frontend
        playCount: stats.playCount,
        listeningSeconds: stats.listeningSeconds,
        percentageOfTotal: (stats.playCount / totalStreams) * 100
      }
    })

  // Get top albums (aggregate by album_id)
  const albumMap = new Map<string, { streamCount: number, listeningSeconds: number }>()
  for (const item of listeningData) {
    const existing = albumMap.get(item.album_id)
    if (existing) {
      existing.streamCount++
      existing.listeningSeconds += item.duration_seconds || 0
    } else {
      albumMap.set(item.album_id, {
        streamCount: 1,
        listeningSeconds: item.duration_seconds || 0
      })
    }
  }

  // Fetch album details for top albums
  const topAlbumIds = Array.from(albumMap.entries())
    .sort((a, b) => b[1].streamCount - a[1].streamCount)
    .slice(0, 10)
    .map(([albumId]) => albumId)

  const { data: albumsData } = await client
    .from('albums')
    .select(`
      id,
      title,
      cover_key,
      bands!inner (
        name,
        slug
      )
    `)
    .in('id', topAlbumIds)

  const topAlbums: TopAlbum[] = topAlbumIds
    .map(albumId => {
      const stats = albumMap.get(albumId)!
      const album = albumsData?.find(a => a.id === albumId)
      return {
        albumId,
        albumTitle: album?.title || 'Unknown Album',
        artistName: (album?.bands as any)?.name || 'Unknown Artist',
        artistSlug: (album?.bands as any)?.slug || '',
        coverKey: album?.cover_key || null,
        coverUrl: null, // Will be filled by frontend
        streamCount: stats.streamCount,
        listeningSeconds: stats.listeningSeconds,
        percentageOfTotal: (stats.streamCount / totalStreams) * 100
      }
    })

  // Get top genres (aggregate by genre from bands.genres array)
  const { data: genresData } = await client
    .from('listening_history')
    .select(`
      id,
      band_id,
      bands!inner (
        genres
      )
    `)
    .eq('user_id', user.id)
    .eq('completed', true)
    .eq('is_free_play', false)
    .gte('listened_at', periodStart)
    .lte('listened_at', periodEnd)

  const genreMap = new Map<string, { streamCount: number, artistIds: Set<string> }>()
  for (const item of genresData || []) {
    const genres = (item.bands as any)?.genres || []
    for (const genre of genres) {
      const existing = genreMap.get(genre)
      if (existing) {
        existing.streamCount++
        existing.artistIds.add(item.band_id)
      } else {
        genreMap.set(genre, {
          streamCount: 1,
          artistIds: new Set([item.band_id])
        })
      }
    }
  }

  const topGenres: TopGenre[] = Array.from(genreMap.entries())
    .map(([genre, stats]) => ({
      genre,
      streamCount: stats.streamCount,
      artistCount: stats.artistIds.size,
      percentageOfTotal: (stats.streamCount / totalStreams) * 100
    }))
    .sort((a, b) => b.streamCount - a.streamCount)
    .slice(0, 5)

  // Calculate discovery stats
  // New artists discovered in this period
  const { data: previousArtists } = await client
    .from('listening_history')
    .select('band_id')
    .eq('user_id', user.id)
    .eq('completed', true)
    .eq('is_free_play', false)
    .lt('listened_at', periodStart)

  const previousArtistIds = new Set((previousArtists || []).map(item => item.band_id))
  const currentArtistIds = new Set(listeningData.map(item => item.band_id))
  const newArtistsDiscovered = Array.from(currentArtistIds).filter(id => !previousArtistIds.has(id)).length

  // Artist diversity (unique artists / total streams * 100)
  const artistDiversity = (uniqueArtists / totalStreams) * 100

  // Repeat listener score (streams that are NOT first-time listens to a track)
  const uniqueFirstPlays = new Set(listeningData.map(item => item.track_id)).size
  const repeatListenerScore = ((totalStreams - uniqueFirstPlays) / totalStreams) * 100

  // Favorite artist and most played track
  const favoriteArtist = topArtists.length > 0 ? topArtists[0] : null
  const mostPlayedTrack = topTracks.length > 0 ? topTracks[0] : null

  return {
    period,
    periodLabel,
    totalListeningSeconds,
    totalStreams,
    uniqueArtists,
    uniqueTracks,
    uniqueAlbums,
    averageSessionDuration,
    totalListeningDays,
    longestStreak,
    currentStreak,
    mostActiveDay,
    mostActiveHour,
    listeningByHour,
    listeningByDayOfWeek,
    listeningByMonth,
    topArtists,
    topTracks,
    topAlbums,
    topGenres,
    newArtistsDiscovered,
    artistDiversity,
    repeatListenerScore,
    topListeningDay,
    favoriteArtist,
    mostPlayedTrack,
  }
})
