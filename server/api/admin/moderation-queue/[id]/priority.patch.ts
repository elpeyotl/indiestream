// PATCH /api/admin/moderation-queue/[id]/priority - Update priority
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

  const queueId = getRouterParam(event, 'id')
  if (!queueId) {
    throw createError({ statusCode: 400, statusMessage: 'Queue ID required' })
  }

  const body = await readBody(event)
  const priority = body.priority

  if (!['normal', 'high', 'urgent'].includes(priority)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid priority. Must be normal, high, or urgent' })
  }

  const { error } = await client
    .from('moderation_queue')
    .update({ priority })
    .eq('id', queueId)

  if (error) {
    console.error('Failed to update priority:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    success: true,
    message: 'Priority updated successfully',
  }
})
