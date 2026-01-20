// POST /api/transcoding/presign - Get presigned URLs for transcoding worker
// Returns download URL for original + upload URL for transcoded file
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

  // Generate upload URL for transcoded file
  // Store in same structure but with .m4a extension
  const streamingKey = `streaming/${bandId}/${albumId}/${trackId}.m4a`
  const uploadUrl = await getUploadUrl(streamingKey, 'audio/mp4', 7200)

  return {
    downloadUrl,
    uploadUrl,
    streamingKey,
  }
})
