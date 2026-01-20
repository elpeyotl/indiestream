// CSV Parser utility for bulk upload
// Handles parsing and validating CSV data for bulk imports

export interface CsvRow {
  // Artist fields
  artist_name: string
  artist_slug?: string
  artist_bio?: string
  artist_location?: string
  artist_genres?: string
  artist_avatar?: string

  // Album fields
  album_title: string
  album_type?: 'album' | 'ep' | 'single'
  release_date?: string
  label_name?: string
  upc?: string
  cover_file?: string

  // Track fields
  track_number: number
  track_title: string
  audio_file: string
  isrc?: string
  iswc?: string
  is_cover?: boolean
  is_explicit?: boolean
  duration_seconds?: number

  // Credit fields (comma-separated)
  composer?: string
  lyricist?: string
  producer?: string
  performer?: string
}

export interface ParsedArtist {
  name: string
  slug: string
  bio?: string
  location?: string
  genres: string[]
  avatarPath?: string
  albums: ParsedAlbum[]
  existingId?: string // If artist already exists in DB
  action?: 'create' | 'use_existing' | 'skip'
}

export interface ParsedAlbum {
  title: string
  type: 'album' | 'ep' | 'single'
  releaseDate?: string
  labelName?: string
  upc?: string
  coverPath?: string
  tracks: ParsedTrack[]
}

export interface ParsedTrack {
  trackNumber: number
  title: string
  audioPath: string
  isrc?: string
  iswc?: string
  isCover: boolean
  isExplicit: boolean
  durationSeconds?: number
  credits: ParsedCredit[]
}

export interface ParsedCredit {
  role: 'composer' | 'author' | 'composer_author' | 'producer' | 'interpreter'
  name: string
}

export interface CsvValidationError {
  row: number
  field: string
  message: string
  type: 'error' | 'warning'
}

export interface CsvParseResult {
  success: boolean
  artists: ParsedArtist[]
  errors: CsvValidationError[]
  warnings: CsvValidationError[]
  rowCount: number
}

// ISRC format: 2 letters + 3 alphanumeric + 2 digits + 5 digits
const ISRC_REGEX = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/

// ISWC format: T-XXXXXXXXX-X
const ISWC_REGEX = /^T-[0-9]{9}-[0-9]$/

// Lossless audio formats (WAV, FLAC, AIFF)
const LOSSLESS_EXTENSIONS = ['wav', 'flac', 'aif', 'aiff']

// Slugify a string
const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Parse CSV string to array of objects
export const parseCsv = (csvContent: string): CsvRow[] => {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  // Parse header
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))

  // Parse data rows
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: any = {}

    headers.forEach((header, index) => {
      let value = values[index]?.trim() || ''

      // Type conversions
      if (header === 'track_number' || header === 'duration_seconds') {
        row[header] = parseInt(value, 10) || 0
      } else if (header === 'is_cover' || header === 'is_explicit') {
        row[header] = value.toLowerCase() === 'true' || value === '1'
      } else {
        row[header] = value
      }
    })

    rows.push(row as CsvRow)
  }

  return rows
}

// Parse a single CSV line handling quoted values
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++
      } else if (char === '"') {
        // End of quoted string
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current)
  return result
}

