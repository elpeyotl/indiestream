// GET /api/admin/genre-suggestions - List genre suggestions
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

  const query = getQuery(event)
  const status = (query.status as string) || 'pending'

  const { data: suggestions, error } = await client
    .from('genre_suggestions')
    .select('*, suggested_by_profile:profiles!genre_suggestions_suggested_by_fkey(display_name, email)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch genre suggestions:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch genre suggestions' })
  }

  return { suggestions: suggestions || [] }
})
