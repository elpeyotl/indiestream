// Admin Delete User API - Delete a user and all their data
import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { deleteUserData } from '~/server/utils/deleteUserAccount'

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

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID required' })
  }

  // Prevent self-deletion
  if (userId === user.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  // Get service role client for admin operations
  const serviceClient = serverSupabaseServiceRole(event)

  try {
    await deleteUserData(serviceClient, userId)

    return { success: true, message: 'User deleted successfully' }
  } catch (e: any) {
    console.error('Delete user failed:', e)
    throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to delete user' })
  }
})
