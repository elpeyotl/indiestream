// DELETE /api/admin/featured-albums/[id] - Remove a featured album
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Verify admin access
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID required' })
  }

  // Delete the featured album
  const { error } = await client
    .from('featured_albums')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete featured album:', error)
    throw createError({ statusCode: 500, message: 'Failed to delete featured album' })
  }

  return { success: true }
})
