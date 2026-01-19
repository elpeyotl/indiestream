// PATCH /api/admin/playlists/[id] - Update playlist (feature/unfeature, etc.)
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

  const playlistId = getRouterParam(event, 'id')
  if (!playlistId) {
    throw createError({ statusCode: 400, statusMessage: 'Playlist ID required' })
  }

  const body = await readBody(event)
  const updates: Record<string, any> = {}

  // Handle feature/unfeature
  if (body.is_featured !== undefined) {
    updates.is_featured = body.is_featured
    if (body.is_featured) {
      updates.featured_at = new Date().toISOString()
      updates.featured_by = user.id
      // Auto-make public when featuring
      updates.is_public = true
    } else {
      updates.featured_at = null
      updates.featured_by = null
    }
  }

  // Handle curated flag
  if (body.is_curated !== undefined) {
    updates.is_curated = body.is_curated
  }

  // Handle public flag
  if (body.is_public !== undefined) {
    updates.is_public = body.is_public
  }

  // Handle title/description updates
  if (body.title !== undefined) {
    updates.title = body.title
  }
  if (body.description !== undefined) {
    updates.description = body.description
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No updates provided' })
  }

  updates.updated_at = new Date().toISOString()

  // Update playlist and get basic fields (owner join doesn't work directly)
  const { data: playlist, error } = await client
    .from('playlists')
    .update(updates)
    .eq('id', playlistId)
    .select(`
      id,
      title,
      description,
      is_public,
      is_featured,
      is_curated,
      featured_at,
      track_count,
      cover_key,
      created_at,
      owner_id
    `)
    .single()

  if (error) {
    console.error('Failed to update playlist:', error)
    throw createError({ statusCode: 500, message: 'Failed to update playlist' })
  }

  // Get owner info separately
  let owner = null
  if (playlist?.owner_id) {
    const { data: ownerData } = await client
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', playlist.owner_id)
      .single()
    owner = ownerData
  }

  return { success: true, playlist: { ...playlist, owner } }
})
