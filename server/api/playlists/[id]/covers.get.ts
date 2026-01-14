import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')

  if (!playlistId) {
    throw createError({
      statusCode: 400,
      message: 'Playlist ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Get the first 4 tracks with their album covers
  const { data: tracks, error } = await client
    .from('playlist_tracks')
    .select(`
      track:tracks (
        album:albums (
          cover_url,
          cover_key
        )
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true })
    .limit(4)

  if (error) {
    console.error('Failed to fetch playlist covers:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch playlist covers',
    })
  }

  // Extract unique cover URLs/keys (dedupe in case same album appears multiple times)
  const coverSet = new Set<string>()
  const covers: Array<{ url?: string; key?: string }> = []

  for (const item of tracks || []) {
    const album = (item.track as any)?.album
    if (!album) continue

    const identifier = album.cover_key || album.cover_url
    if (identifier && !coverSet.has(identifier)) {
      coverSet.add(identifier)
      covers.push({
        url: album.cover_url || undefined,
        key: album.cover_key || undefined,
      })
    }

    if (covers.length >= 4) break
  }

  return { covers }
})
