// API endpoint to generate presigned URLs for file uploads
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getUploadUrl, generateAudioKey, generateCoverKey, generateAvatarKey, generateBannerKey } from '~/server/utils/r2'

interface PresignRequest {
  type: 'audio' | 'cover' | 'avatar' | 'banner'
  bandId: string
  albumId?: string
  trackId?: string
  filename: string
  contentType: string
  fileSize?: number
}

// 300MB max for audio files (supports ~12 min hi-res FLAC)
const MAX_AUDIO_FILE_SIZE = 300 * 1024 * 1024

export default defineEventHandler(async (event) => {
  // Verify user is authenticated
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const body = await readBody<PresignRequest>(event)

  // Validate required fields
  if (!body.type || !body.bandId || !body.filename || !body.contentType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // albumId is required for audio and cover uploads
  if ((body.type === 'audio' || body.type === 'cover') && !body.albumId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'albumId is required for audio and cover uploads',
    })
  }

  // The presigned key is derived from bandId/albumId/trackId, so the caller
  // must own the target band (otherwise they could overwrite another artist's
  // files). albumId, when supplied, must also belong to that band.
  const supabase = await serverSupabaseServiceRole(event)
  const { data: band } = await supabase
    .from('bands')
    .select('id')
    .eq('id', body.bandId)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!band) {
    throw createError({ statusCode: 403, statusMessage: 'You do not own this band' })
  }
  if (body.albumId) {
    const { data: album } = await supabase
      .from('albums')
      .select('id')
      .eq('id', body.albumId)
      .eq('band_id', body.bandId)
      .maybeSingle()
    if (!album) {
      throw createError({ statusCode: 403, statusMessage: 'Album does not belong to this band' })
    }
  }

  // Validate content types - lossless formats only for audio
  const allowedAudioTypes = ['audio/wav', 'audio/flac', 'audio/aiff', 'audio/x-aiff']
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (body.type === 'audio') {
    if (!allowedAudioTypes.includes(body.contentType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid audio file type. Lossless formats required: WAV, FLAC, or AIFF',
      })
    }

    if (body.fileSize && body.fileSize > MAX_AUDIO_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Audio file too large. Maximum size is 300MB.',
      })
    }
  }

  if ((body.type === 'cover' || body.type === 'avatar' || body.type === 'banner') && !allowedImageTypes.includes(body.contentType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid image file type. Allowed: JPEG, PNG, WebP',
    })
  }

  // Generate the storage key
  let key: string
  if (body.type === 'audio') {
    if (!body.trackId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'trackId is required for audio uploads',
      })
    }
    key = generateAudioKey(body.bandId, body.albumId!, body.trackId, body.filename)
  } else if (body.type === 'cover') {
    key = generateCoverKey(body.bandId, body.albumId!, body.filename)
  } else if (body.type === 'banner') {
    key = generateBannerKey(body.bandId, body.filename)
  } else {
    // avatar
    key = generateAvatarKey(body.bandId, body.filename)
  }

  try {
    const uploadUrl = await getUploadUrl(key, body.contentType)

    return {
      uploadUrl,
      key,
    }
  } catch (error: any) {
    console.error('Failed to generate presigned URL:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate upload URL',
    })
  }
})