// Validate and transform CSV rows into structured data
export const validateAndTransformCsv = (rows: CsvRow[]): CsvParseResult => {
  const errors: CsvValidationError[] = []
  const warnings: CsvValidationError[] = []
  const artistsMap = new Map<string, ParsedArtist>()

  rows.forEach((row, index) => {
    const rowNum = index + 2 // Account for header row and 0-indexing

    // Required field validation
    if (!row.artist_name?.trim()) {
      errors.push({ row: rowNum, field: 'artist_name', message: 'Artist name is required', type: 'error' })
    }
    if (!row.album_title?.trim()) {
      errors.push({ row: rowNum, field: 'album_title', message: 'Album title is required', type: 'error' })
    }
    if (!row.track_title?.trim()) {
      errors.push({ row: rowNum, field: 'track_title', message: 'Track title is required', type: 'error' })
    }
    if (!row.track_number || row.track_number < 1) {
      errors.push({ row: rowNum, field: 'track_number', message: 'Track number must be a positive integer', type: 'error' })
    }
    if (!row.audio_file?.trim()) {
      errors.push({ row: rowNum, field: 'audio_file', message: 'Audio file path is required', type: 'error' })
    } else {
      // Validate lossless audio format
      const ext = row.audio_file.split('.').pop()?.toLowerCase()
      if (!LOSSLESS_EXTENSIONS.includes(ext || '')) {
        errors.push({ row: rowNum, field: 'audio_file', message: `Invalid audio format. Only lossless formats (WAV, FLAC, AIFF) are accepted: ${row.audio_file}`, type: 'error' })
      }
    }

    // ISRC validation
    if (row.isrc && !ISRC_REGEX.test(row.isrc.toUpperCase().replace(/-/g, ''))) {
      errors.push({ row: rowNum, field: 'isrc', message: `Invalid ISRC format: ${row.isrc}`, type: 'error' })
    }

    // ISWC validation
    if (row.iswc && !ISWC_REGEX.test(row.iswc.toUpperCase())) {
      warnings.push({ row: rowNum, field: 'iswc', message: `Invalid ISWC format: ${row.iswc}`, type: 'warning' })
    }

    // UPC validation (12-13 digits)
    if (row.upc && !/^\d{12,13}$/.test(row.upc)) {
      warnings.push({ row: rowNum, field: 'upc', message: `Invalid UPC format: ${row.upc}`, type: 'warning' })
    }

    // Release date validation
    if (row.release_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.release_date)) {
      errors.push({ row: rowNum, field: 'release_date', message: `Invalid date format (use YYYY-MM-DD): ${row.release_date}`, type: 'error' })
    }

    // Skip row if required fields are missing
    if (!row.artist_name?.trim() || !row.album_title?.trim() || !row.track_title?.trim()) {
      return
    }

    // Build structured data
    const artistSlug = row.artist_slug?.trim() || slugify(row.artist_name)
    const albumKey = `${artistSlug}:${slugify(row.album_title)}`

    // Get or create artist
    let artist = artistsMap.get(artistSlug)
    if (!artist) {
      artist = {
        name: row.artist_name.trim(),
        slug: artistSlug,
        bio: row.artist_bio?.trim(),
        location: row.artist_location?.trim(),
        genres: row.artist_genres?.split(',').map((g) => g.trim()).filter(Boolean).slice(0, 5) || [],
        avatarPath: row.artist_avatar?.trim(),
        albums: [],
        action: 'create',
      }
      artistsMap.set(artistSlug, artist)
    }

    // Get or create album
    let album = artist.albums.find((a) => `${artistSlug}:${slugify(a.title)}` === albumKey)
    if (!album) {
      album = {
        title: row.album_title.trim(),
        type: (row.album_type as 'album' | 'ep' | 'single') || 'album',
        releaseDate: row.release_date?.trim(),
        labelName: row.label_name?.trim(),
        upc: row.upc?.trim(),
        coverPath: row.cover_file?.trim(),
        tracks: [],
      }
      artist.albums.push(album)
    }

    // Parse credits
    const credits: ParsedCredit[] = []
    if (row.composer) {
      row.composer.split(',').forEach((name) => {
        if (name.trim()) {
          credits.push({ role: 'composer', name: name.trim() })
        }
      })
    }
    if (row.lyricist) {
      row.lyricist.split(',').forEach((name) => {
        if (name.trim()) {
          credits.push({ role: 'author', name: name.trim() })
        }
      })
    }
    if (row.producer) {
      row.producer.split(',').forEach((name) => {
        if (name.trim()) {
          credits.push({ role: 'producer', name: name.trim() })
        }
      })
    }
    if (row.performer) {
      row.performer.split(',').forEach((name) => {
        if (name.trim()) {
          credits.push({ role: 'interpreter', name: name.trim() })
        }
      })
    }

    // Add track
    album.tracks.push({
      trackNumber: row.track_number,
      title: row.track_title.trim(),
      audioPath: row.audio_file.trim(),
      isrc: row.isrc?.toUpperCase().replace(/-/g, ''),
      iswc: row.iswc?.toUpperCase(),
      isCover: row.is_cover || false,
      isExplicit: row.is_explicit || false,
      durationSeconds: row.duration_seconds,
      credits,
    })
  })

  // Sort tracks by track number within each album
  artistsMap.forEach((artist) => {
    artist.albums.forEach((album) => {
      album.tracks.sort((a, b) => a.trackNumber - b.trackNumber)
    })
  })

  return {
    success: errors.length === 0,
    artists: Array.from(artistsMap.values()),
    errors,
    warnings,
    rowCount: rows.length,
  }
}

