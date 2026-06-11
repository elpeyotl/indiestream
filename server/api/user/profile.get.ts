import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { getDownloadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Service role: reads the caller's own row including email (no longer exposed
  // to the authenticated role via the data API). Scoped to user.id.
  const client = await serverSupabaseServiceRole(event)

  const { data: profile, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw createError({
      statusCode: 404,
      message: 'Profile not found'
    })
  }

  // Generate presigned URL for avatar
  let avatarUrl = null
  if (profile.avatar_key) {
    try {
      avatarUrl = await getDownloadUrl(profile.avatar_key, 3600)
    } catch (e) {
      console.error('Failed to generate avatar URL:', e)
    }
  }

  // Map snake_case to camelCase for frontend
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    avatarKey: profile.avatar_key,
    avatarUrl,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    role: profile.role,
    createdAt: profile.created_at,
    showImpactPublicly: profile.show_impact_publicly || false
  }
})
