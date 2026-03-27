// GET /api/genres/list - Get master genre list for picker UI
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { data: genres, error } = await client
    .from('genres')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to fetch genre list:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch genre list' })
  }

  return { genres: genres || [] }
})
