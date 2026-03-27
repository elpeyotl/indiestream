// PATCH /api/admin/genre-suggestions/[id] - Approve, reject, or merge a suggestion
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
  const { action, mergeIntoGenreId, adminNotes } = body

  if (!action || !['approve', 'reject', 'merge'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'action must be approve, reject, or merge' })
  }

  // Fetch the suggestion
  const { data: suggestion, error: fetchError } = await client
    .from('genre_suggestions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !suggestion) {
    throw createError({ statusCode: 404, statusMessage: 'Suggestion not found' })
  }

  if (suggestion.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Suggestion has already been reviewed' })
  }

  if (action === 'approve') {
    // Create the genre
    const slug = suggestion.suggested_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Get max position
    const { data: maxPos } = await client
      .from('genres')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = (maxPos?.position ?? 0) + 1

    const { data: newGenre, error: insertError } = await client
      .from('genres')
      .insert({
        name: suggestion.suggested_name,
        slug,
        position: newPosition,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create genre:', insertError)
      throw createError({ statusCode: 500, message: 'Failed to create genre' })
    }

    // If the suggestion was tied to a band, auto-add the genre to that band
    if (suggestion.band_id && newGenre) {
      await client
        .from('band_genres')
        .insert({ band_id: suggestion.band_id, genre_id: newGenre.id })

    }

    // Update suggestion status
    await client
      .from('genre_suggestions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', id)

    return { success: true, genre: newGenre }
  }

  if (action === 'merge') {
    if (!mergeIntoGenreId) {
      throw createError({ statusCode: 400, statusMessage: 'mergeIntoGenreId required for merge action' })
    }

    // If the suggestion was tied to a band, add the target genre to that band
    if (suggestion.band_id) {
      await client
        .from('band_genres')
        .upsert({ band_id: suggestion.band_id, genre_id: mergeIntoGenreId })
    }

    // Update suggestion status
    await client
      .from('genre_suggestions')
      .update({
        status: 'merged',
        merged_into_genre_id: mergeIntoGenreId,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq('id', id)

    return { success: true }
  }

  // Reject
  await client
    .from('genre_suggestions')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq('id', id)

  return { success: true }
})
