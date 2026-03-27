// POST /api/admin/genres/merge - Merge one genre into another
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
  const { sourceGenreId, targetGenreId } = body

  if (!sourceGenreId || !targetGenreId) {
    throw createError({ statusCode: 400, statusMessage: 'sourceGenreId and targetGenreId are required' })
  }

  if (sourceGenreId === targetGenreId) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot merge a genre into itself' })
  }

  // Get all bands with the source genre
  const { data: sourceBandGenres } = await client
    .from('band_genres')
    .select('band_id')
    .eq('genre_id', sourceGenreId)

  // For each band, add the target genre (if not already present)
  for (const bg of sourceBandGenres || []) {
    await client
      .from('band_genres')
      .upsert({ band_id: bg.band_id, genre_id: targetGenreId })
  }

  // Remove all source genre relationships
  await client
    .from('band_genres')
    .delete()
    .eq('genre_id', sourceGenreId)

  // Deactivate the source genre
  await client
    .from('genres')
    .update({ is_active: false })
    .eq('id', sourceGenreId)

  return { success: true, mergedCount: sourceBandGenres?.length || 0 }
})
