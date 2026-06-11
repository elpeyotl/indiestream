// Server-side proxy for downloading R2 files as blobs (for offline caching)
// Unlike the regular stream endpoint which returns a presigned URL,
// this endpoint proxies the actual file content to avoid CORS issues.
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getR2Client } from '~/server/utils/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { isOpenKey, authorizeRestrictedKey } from '~/server/utils/audioAccess'

export default defineEventHandler(async (event) => {
  const encodedKey = getRouterParam(event, 'key')
  if (!encodedKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file key' })
  }

  const key = Buffer.from(encodedKey, 'base64url').toString('utf-8')

  // Public artwork + standard-quality streams may be proxied for anyone.
  // Restricted keys (hifi masters, originals, per-user uploads) require an
  // entitled, authenticated caller.
  if (!isOpenKey(key)) {
    const user = await serverSupabaseUser(event).catch(() => null)
    const authClient = await serverSupabaseServiceRole(event)
    await authorizeRestrictedKey(key, user, authClient)
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
