// GET /api/artists/[id]/tracks - Get tracks from an artist for playback
import { serverSupabaseClient } from '#supabase/server'

interface ArtistTrack {
  id: string
  title: string
  audioKey: string
  duration: number
  albumTitle: string
  albumSlug: string
  coverKey: string | null
}

export default defineEventHandler(async (event): Promise<ArtistTrack[]> => {
  const bandId = getRouterParam(event, 'id')
  if (!bandId) {
    throw createError({ statusCode: 400, statusMessage: 'Artist ID required' })
  }

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 20, 50)
  const shuffle = query.shuffle === 'true'

  // Get published albums with their tracks for this artist
  const { data: albums, error } = await client
    .from('albums')
    .select(`
      id,
      title,
      slug,
      cover_key,
      tracks!inner (
        id,
        title,
        audio_key,
        duration_seconds,
        moderation_status
      )
    `)
    .eq('band_id', bandId)
    .eq('is_published', true)

  if (error) {
    console.error('Failed to fetch artist tracks:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tracks' })
  }

  if (!albums || albums.length === 0) {
    return []
  }

  // Flatten tracks from all albums, filtering for approved tracks with audio
  const allTracks: ArtistTrack[] = []
  for (const album of albums) {
    const tracks = album.tracks as any[]
    for (const track of tracks) {
      // Only include tracks that are approved and have audio
      if (track.audio_key && track.moderation_status === 'approved') {
        allTracks.push({
          id: track.id,
          title: track.title,
          audioKey: track.audio_key,
          duration: track.duration_seconds || 0,
          albumTitle: album.title,
          albumSlug: album.slug,
          coverKey: album.cover_key,
        })
      }
    }
  }

  // Shuffle if requested
  let result = allTracks
  if (shuffle) {
    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
  }

  // Limit results
  return result.slice(0, limit)
})
