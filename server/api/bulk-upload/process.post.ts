// POST /api/bulk-upload/process - Process bulk upload and create artists/albums/tracks
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import JSZip from 'jszip'
import { getUploadUrl } from '~/server/utils/r2'

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

interface DuplicateAction {
  slug: string
  action: 'create' | 'use_existing' | 'skip'
  existingId?: string
}

interface BulkUploadResults {
  success: boolean
  artistsCreated: number
  albumsCreated: number
  tracksCreated: number
  errors: string[]
  createdArtists: { id: string; name: string; slug: string }[]
  createdAlbums: { id: string; title: string; artistName: string }[]
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Parse multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No form data provided' })
  }

  // Extract fields
  let artists: ParsedArtist[] = []
  let duplicateActions: DuplicateAction[] = []
  let zipFile: Buffer | null = null
  let rootPrefix = '' // For nested folder structure

  for (const field of formData) {
    if (field.name === 'artists' && field.data) {
      artists = JSON.parse(field.data.toString())
    } else if (field.name === 'duplicateActions' && field.data) {
      duplicateActions = JSON.parse(field.data.toString())
    } else if (field.name === 'zip' && field.data) {
      zipFile = field.data
    } else if (field.name === 'rootPrefix' && field.data) {
      rootPrefix = field.data.toString()
    }
  }

  if (!artists.length || !zipFile) {
    throw createError({ statusCode: 400, statusMessage: 'Missing artists data or ZIP file' })
  }

  // Check ZIP file size (max 2GB)
  const MAX_ZIP_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
  if (zipFile.length > MAX_ZIP_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ZIP file is too large. Maximum size is 2GB.',
    })
  }

  const client = await serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()

  const results: BulkUploadResults = {
    success: true,
    artistsCreated: 0,
    albumsCreated: 0,
    tracksCreated: 0,
    errors: [],
    createdArtists: [],
    createdAlbums: [],
  }

  // Apply duplicate actions
  const actionMap = new Map(duplicateActions.map((a) => [a.slug, a]))
  for (const artist of artists) {
    const action = actionMap.get(artist.slug)
    if (action) {
      artist.action = action.action
      artist.existingId = action.existingId
    }
  }

  // Load ZIP file
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(zipFile)
  } catch (e: any) {
    console.error('Failed to load ZIP:', e)
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to process ZIP file: ${e.message || 'Unknown error'}`,
    })
  }

  // Helper function to upload file to R2
  const uploadToR2 = async (key: string, data: Buffer, contentType: string): Promise<string> => {
    // Get presigned URL for upload directly using server-side r2 utils
    const uploadUrl = await getUploadUrl(key, contentType)

    // Upload to R2
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: data,
      headers: { 'Content-Type': contentType },
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to R2: ${response.status} ${response.statusText}`)
    }

    return key
  }

  // Helper to get file from ZIP (handles nested folder structure via rootPrefix)
  const getZipFile = async (path: string): Promise<Buffer | null> => {
    // Apply root prefix if provided (for nested folder ZIPs)
    const fullPath = rootPrefix ? rootPrefix + path : path

    // Try exact path first
    let file = zip.file(fullPath)
    if (!file) {
      // Try case-insensitive match
      const lowerPath = fullPath.toLowerCase()
      for (const [name, zipFile] of Object.entries(zip.files)) {
        if (name.toLowerCase() === lowerPath && !zipFile.dir) {
          file = zipFile
          break
        }
      }
    }
    // If still not found and we have a prefix, try without it (fallback)
    if (!file && rootPrefix) {
      file = zip.file(path)
      if (!file) {
        const lowerPath = path.toLowerCase()
        for (const [name, zipFile] of Object.entries(zip.files)) {
          if (name.toLowerCase() === lowerPath && !zipFile.dir) {
            file = zipFile
            break
          }
        }
      }
    }
    if (!file) return null
    return Buffer.from(await file.async('arraybuffer'))
  }

  // Lossless audio validation
  const LOSSLESS_EXTENSIONS = ['wav', 'flac', 'aif', 'aiff']
  const MAX_AUDIO_FILE_SIZE = 300 * 1024 * 1024 // 300MB

  const isLosslessAudio = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase()
    return LOSSLESS_EXTENSIONS.includes(ext || '')
  }

  // Helper to get content type from filename (lossless audio only)
  const getContentType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'wav':
        return 'audio/wav'
      case 'flac':
        return 'audio/flac'
      case 'aif':
      case 'aiff':
        return 'audio/aiff'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'webp':
        return 'image/webp'
      default:
        return 'application/octet-stream'
    }
  }

  // Generate unique slug if needed
  const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
    let slug = baseSlug
    let counter = 1

    while (true) {
      const { data } = await client.from('bands').select('id').eq('slug', slug).single()
      if (!data) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }

  // Process each artist
  for (const artist of artists) {
    // Skip if action is 'skip'
    if (artist.action === 'skip') {
      continue
    }

    let bandId: string

    try {
      if (artist.action === 'use_existing' && artist.existingId) {
        // Use existing artist
        bandId = artist.existingId
      } else {
        // Create new artist
        const slug = artist.action === 'create' && artist.existingId
          ? await generateUniqueSlug(artist.slug)
          : artist.slug

        // Upload avatar if provided
        let avatarKey: string | null = null
        if (artist.avatarPath) {
          const avatarData = await getZipFile(artist.avatarPath)
          if (avatarData) {
            avatarKey = `avatars/${slug}/avatar.jpg`
            await uploadToR2(avatarKey, avatarData, getContentType(artist.avatarPath))
          }
        }

        // Create band (with pending status - requires admin approval like regular artist creation)
        const { data: band, error: bandError } = await client
          .from('bands')
          .insert({
            name: artist.name,
            slug,
            bio: artist.bio || null,
            location: artist.location || null,
            genres: artist.genres,
            avatar_key: avatarKey,
            owner_id: user.id,
            status: 'pending',
          })
          .select('id')
          .single()

        if (bandError || !band) {
          results.errors.push(`Failed to create artist "${artist.name}": ${bandError?.message}`)
          continue
        }

        bandId = band.id
        results.artistsCreated++
        results.createdArtists.push({ id: band.id, name: artist.name, slug })
      }

      // Process albums for this artist
      for (const album of artist.albums) {
        try {
          // Generate album slug
          const albumSlug = album.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

          // Upload cover if provided
          let coverKey: string | null = null
          if (album.coverPath) {
            const coverData = await getZipFile(album.coverPath)
            if (coverData) {
              coverKey = `covers/${bandId}/${albumSlug}/cover.jpg`
              await uploadToR2(coverKey, coverData, getContentType(album.coverPath))
            }
          }

          // Generate P-line and C-line
          const currentYear = new Date().getFullYear()
          const labelName = album.labelName || artist.name
          const pLine = `℗ ${currentYear} ${labelName}`
          const cLine = `© ${currentYear} ${labelName}`

          // Create album
          const { data: albumRecord, error: albumError } = await client
            .from('albums')
            .insert({
              band_id: bandId,
              title: album.title,
              slug: albumSlug,
              description: null,
              release_type: album.type,
              release_date: album.releaseDate || null,
              label_name: labelName,
              upc: album.upc || null,
              cover_key: coverKey,
              p_line: pLine,
              c_line: cLine,
              is_published: true, // Will go through moderation
              rights_confirmed: true,
            })
            .select('id')
            .single()

          if (albumError || !albumRecord) {
            results.errors.push(`Failed to create album "${album.title}": ${albumError?.message}`)
            continue
          }

          results.albumsCreated++
          results.createdAlbums.push({ id: albumRecord.id, title: album.title, artistName: artist.name })

          // Process tracks for this album
          for (const track of album.tracks) {
            try {
              // Validate lossless format
              if (!isLosslessAudio(track.audioPath)) {
                results.errors.push(`Track "${track.title}": Only lossless formats (WAV, FLAC, AIFF) are accepted`)
                continue
              }

              // Upload audio file
              const audioData = await getZipFile(track.audioPath)
              if (!audioData) {
                results.errors.push(`Audio file not found: ${track.audioPath}`)
                continue
              }

              // Validate file size
              if (audioData.length > MAX_AUDIO_FILE_SIZE) {
                results.errors.push(`Track "${track.title}": File exceeds 300MB limit`)
                continue
              }

              // Get extension for storage key
              const audioExt = track.audioPath.split('.').pop()?.toLowerCase() || 'flac'
              const audioKey = `tracks/${bandId}/${albumRecord.id}/${track.trackNumber.toString().padStart(2, '0')}-${track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${audioExt}`
              await uploadToR2(audioKey, audioData, getContentType(track.audioPath))

              // Create track
              const { data: trackRecord, error: trackError } = await client
                .from('tracks')
                .insert({
                  album_id: albumRecord.id,
                  band_id: bandId,
                  title: track.title,
                  track_number: track.trackNumber,
                  audio_key: audioKey, // Keep for backwards compatibility
                  original_audio_key: audioKey, // Store as original lossless
                  original_format: audioExt,
                  transcoding_status: 'pending', // Will be transcoded by worker
                  duration_seconds: track.durationSeconds || 0, // Will be updated by audio processing
                  isrc: track.isrc || null,
                  iswc: track.iswc || null,
                  is_cover: track.isCover,
                  moderation_status: 'pending',
                })
                .select('id')
                .single()

              if (trackError || !trackRecord) {
                results.errors.push(`Failed to create track "${track.title}": ${trackError?.message}`)
                continue
              }

              results.tracksCreated++

              // Add credits
              if (track.credits && track.credits.length > 0) {
                const creditsToInsert = track.credits.map((credit) => ({
                  track_id: trackRecord.id,
                  role: credit.role,
                  name: credit.name,
                }))

                await client.from('track_credits').insert(creditsToInsert)
              }

              // Submit track to moderation queue
              await client.from('moderation_queue').insert({
                track_id: trackRecord.id,
                band_id: bandId,
                submitted_by: user.id,
                status: 'pending',
              })
            } catch (trackErr: any) {
              results.errors.push(`Error processing track "${track.title}": ${trackErr.message}`)
            }
          }
        } catch (albumErr: any) {
          results.errors.push(`Error processing album "${album.title}": ${albumErr.message}`)
        }
      }
    } catch (artistErr: any) {
      results.errors.push(`Error processing artist "${artist.name}": ${artistErr.message}`)
    }
  }

  // Determine overall success
  results.success = results.errors.length === 0

  return results
})
