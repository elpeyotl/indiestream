// POST /api/bulk-upload/presign-zip - Get presigned URL for uploading bulk ZIP to R2
import { serverSupabaseUser } from '#supabase/server'
import { getUploadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { filename, fileSize } = body as { filename: string; fileSize: number }

  if (!filename || !fileSize) {
    throw createError({ statusCode: 400, statusMessage: 'Missing filename or fileSize' })
  }

  // Validate file size (2GB max for bulk uploads)
  const MAX_ZIP_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
  if (fileSize > MAX_ZIP_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ZIP file is too large. Maximum size is 2GB.',
    })
  }

  // Generate unique key for the bulk upload ZIP
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `bulk-uploads/${user.id}/${timestamp}-${sanitizedFilename}`

  // Get presigned URL for upload (expires in 2 hours for large files)
  const uploadUrl = await getUploadUrl(key, 'application/zip', 7200)

  return {
    uploadUrl,
    key,
  }
})
