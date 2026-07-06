// API endpoint to get streaming URLs for files (audio, covers, avatars)
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getDownloadUrl } from '~/server/utils/r2'
import { isOpenKey, authorizeRestrictedKey } from '~/server/utils/audioAccess'
import { enforceRateLimit } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  // Generous: this endpoint also signs URLs for covers/avatars, so a single
  // page render can trigger dozens of requests. Fixed bucket name because the
  // route path contains the file key.
  enforceRateLimit(event, {
    name: '/api/stream',
    max: 300,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please slow down.',
  })
  // Get the key from the URL (it's base64 encoded to handle slashes)
  const encodedKey = getRouterParam(event, 'key')
  if (!encodedKey) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing file key',
    })
  }

  const key = Buffer.from(encodedKey, 'base64url').toString('utf-8')

  // Public artwork + standard-quality streams may be signed for anyone.
  // Restricted keys (hifi masters, originals, per-user uploads) require an
  // entitled, authenticated caller.
  if (!isOpenKey(key)) {
    const user = await serverSupabaseUser(event).catch(() => null)
    const authClient = await serverSupabaseServiceRole(event)
    await authorizeRestrictedKey(key, user, authClient)
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
