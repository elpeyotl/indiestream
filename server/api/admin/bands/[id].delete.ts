// DELETE /api/admin/bands/[id] - Delete band and all associated data
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

  const bandId = getRouterParam(event, 'id')
  if (!bandId) {
    throw createError({ statusCode: 400, statusMessage: 'Band ID required' })
  }

  // Get band details before deletion for response
  const { data: band } = await client
    .from('bands')
    .select('id, name, slug')
    .eq('id', bandId)
    .single()

  if (!band) {
    throw createError({ statusCode: 404, statusMessage: 'Band not found' })
  }

  // Delete band (cascades to albums, tracks, etc. via ON DELETE CASCADE)
  const { error } = await client
    .from('bands')
    .delete()
    .eq('id', bandId)

  if (error) {
    console.error('Failed to delete band:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    success: true,
    message: `Band "${band.name}" and all associated data deleted successfully`,
    deletedBand: {
      id: band.id,
      name: band.name,
      slug: band.slug,
    },
  }
})
