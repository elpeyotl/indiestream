// PATCH /api/admin/featured-albums/reorder - Reorder featured albums
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

  const body = await readBody(event)
  const { orderedIds } = body

  if (!orderedIds || !Array.isArray(orderedIds)) {
    throw createError({ statusCode: 400, statusMessage: 'orderedIds array is required' })
  }

  // Update positions in batch
  const updates = orderedIds.map((id: string, index: number) =>
    client
      .from('featured_albums')
      .update({ position: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  // Check for any errors
  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    console.error('Failed to reorder featured albums:', errors)
    throw createError({ statusCode: 500, message: 'Failed to reorder featured albums' })
  }

  return { success: true }
})
