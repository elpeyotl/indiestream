// Admin Delete User API - Delete a user and all their data
import { serverSupabaseClient, serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

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
    // Delete user's bands (cascades to albums, tracks, listening_history via FK)
    const { error: bandsError } = await serviceClient
      .from('bands')
      .delete()
      .eq('owner_id', userId)

    if (bandsError) {
      console.error('Failed to delete bands:', bandsError)
    }

    // Delete user's listening history
    const { error: historyError } = await serviceClient
      .from('listening_history')
      .delete()
      .eq('user_id', userId)

    if (historyError) {
      console.error('Failed to delete listening history:', historyError)
    }

    // Delete user's library (saved albums, liked tracks)
    await serviceClient.from('saved_albums').delete().eq('user_id', userId)
    await serviceClient.from('liked_tracks').delete().eq('user_id', userId)

    // Delete user's follows
    await serviceClient.from('follows').delete().eq('user_id', userId)

    // Delete profile (should cascade from auth.users, but do it explicitly)
    const { error: profileDeleteError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDeleteError) {
      console.error('Failed to delete profile:', profileDeleteError)
    }

    // Delete the auth user using admin API
    const { error: authError } = await serviceClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Failed to delete auth user:', authError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to delete user authentication' })
    }

    return { success: true, message: 'User deleted successfully' }
  } catch (e: any) {
    console.error('Delete user failed:', e)
    throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to delete user' })
  }
})
