// POST /api/genres/suggest - Submit a genre suggestion for admin review
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { name, bandId } = body

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Genre name is required' })
  }

  const trimmedName = name.trim()

  if (trimmedName.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Genre name must be under 50 characters' })
  }

  const client = serverSupabaseServiceRole(event)

  // Check if genre already exists in master list
  const slug = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const { data: existing } = await client
    .from('genres')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: `Genre "${existing.name}" already exists` })
  }

  // Check for duplicate pending suggestion
  const { data: pendingSuggestion } = await client
    .from('genre_suggestions')
    .select('id')
    .eq('suggested_name', trimmedName)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (pendingSuggestion) {
    throw createError({ statusCode: 400, statusMessage: 'This genre has already been suggested and is pending review' })
  }

  // If bandId provided, verify ownership
  if (bandId) {
    const { data: band } = await client
      .from('bands')
      .select('id')
      .eq('id', bandId)
      .eq('owner_id', user.id)
      .single()

    if (!band) {
      throw createError({ statusCode: 403, statusMessage: 'You do not own this artist profile' })
    }
  }

  // Create suggestion
  const { data, error } = await client
    .from('genre_suggestions')
    .insert({
      suggested_name: trimmedName,
      suggested_by: user.id,
      band_id: bandId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to submit genre suggestion:', error)
    throw createError({ statusCode: 500, message: 'Failed to submit genre suggestion' })
  }

  return { success: true, suggestion: data }
})
