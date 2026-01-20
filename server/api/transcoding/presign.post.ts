// POST /api/transcoding/presign - Get presigned URLs for transcoding worker
// Returns download URL for original + upload URLs for transcoded files (AAC + FLAC)
import { serverSupabaseServiceRole } from '#supabase/server'
import { getDownloadUrl, getUploadUrl } from '~/server/utils/r2'

interface PresignRequest {
  trackId: string
  originalAudioKey: string
  bandId: string
  albumId: string
}

export default defineEventHandler(async (event) => {
  // Verify this is an authorized request
  const authHeader = getHeader(event, 'x-transcoding-secret')
  const config = useRuntimeConfig()

  if (authHeader !== config.transcodingSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<PresignRequest>(event)
  const { trackId, originalAudioKey, bandId, albumId } = body

  if (!trackId || !originalAudioKey || !bandId || !albumId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  // Generate download URL for original file (2 hour expiry for large files)
  const downloadUrl = await getDownloadUrl(originalAudioKey, 7200)

  // Generate upload URLs for dual-format transcoding:
  // 1. AAC 256kbps for standard streaming (streaming/ bucket)
  // 2. FLAC 16-bit/44.1kHz for hi-fi streaming (hifi/ bucket)
  const streamingKey = `streaming/${bandId}/${albumId}/${trackId}.m4a`
  const hifiKey = `hifi/${bandId}/${albumId}/${trackId}.flac`
  const archiveKey = `archive/${bandId}/${albumId}/${trackId}${getExtension(originalAudioKey)}`

  const [streamingUploadUrl, hifiUploadUrl, archiveUploadUrl] = await Promise.all([
    getUploadUrl(streamingKey, 'audio/mp4', 7200),
    getUploadUrl(hifiKey, 'audio/flac', 7200),
    getUploadUrl(archiveKey, getContentType(originalAudioKey), 7200),
  ])

  return {
    downloadUrl,
    // Standard streaming (AAC)
    streamingUploadUrl,
    streamingKey,
    // Hi-fi streaming (FLAC)
    hifiUploadUrl,
    hifiKey,
    // Archive (move original)
    archiveUploadUrl,
    archiveKey,
  }
})

function getExtension(key: string): string {
  const match = key.match(/\.[^.]+$/)
  return match ? match[0] : '.wav'
}

function getContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'wav': return 'audio/wav'
    case 'flac': return 'audio/flac'
    case 'aif':
    case 'aiff': return 'audio/aiff'
    default: return 'application/octet-stream'
  }
}
