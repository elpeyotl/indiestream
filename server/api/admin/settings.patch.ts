// PATCH /api/admin/settings - Update platform settings
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
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
  const { key, value } = body

  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Setting key is required' })
  }

  const { error } = await client
    .from('platform_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })

  if (error) {
    console.error('Failed to update setting:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, key, value }
})
