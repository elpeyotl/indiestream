// PATCH /api/admin/genres/[id] - Update a genre
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

  const body = await readBody(event)
  const updateData: Record<string, any> = {}

  if (body.name !== undefined) {
    updateData.name = body.name.trim()
    updateData.slug = body.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  if (body.is_featured !== undefined) {
    updateData.is_featured = body.is_featured
  }

  if (body.featured_position !== undefined) {
    updateData.featured_position = body.featured_position
  }

  if (body.is_active !== undefined) {
    updateData.is_active = body.is_active
  }

  if (body.position !== undefined) {
    updateData.position = body.position
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  const { data, error } = await client
    .from('genres')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 400, statusMessage: 'A genre with that name already exists' })
    }
    console.error('Failed to update genre:', error)
    throw createError({ statusCode: 500, message: 'Failed to update genre' })
  }

  return { success: true, genre: data }
})
