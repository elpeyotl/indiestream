// GET /api/admin/settings - Get all platform settings
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

  const { data: settings, error } = await client
    .from('platform_settings')
    .select('*')

  if (error) {
    console.error('Failed to fetch settings:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Convert to key-value object
  const settingsMap: Record<string, any> = {}
  for (const setting of settings || []) {
    settingsMap[setting.key] = {
      value: setting.value,
      description: setting.description,
      updated_at: setting.updated_at,
    }
  }

  return settingsMap
})
