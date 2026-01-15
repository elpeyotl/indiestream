// GET /api/admin/moderation-queue/[id] - Get track details for moderation
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

  const queueId = getRouterParam(event, 'id')
  if (!queueId) {
    throw createError({ statusCode: 400, statusMessage: 'Queue ID required' })
  }

  // Get full queue item with track details including credits
  // Use explicit foreign key references to avoid ambiguity
  const { data: queueItem, error } = await client
    .from('moderation_queue')
    .select(`
      *,
      track:tracks!track_id (
        *,
        album:albums!album_id (
          id,
          title,
          slug,
          release_type,
          cover_key,
          release_date
        ),
        credits:track_credits (
          id,
          role,
          name,
          ipi_number
        )
      ),
      band:bands!band_id (
        id,
        name,
        slug,
        avatar_key,
        bio,
        location,
        genres,
        owner:profiles!owner_id (
          id,
          email,
          display_name
        )
      ),
      submitter:profiles!submitted_by (
        id,
        email,
        display_name
      )
    `)
    .eq('id', queueId)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch queue item:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (!queueItem) {
    throw createError({ statusCode: 404, statusMessage: 'Queue item not found' })
  }

  return queueItem
})
