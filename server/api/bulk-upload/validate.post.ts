// POST /api/bulk-upload/validate - Validate bulk upload data
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

interface ParsedArtist {
  name: string
  slug: string
  bio?: string
  location?: string
  genres: string[]
  avatarPath?: string
  albums: ParsedAlbum[]
  existingId?: string
  action?: 'create' | 'use_existing' | 'skip'
}

interface ParsedAlbum {
  title: string
  type: 'album' | 'ep' | 'single'
  releaseDate?: string
  labelName?: string
  upc?: string
  coverPath?: string
  tracks: ParsedTrack[]
}

interface ParsedTrack {
  trackNumber: number
  title: string
  audioPath: string
  isrc?: string
  iswc?: string
  isCover: boolean
  isExplicit: boolean
  durationSeconds?: number
  credits: { role: string; name: string }[]
}

interface DuplicateArtist {
  csvSlug: string
  csvName: string
  existingId: string
  existingName: string
  action: 'create' | 'use_existing' | 'skip'
}

interface ValidationError {
  row: number
  field: string
  message: string
  type: 'error' | 'warning'
}

// Lossless audio validation
const LOSSLESS_EXTENSIONS = ['wav', 'flac', 'aif', 'aiff']

const isLosslessAudio = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return LOSSLESS_EXTENSIONS.includes(ext || '')
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { artists, zipFiles } = body as {
    artists: ParsedArtist[]
    zipFiles: string[]
  }

  if (!artists || artists.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No artists provided' })
  }

  const client = await serverSupabaseServiceRole(event)
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const duplicateArtists: DuplicateArtist[] = []
  const missingFiles: string[] = []
  const existingIsrcs: string[] = []

  // Create a set of ZIP files for quick lookup (lowercase for case-insensitive matching)
  const zipFileSet = new Set(zipFiles.map((f: string) => f.toLowerCase()))

  // Check for duplicate artists (by slug)
  const artistSlugs = artists.map((a) => a.slug)
  const { data: existingBands } = await client
    .from('bands')
    .select('id, slug, name')
    .in('slug', artistSlugs)

  if (existingBands && existingBands.length > 0) {
    for (const existing of existingBands) {
      const csvArtist = artists.find((a) => a.slug === existing.slug)
      if (csvArtist) {
        duplicateArtists.push({
          csvSlug: existing.slug,
          csvName: csvArtist.name,
          existingId: existing.id,
          existingName: existing.name,
          action: 'use_existing', // Default action
        })
      }
    }
  }

  // Collect all ISRCs from the import
  const allIsrcs: string[] = []
  for (const artist of artists) {
    for (const album of artist.albums) {
      for (const track of album.tracks) {
        if (track.isrc) {
          allIsrcs.push(track.isrc)
        }
      }
    }
  }

  // Check for existing ISRCs
  if (allIsrcs.length > 0) {
    const { data: existingTracks } = await client
      .from('tracks')
      .select('isrc')
      .in('isrc', allIsrcs)

    if (existingTracks && existingTracks.length > 0) {
      existingIsrcs.push(...existingTracks.map((t) => t.isrc!))
    }
  }

  // Validate file references and audio formats
  const invalidFormats: string[] = []
  for (const artist of artists) {
    if (artist.avatarPath && !zipFileSet.has(artist.avatarPath.toLowerCase())) {
      missingFiles.push(artist.avatarPath)
    }

    for (const album of artist.albums) {
      if (album.coverPath && !zipFileSet.has(album.coverPath.toLowerCase())) {
        missingFiles.push(album.coverPath)
      }

      for (const track of album.tracks) {
        if (!zipFileSet.has(track.audioPath.toLowerCase())) {
          missingFiles.push(track.audioPath)
        }
        // Validate lossless format
        if (!isLosslessAudio(track.audioPath)) {
          invalidFormats.push(track.audioPath)
        }
      }
    }
  }

  // Add invalid format errors
  for (const file of [...new Set(invalidFormats)]) {
    errors.push({
      row: 0,
      field: 'audio_file',
      message: `Invalid audio format: ${file}. Only lossless formats (WAV, FLAC, AIFF) are accepted.`,
      type: 'error',
    })
  }

  // Add missing files as errors
  for (const file of [...new Set(missingFiles)]) {
    errors.push({
      row: 0,
      field: 'file',
      message: `File not found in ZIP: ${file}`,
      type: 'error',
    })
  }

  // Add existing ISRCs as warnings
  for (const isrc of existingIsrcs) {
    warnings.push({
      row: 0,
      field: 'isrc',
      message: `ISRC ${isrc} already exists in the database`,
      type: 'warning',
    })
  }

  // Calculate validity
  const valid = errors.length === 0 && missingFiles.length === 0 && invalidFormats.length === 0

  return {
    valid,
    duplicateArtists,
    missingFiles: [...new Set(missingFiles)],
    existingIsrcs,
    errors,
    warnings,
  }
})
