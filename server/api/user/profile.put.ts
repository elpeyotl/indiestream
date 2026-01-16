import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  const body = await readBody(event)

  // Validate bio length
  if (body.bio && body.bio.length > 280) {
    throw createError({
      statusCode: 400,
      message: 'Bio must be 280 characters or less'
    })
  }

  // Validate website URL
  if (body.website && !body.website.match(/^https?:\/\//)) {
    throw createError({
      statusCode: 400,
      message: 'Website must be a valid HTTP or HTTPS URL'
    })
  }

  const client = await serverSupabaseClient(event)

  const updateData: Record<string, any> = {
    display_name: body.displayName,
    bio: body.bio,
    location: body.location,
    website: body.website,
    updated_at: new Date().toISOString()
  }

  // Only include show_impact_publicly if explicitly provided
  if (typeof body.showImpactPublicly === 'boolean') {
    updateData.show_impact_publicly = body.showImpactPublicly
  }

  const { data, error } = await client
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update profile'
    })
  }

  // Map snake_case to camelCase for frontend
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarKey: data.avatar_key,
    bio: data.bio,
    location: data.location,
    website: data.website,
    role: data.role,
    createdAt: data.created_at,
    showImpactPublicly: data.show_impact_publicly || false
  }
})
