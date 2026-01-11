// API endpoint to get streaming URLs for files (audio, covers, avatars)
import { serverSupabaseUser } from '#supabase/server'
import { getDownloadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  // Get the key from the URL (it's base64 encoded to handle slashes)
  const encodedKey = getRouterParam(event, 'key')
  if (!encodedKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing file key',
    })
  }

  const key = Buffer.from(encodedKey, 'base64url').toString('utf-8')

  // Check what type of content is being requested
  const isPublicContent = key.startsWith('covers/') || key.startsWith('avatars/')

  // For non-public content (audio), optionally check authentication
  // For now, allow all streaming but this can be restricted later
  if (!isPublicContent) {
    try {
      const user = await serverSupabaseUser(event)
      // Future: implement subscription checks for audio streaming
    } catch {
      // Allow unauthenticated access for now
    }
  }

  try {
    const streamUrl = await getDownloadUrl(key, 3600) // 1 hour expiry

    return {
      url: streamUrl,
      expiresIn: 3600,
    }
  } catch (error: any) {
    console.error('Failed to generate stream URL:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate stream URL',
    })
  }
})
