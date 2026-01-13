// Admin Update User API - Update user role
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface UpdateUserRequest {
  role?: 'user' | 'band' | 'admin'
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  // Verify user is admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const userId = getRouterParam(event, 'id')
  const body = await readBody<UpdateUserRequest>(event)

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID required' })
  }

  // Validate role
  if (body.role && !['user', 'band', 'admin'].includes(body.role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role. Must be user, band, or admin' })
  }

  // Prevent removing own admin role
  if (userId === user.id && body.role && body.role !== 'admin') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot remove your own admin role' })
  }

  // Update user profile
  const { data, error } = await client
    .from('profiles')
    .update({
      role: body.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update user:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update user' })
  }

  return data
})
