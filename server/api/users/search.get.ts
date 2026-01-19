// GET /api/users/search - Search for users by display name or email
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to search for users',
    })
  }

  const query = getQuery(event)
  const searchQuery = (query.q as string || '').trim().toLowerCase()

  if (!searchQuery || searchQuery.length < 2) {
    return []
  }

  const client = await serverSupabaseClient(event)

  // Search by display_name or email (case-insensitive)
  const { data: users, error } = await client
    .from('profiles')
    .select('id, display_name, avatar_url, email')
    .or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    .neq('id', user.id) // Exclude current user
    .limit(10)

  if (error) {
    console.error('Failed to search users:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to search users',
    })
  }

  // Return users with masked email for privacy
  return (users || []).map(u => ({
    id: u.id,
    display_name: u.display_name || 'User',
    avatar_url: u.avatar_url,
    // Only show partial email for identification
    email_hint: u.email ? `${u.email.substring(0, 3)}...@${u.email.split('@')[1]}` : null,
  }))
})
