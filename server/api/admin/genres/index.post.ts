// POST /api/admin/genres - Add a new genre to master list
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
  const { name } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Genre name is required' })
  }

  const trimmedName = name.trim()
  const slug = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // Get max position
  const { data: maxPos } = await client
    .from('genres')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPos?.position ?? 0) + 1

  const { data, error } = await client
    .from('genres')
    .insert({
      name: trimmedName,
      slug,
      position: newPosition,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 400, statusMessage: 'Genre already exists' })
    }
    console.error('Failed to create genre:', error)
    throw createError({ statusCode: 500, message: 'Failed to create genre' })
  }

  return { success: true, genre: data }
})
