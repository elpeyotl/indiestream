interface MusicBrainzWork {
  id: string
  title: string
  iswcs?: string[]
  relations?: Array<{
    type: string
    artist?: {
      id: string
      name: string
      'sort-name': string
    }
  }>
}

interface MusicBrainzSearchResponse {
  works: MusicBrainzWork[]
  count: number
  offset: number
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { title, artist } = query

  if (!title || typeof title !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'title query parameter is required',
    })
  }

  // Build search query
  // MusicBrainz uses Lucene query syntax
  let searchQuery = `work:"${encodeURIComponent(title)}"`
  if (artist && typeof artist === 'string') {
    searchQuery += ` AND artist:"${encodeURIComponent(artist)}"`
  }

  const url = `https://musicbrainz.org/ws/2/work?query=${searchQuery}&fmt=json&limit=10`

  const response = await fetch(url, {
    headers: {
      // MusicBrainz requires a User-Agent with app name and contact
      'User-Agent': 'Indiestream/1.0 (https://indiestream.app)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 503) {
      throw createError({
        statusCode: 503,
        statusMessage: 'MusicBrainz rate limit exceeded. Please wait a moment.',
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search MusicBrainz',
    })
  }

  const data = (await response.json()) as MusicBrainzSearchResponse

  // Transform to a cleaner response
  const results = data.works.map((work) => {
    // Extract composers from relations
    const composers = (work.relations || [])
      .filter((r) => r.type === 'composer' || r.type === 'writer' || r.type === 'lyricist')
      .map((r) => ({
        name: r.artist?.name || 'Unknown',
        role: r.type,
      }))

    return {
      musicbrainzWorkId: work.id,
      title: work.title,
      iswc: work.iswcs?.[0] || null, // Usually only one ISWC per work
      iswcs: work.iswcs || [],
      composers,
    }
  })

  return {
    count: data.count,
    results,
  }
})
