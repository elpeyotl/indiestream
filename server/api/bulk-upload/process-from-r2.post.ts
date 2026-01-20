// POST /api/bulk-upload/process-from-r2 - Process bulk upload ZIP from R2 storage
// This endpoint processes a ZIP that was already uploaded to R2, avoiding memory issues
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
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
  createdArtists: { id: string; name: string; slug: string; avatarKey?: string | null }[]
  createdAlbums: { id: string; title: string; artistName: string; coverKey?: string | null; artistSlug: string; albumSlug: string }[]
}

// Lossless audio validation
const LOSSLESS_EXTENSIONS = ['wav', 'flac', 'aif', 'aiff']
const MAX_AUDIO_FILE_SIZE = 300 * 1024 * 1024 // 300MB

const isLosslessAudio = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase()
  return LOSSLESS_EXTENSIONS.includes(ext || '')
}

// Helper to get content type from filename
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

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { zipKey, artists, duplicateActions, rootPrefix } = body as {
    zipKey: string
    artists: ParsedArtist[]
    duplicateActions?: DuplicateAction[]
    rootPrefix?: string
  }

  if (!zipKey || !artists?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing zipKey or artists data' })
  }

  // Verify the ZIP belongs to this user
  if (!zipKey.startsWith(`bulk-uploads/${user.id}/`)) {
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized access to ZIP file' })
  }

  const config = useRuntimeConfig()
  const client = await serverSupabaseServiceRole(event)

  const results: BulkUploadResults = {
    success: true,
    artistsCreated: 0,
    albumsCreated: 0,
    tracksCreated: 0,
    errors: [],
    createdArtists: [],
    createdAlbums: [],
  }

  // Create S3 client for R2
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  // Download ZIP from R2
  let zipData: Buffer
  try {
    const command = new GetObjectCommand({
      Bucket: config.r2BucketName,
      Key: zipKey,
    })
    const response = await r2Client.send(command)

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const stream = response.Body as NodeJS.ReadableStream
    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array)
    }
    zipData = Buffer.concat(chunks)
  } catch (e: any) {
    console.error('Failed to download ZIP from R2:', e)
    throw createError({
      statusCode: 400,
      statusMessage: 'Failed to retrieve ZIP file. It may have expired or been deleted.',
    })
  }

  // Load ZIP
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(zipData)
  } catch (e: any) {
    console.error('Failed to parse ZIP:', e)
    throw createError({
      statusCode: 400,
      statusMessage: `Failed to process ZIP file: ${e.message || 'Unknown error'}`,
    })
  }

  // Apply duplicate actions
  const actionMap = new Map((duplicateActions || []).map((a) => [a.slug, a]))
  for (const artist of artists) {
    const action = actionMap.get(artist.slug)
    if (action) {
      artist.action = action.action
      artist.existingId = action.existingId
    }
  }

  // Helper to get file from ZIP (handles nested folder structure)
  const getZipFile = async (path: string): Promise<Buffer | null> => {
    const fullPath = rootPrefix ? rootPrefix + path : path

    let file = zip.file(fullPath)
    if (!file) {
      const lowerPath = fullPath.toLowerCase()
      for (const [name, zipFile] of Object.entries(zip.files)) {
        if (name.toLowerCase() === lowerPath && !zipFile.dir) {
          file = zipFile
          break
        }
      }
    }
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

  // Helper function to upload file to R2
  const uploadToR2 = async (key: string, data: Buffer, contentType: string): Promise<string> => {
    const uploadUrl = await getUploadUrl(key, contentType)
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
    if (artist.action === 'skip') continue

    let bandId: string
    let artistSlug: string = artist.slug

    try {
      if (artist.action === 'use_existing' && artist.existingId) {
        bandId = artist.existingId
        // artistSlug stays as artist.slug from CSV
      } else {
        artistSlug = artist.action === 'create' && artist.existingId
          ? await generateUniqueSlug(artist.slug)
          : artist.slug

        let avatarKey: string | null = null
        if (artist.avatarPath) {
          const avatarData = await getZipFile(artist.avatarPath)
          if (avatarData) {
            avatarKey = `avatars/${artistSlug}/avatar.jpg`
            await uploadToR2(avatarKey, avatarData, getContentType(artist.avatarPath))
          }
        }

        const { data: band, error: bandError } = await client
          .from('bands')
          .insert({
            name: artist.name,
            slug: artistSlug,
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
        results.createdArtists.push({ id: band.id, name: artist.name, slug: artistSlug, avatarKey })
      }

      // Process albums
      for (const album of artist.albums) {
        try {
          const albumSlug = album.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

          let coverKey: string | null = null
          if (album.coverPath) {
            const coverData = await getZipFile(album.coverPath)
            if (coverData) {
              coverKey = `covers/${bandId}/${albumSlug}/cover.jpg`
              await uploadToR2(coverKey, coverData, getContentType(album.coverPath))
            }
          }

          const currentYear = new Date().getFullYear()
          const labelName = album.labelName || artist.name
          const pLine = `℗ ${currentYear} ${labelName}`
          const cLine = `© ${currentYear} ${labelName}`

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
              is_published: true,
              rights_confirmed: true,
            })
            .select('id')
            .single()

          if (albumError || !albumRecord) {
            results.errors.push(`Failed to create album "${album.title}": ${albumError?.message}`)
            continue
          }

          results.albumsCreated++
          results.createdAlbums.push({
            id: albumRecord.id,
            title: album.title,
            artistName: artist.name,
            coverKey,
            artistSlug,
            albumSlug,
          })

          // Process tracks
          for (const track of album.tracks) {
            try {
              if (!isLosslessAudio(track.audioPath)) {
                results.errors.push(`Track "${track.title}": Only lossless formats (WAV, FLAC, AIFF) are accepted`)
                continue
              }

              const audioData = await getZipFile(track.audioPath)
              if (!audioData) {
                results.errors.push(`Audio file not found: ${track.audioPath}`)
                continue
              }

              if (audioData.length > MAX_AUDIO_FILE_SIZE) {
                results.errors.push(`Track "${track.title}": File exceeds 300MB limit`)
                continue
              }

              const audioExt = track.audioPath.split('.').pop()?.toLowerCase() || 'flac'
              const audioKey = `tracks/${bandId}/${albumRecord.id}/${track.trackNumber.toString().padStart(2, '0')}-${track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${audioExt}`
              await uploadToR2(audioKey, audioData, getContentType(track.audioPath))

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
                  duration_seconds: track.durationSeconds || 0,
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

              if (track.credits?.length > 0) {
                const creditsToInsert = track.credits.map((credit) => ({
                  track_id: trackRecord.id,
                  role: credit.role,
                  name: credit.name,
                }))
                await client.from('track_credits').insert(creditsToInsert)
              }

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

  // Clean up: delete the temporary ZIP from R2
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: config.r2BucketName,
      Key: zipKey,
    })
    await r2Client.send(deleteCommand)
  } catch (e) {
    console.warn('Failed to delete temporary ZIP from R2:', e)
  }

  results.success = results.errors.length === 0
  return results
})
