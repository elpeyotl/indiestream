// GET /api/listening-history/recent - Get recently played tracks (unique)
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface RecentlyPlayedTrack {
  id: string
  title: string
  artistName: string
  artistSlug: string
  albumTitle: string
  albumSlug: string
  coverKey: string | null
  coverUrl: string | null
  playedAt: string
}

export default defineEventHandler(async (event): Promise<RecentlyPlayedTrack[]> => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 10, 20) // Max 20

  // Get recent listening history with track details
  // We need to get unique tracks, ordered by most recent play
  const { data: historyData, error: historyError } = await client
    .from('listening_history')
    .select(`
      id,
      track_id,
      listened_at,
      tracks!inner (
        id,
        title,
        albums!inner (
          id,
          title,
          slug,
          cover_key,
          cover_url,
          bands!inner (
            id,
            name,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('listened_at', { ascending: false })
    .limit(100) // Fetch more to find unique tracks

  if (historyError) {
    console.error('Failed to fetch listening history:', historyError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch listening history' })
  }

  if (!historyData || historyData.length === 0) {
    return []
  }

  // Deduplicate by track_id, keeping the most recent play
  const seenTrackIds = new Set<string>()
  const uniqueTracks: RecentlyPlayedTrack[] = []

  for (const item of historyData) {
    if (seenTrackIds.has(item.track_id)) continue
    seenTrackIds.add(item.track_id)

    const track = item.tracks as any
    const album = track?.albums
    const band = album?.bands

    uniqueTracks.push({
      id: track?.id || item.track_id,
      title: track?.title || 'Unknown Track',
      artistName: band?.name || 'Unknown Artist',
      artistSlug: band?.slug || '',
      albumTitle: album?.title || 'Unknown Album',
      albumSlug: album?.slug || '',
      coverKey: album?.cover_key || null,
      coverUrl: album?.cover_url || null,
      playedAt: item.listened_at,
    })

    if (uniqueTracks.length >= limit) break
  }

  return uniqueTracks
})
