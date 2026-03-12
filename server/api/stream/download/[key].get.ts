// Server-side proxy for downloading R2 files as blobs (for offline caching)
// Unlike the regular stream endpoint which returns a presigned URL,
// this endpoint proxies the actual file content to avoid CORS issues.
import { serverSupabaseUser } from '#supabase/server'
import { getR2Client } from '~/server/utils/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  const encodedKey = getRouterParam(event, 'key')
  if (!encodedKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file key' })
  }

  const key = Buffer.from(encodedKey, 'base64url').toString('utf-8')

  // Require authentication for audio downloads
  if (!key.startsWith('covers/') && !key.startsWith('avatars/')) {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  try {
    const config = useRuntimeConfig()
    const client = getR2Client()

    const command = new GetObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
    })

    const response = await client.send(command)

    if (!response.Body) {
      throw createError({ statusCode: 404, statusMessage: 'File not found' })
    }

    // Set appropriate content type
    const contentType = response.ContentType || 'application/octet-stream'
    setResponseHeader(event, 'Content-Type', contentType)

    if (response.ContentLength) {
      setResponseHeader(event, 'Content-Length', response.ContentLength)
    }

    // Cache for 1 hour on the client
    setResponseHeader(event, 'Cache-Control', 'private, max-age=3600')

    // Stream the body directly
    return response.Body.transformToWebStream()
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Failed to proxy R2 download:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to download file' })
  }
})
