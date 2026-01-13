interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyTrackResponse {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  external_ids?: {
    isrc?: string
    upc?: string
    ean?: string
  }
  album?: {
    name: string
    release_date: string
    images: Array<{ url: string; width: number; height: number }>
  }
  artists: Array<{ name: string; id: string }>
}

// Cache token in memory (reuse until expiry)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getSpotifyToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Spotify credentials not configured',
    })
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get Spotify access token',
    })
  }

  const data = (await response.json()) as SpotifyTokenResponse

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return data.access_token
}

function extractTrackId(input: string): string | null {
  // Handle various Spotify URL formats:
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=xxx
  // spotify:track:4iV5W9uYEdYUVa79Axb7Rh
  // Just the ID: 4iV5W9uYEdYUVa79Axb7Rh

  const trimmed = input.trim()

  // Spotify URI format
  const uriMatch = trimmed.match(/spotify:track:([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]

  // URL format
  const urlMatch = trimmed.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]

  // Plain ID (22 characters, alphanumeric)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { spotifyUrl } = body

  if (!spotifyUrl || typeof spotifyUrl !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'spotifyUrl is required',
    })
  }

  const trackId = extractTrackId(spotifyUrl)
  if (!trackId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Spotify URL or track ID',
    })
  }

  const token = await getSpotifyToken()

  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Track not found on Spotify',
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch track from Spotify',
    })
  }

  const track = (await response.json()) as SpotifyTrackResponse

  return {
    spotifyTrackId: track.id,
    name: track.name,
    durationMs: track.duration_ms,
    durationSeconds: Math.round(track.duration_ms / 1000),
    isrc: track.external_ids?.isrc || null,
    upc: track.external_ids?.upc || null,
    explicit: track.explicit,
    albumName: track.album?.name || null,
    releaseDate: track.album?.release_date || null,
    artists: track.artists.map((a) => a.name),
    coverUrl: track.album?.images?.[0]?.url || null,
  }
})