// CSV template headers
export const CSV_HEADERS = [
  'artist_name',
  'artist_slug',
  'artist_bio',
  'artist_location',
  'artist_genres',
  'artist_avatar',
  'album_title',
  'album_type',
  'release_date',
  'label_name',
  'upc',
  'cover_file',
  'track_number',
  'track_title',
  'audio_file',
  'isrc',
  'iswc',
  'is_cover',
  'is_explicit',
  'duration_seconds',
  'composer',
  'lyricist',
  'producer',
  'performer',
]

// Example data for the template - includes multiple artists, albums, and tracks
export const CSV_EXAMPLE_ROWS = [
  // Artist 1: Neon Waves - Electronic duo from Berlin
  // Album 1: Synthetic Dreams (4 tracks)
  {
    artist_name: 'Neon Waves',
    artist_slug: 'neon-waves',
    artist_bio: 'Electronic duo crafting atmospheric soundscapes since 2020. Blending vintage synths with modern production.',
    artist_location: 'Berlin, Germany',
    artist_genres: 'electronic,synthwave,ambient',
    artist_avatar: 'neon-waves/avatar.jpg',
    album_title: 'Synthetic Dreams',
    album_type: 'album',
    release_date: '2024-03-15',
    label_name: 'Indie Sounds Records',
    upc: '123456789012',
    cover_file: 'neon-waves/synthetic-dreams/cover.jpg',
    track_number: '1',
    track_title: 'Digital Sunrise',
    audio_file: 'neon-waves/synthetic-dreams/01-digital-sunrise.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'Alex Chen,Maya Rodriguez',
    lyricist: '',
    producer: 'Alex Chen',
    performer: '',
  },
  {
    artist_name: 'Neon Waves',
    artist_slug: '',
    artist_bio: '',
    artist_location: '',
    artist_genres: '',
    artist_avatar: '',
    album_title: 'Synthetic Dreams',
    album_type: '',
    release_date: '',
    label_name: '',
    upc: '',
    cover_file: '',
    track_number: '2',
    track_title: 'Midnight Protocol',
    audio_file: 'neon-waves/synthetic-dreams/02-midnight-protocol.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'Alex Chen',
    lyricist: '',
    producer: 'Maya Rodriguez',
    performer: '',
  },
  {
    artist_name: 'Neon Waves',
    artist_slug: '',
    artist_bio: '',
    artist_location: '',
    artist_genres: '',
    artist_avatar: '',
    album_title: 'Synthetic Dreams',
    album_type: '',
    release_date: '',
    label_name: '',
    upc: '',
    cover_file: '',
    track_number: '3',
    track_title: 'Chrome Hearts',
    audio_file: 'neon-waves/synthetic-dreams/03-chrome-hearts.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'Maya Rodriguez',
    lyricist: 'Maya Rodriguez',
    producer: 'Alex Chen',
    performer: '',
  },
  {
    artist_name: 'Neon Waves',
    artist_slug: '',
    artist_bio: '',
    artist_location: '',
    artist_genres: '',
    artist_avatar: '',
    album_title: 'Synthetic Dreams',
    album_type: '',
    release_date: '',
    label_name: '',
    upc: '',
    cover_file: '',
    track_number: '4',
    track_title: 'Neon Fade',
    audio_file: 'neon-waves/synthetic-dreams/04-neon-fade.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'Alex Chen,Maya Rodriguez',
    lyricist: '',
    producer: 'Alex Chen,Maya Rodriguez',
    performer: '',
  },
  // Artist 2: The Velvet Moths - Indie rock band from Portland
  // Album 1: Paper Wings EP (3 tracks)
  {
    artist_name: 'The Velvet Moths',
    artist_slug: 'the-velvet-moths',
    artist_bio: 'Indie rock quartet known for dreamy guitars and introspective lyrics. Formed in a Portland basement in 2019.',
    artist_location: 'Portland, OR',
    artist_genres: 'indie rock,dream pop,shoegaze',
    artist_avatar: 'the-velvet-moths/avatar.jpg',
    album_title: 'Paper Wings',
    album_type: 'ep',
    release_date: '2024-05-01',
    label_name: 'Indie Sounds Records',
    upc: '234567890123',
    cover_file: 'the-velvet-moths/paper-wings/cover.jpg',
    track_number: '1',
    track_title: 'Whisper Valley',
    audio_file: 'the-velvet-moths/paper-wings/01-whisper-valley.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'Jamie Park',
    lyricist: 'Jamie Park',
    producer: 'Sam Wilson',
    performer: '',
  },
  {
    artist_name: 'The Velvet Moths',
    artist_slug: '',
    artist_bio: '',
    artist_location: '',
    artist_genres: '',
    artist_avatar: '',
    album_title: 'Paper Wings',
    album_type: '',
    release_date: '',
    label_name: '',
    upc: '',
    cover_file: '',
    track_number: '2',
    track_title: 'Glass Houses',
    audio_file: 'the-velvet-moths/paper-wings/02-glass-houses.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'Jamie Park,River Stone',
    lyricist: 'River Stone',
    producer: 'Sam Wilson',
    performer: '',
  },
  {
    artist_name: 'The Velvet Moths',
    artist_slug: '',
    artist_bio: '',
    artist_location: '',
    artist_genres: '',
    artist_avatar: '',
    album_title: 'Paper Wings',
    album_type: '',
    release_date: '',
    label_name: '',
    upc: '',
    cover_file: '',
    track_number: '3',
    track_title: 'Autumn Glow',
    audio_file: 'the-velvet-moths/paper-wings/03-autumn-glow.flac',
    isrc: '',
    iswc: '',
    is_cover: 'false',
    is_explicit: 'false',
    duration_seconds: '',
    composer: 'River Stone',
    lyricist: 'Jamie Park,River Stone',
    producer: 'Sam Wilson',
    performer: '',
  },
]

// Helper to escape CSV values
const escapeCsvValue = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Generate a CSV template with example data
export const generateCsvTemplate = (): string => {
  const rows = [
    CSV_HEADERS.join(','),
    ...CSV_EXAMPLE_ROWS.map((row) =>
      CSV_HEADERS.map((header) => escapeCsvValue((row as Record<string, string>)[header] || '')).join(',')
    ),
  ]
  return rows.join('\n')
}

// Get example file paths for the ZIP structure
export const getExampleFilePaths = (): string[] => {
  const paths: string[] = []
  const seenPaths = new Set<string>()

  for (const row of CSV_EXAMPLE_ROWS) {
    // Add avatar if present and not already added
    if (row.artist_avatar && !seenPaths.has(row.artist_avatar)) {
      paths.push(row.artist_avatar)
      seenPaths.add(row.artist_avatar)
    }
    // Add cover if present and not already added
    if (row.cover_file && !seenPaths.has(row.cover_file)) {
      paths.push(row.cover_file)
      seenPaths.add(row.cover_file)
    }
    // Add audio file
    if (row.audio_file && !seenPaths.has(row.audio_file)) {
      paths.push(row.audio_file)
      seenPaths.add(row.audio_file)
    }
  }

  return paths.sort()
}
