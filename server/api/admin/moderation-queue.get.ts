// GET /api/admin/moderation-queue - List tracks in moderation queue
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

  // Query parameters
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const search = query.search as string
  const status = query.status as string
  const priority = query.priority as string
  const offset = (page - 1) * limit

  // Build query with joins
  let queueQuery = client
    .from('moderation_queue')
    .select(`
      id,
      track_id,
      band_id,
      submitted_by,
      priority,
      status,
      notes,
      reviewed_by,
      reviewed_at,
      created_at,
      track:tracks!track_id (
        id,
        title,
        track_number,
        duration_seconds,
        is_explicit,
        isrc,
        iswc,
        is_cover,
        moderation_status,
        moderation_notes,
        moderated_at,
        moderated_by,
        audio_key,
        album:albums!album_id (
          id,
          title,
          slug,
          cover_key
        )
      ),
      band:bands!band_id (
        id,
        name,
        slug,
        avatar_key,
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
    `, { count: 'exact' })

  // Filter by status
  if (status && status !== 'all') {
    queueQuery = queueQuery.eq('status', status)
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    queueQuery = queueQuery.eq('priority', priority)
  }

  // Sort by priority (urgent first) then created_at (oldest first)
  // Note: Supabase doesn't support custom sort orders, so we'll sort urgent/high/normal manually
  queueQuery = queueQuery.order('created_at', { ascending: true })

  // Apply pagination
  queueQuery = queueQuery.range(offset, offset + limit - 1)

  const { data: queueItems, error, count } = await queueQuery

  if (error) {
    console.error('Failed to load moderation queue:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Client-side search filter (for simplicity)
  let filteredItems = queueItems || []
  if (search) {
    const searchLower = search.toLowerCase()
    filteredItems = filteredItems.filter(item =>
      (item.track as any)?.title?.toLowerCase().includes(searchLower) ||
      (item.band as any)?.name?.toLowerCase().includes(searchLower)
    )
  }

  // Client-side priority sort (urgent > high > normal)
  const priorityOrder = { urgent: 0, high: 1, normal: 2 }
  filteredItems.sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2
    if (aPriority !== bPriority) return aPriority - bPriority
    // If same priority, sort by created_at (oldest first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return {
    items: filteredItems,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
