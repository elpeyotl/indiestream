import { serverSupabaseUser } from '#supabase/server'
import { getUploadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  const { fileName, contentType } = await readBody(event)

  // Validate content type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(contentType)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid image type. Allowed: JPEG, PNG, WebP, GIF'
    })
  }

  // Generate unique key for user avatar
  const ext = fileName.split('.').pop()
  const avatarKey = `avatars/${user.id}-${Date.now()}.${ext}`

  // Get presigned upload URL using existing utility
  const uploadUrl = await getUploadUrl(avatarKey, contentType, 3600)

  return {
    uploadUrl,
    avatarKey,
    expiresIn: 3600
  }
})
