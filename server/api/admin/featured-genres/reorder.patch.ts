// PATCH /api/admin/featured-genres/reorder - Reorder featured genres
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

  const body = await readBody(event)
  const { orderedIds } = body

  if (!orderedIds || !Array.isArray(orderedIds)) {
    throw createError({ statusCode: 400, statusMessage: 'orderedIds array is required' })
  }

  // Update featured_position in the genres table
  const updates = orderedIds.map((id: string, index: number) =>
    client
      .from('genres')
      .update({ featured_position: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)

  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    console.error('Failed to reorder featured genres:', errors)
    throw createError({ statusCode: 500, message: 'Failed to reorder featured genres' })
  }

  return { success: true }
})
