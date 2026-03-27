// DELETE /api/admin/genres/[id] - Deactivate a genre (soft delete)
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole(event)

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

  // Soft delete: set is_active to false
  const { error } = await client
    .from('genres')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Failed to deactivate genre:', error)
    throw createError({ statusCode: 500, message: 'Failed to deactivate genre' })
  }

  return { success: true }
})
