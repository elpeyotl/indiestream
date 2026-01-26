// PATCH /api/admin/zine/reorder - Reorder zine albums within a category
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
  const { category, orderedIds } = body

  if (!category || !Array.isArray(orderedIds)) {
    throw createError({ statusCode: 400, message: 'category and orderedIds array are required' })
  }

  // Update positions for each album
  const updates = orderedIds.map((id: string, index: number) =>
    client
      .from('zine_albums')
      .update({ position: index })
      .eq('id', id)
      .eq('category', category)
  )

  await Promise.all(updates)

  return { success: true }
})
