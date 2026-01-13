interface DeezerTrackResponse {
  id: number
  title: string
  duration: number
  isrc: string
  explicit_lyrics: boolean
  album?: {
    title: string
    cover_medium: string
    release_date: string
  }
  artist?: {
    name: string
  }
}

interface DeezerSearchResponse {
  data: DeezerTrackResponse[]
  total: number
}

function extractDeezerTrackId(input: string): string | null {
  const trimmed = input.trim()

  // URL format: https://www.deezer.com/track/123456789
  const urlMatch = trimmed.match(/deezer\.com\/(?:\w+\/)?track\/(\d+)/)
  if (urlMatch) return urlMatch[1]

  // Plain ID (numeric)
  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { deezerUrl, searchQuery, artistName } = body

  // Option 1: Fetch by Deezer URL/ID
  if (deezerUrl) {
    const trackId = extractDeezerTrackId(deezerUrl)
    if (!trackId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Deezer URL or track ID',
      })
    }

    const response = await fetch(`https://api.deezer.com/track/${trackId}`)

    if (!response.ok) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Track not found on Deezer',
      })
    }

    const track = (await response.json()) as DeezerTrackResponse

    if (track.id === undefined) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Track not found on Deezer',
      })
    }

    return {
      source: 'deezer',
      deezerTrackId: track.id.toString(),
      name: track.title,
      durationSeconds: track.duration,
      isrc: track.isrc || null,
      explicit: track.explicit_lyrics,
      albumName: track.album?.title || null,
      releaseDate: track.album?.release_date || null,
      artist: track.artist?.name || null,
      coverUrl: track.album?.cover_medium || null,
    }
  }

  // Option 2: Search by title (and optionally artist)
  if (searchQuery) {
    let query = encodeURIComponent(searchQuery)
    if (artistName) {
      query = encodeURIComponent(`${searchQuery} ${artistName}`)
    }

    const response = await fetch(`https://api.deezer.com/search/track?q=${query}&limit=5`)

    if (!response.ok) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to search Deezer',
      })
    }

    const data = (await response.json()) as DeezerSearchResponse

    if (!data.data || data.data.length === 0) {
      return {
        source: 'deezer',
        results: [],
      }
    }

    // Search endpoint doesn't return ISRC, so fetch full details for each track
    const resultsWithIsrc = await Promise.all(
      data.data.map(async (track) => {
        try {
          const detailResponse = await fetch(`https://api.deezer.com/track/${track.id}`)
          if (detailResponse.ok) {
            const details = (await detailResponse.json()) as DeezerTrackResponse
            return {
              deezerTrackId: track.id.toString(),
              name: track.title,
              artist: track.artist?.name || 'Unknown',
              albumName: track.album?.title || null,
              isrc: details.isrc || null,
              durationSeconds: track.duration,
            }
          }
        } catch {
          // Fall back to no ISRC if fetch fails
        }
        return {
          deezerTrackId: track.id.toString(),
          name: track.title,
          artist: track.artist?.name || 'Unknown',
          albumName: track.album?.title || null,
          isrc: null,
          durationSeconds: track.duration,
        }
      })
    )

    return {
      source: 'deezer',
      results: resultsWithIsrc,
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Either deezerUrl or searchQuery is required',
  })
})
