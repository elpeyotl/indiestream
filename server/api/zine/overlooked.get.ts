// GET /api/zine/overlooked - Great albums with low stream counts
// Albums that are published, have good ratings or recent activity, but few streams
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  // Get published albums with low stream counts
  // Order by created_at to favor newer albums that haven't had time to build streams
  const { data: albums } = await client
    .from('albums')
    .select(`
      id,
      title,
      slug,
      cover_key,
      created_at,
      bands!inner (
        id,
        name,
        slug,
        status
      )
    `)
    .eq('status', 'published')
    .eq('bands.status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!albums || albums.length === 0) {
    return { albums: [] }
  }

  // Get stream counts for these albums
  const albumIds = albums.map(a => a.id)

  const { data: streamData } = await client
    .from('listening_history')
    .select('track_id, tracks!inner(album_id)')
    .in('tracks.album_id', albumIds)

  // Count streams per album
  const streamCounts = new Map<string, number>()
  for (const listen of streamData || []) {
    const albumId = (listen.tracks as any)?.album_id
    if (albumId) {
      streamCounts.set(albumId, (streamCounts.get(albumId) || 0) + 1)
    }
  }

  // Filter to albums with < 100 streams (the "overlooked" threshold)
  const overlooked = albums
    .map(a => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      cover_key: a.cover_key,
      band: a.bands,
      stream_count: streamCounts.get(a.id) || 0,
      created_at: a.created_at,
    }))
    .filter(a => a.stream_count < 100)
    .sort((a, b) => {
      // Prioritize albums with some streams over zero
      // Then sort by recency
      if (a.stream_count > 0 && b.stream_count === 0) return -1
      if (b.stream_count > 0 && a.stream_count === 0) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, 12)

  return {
    albums: overlooked,
  }
})
