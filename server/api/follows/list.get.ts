// API endpoint to get list of bands the user follows with full details
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to view followed artists',
    })
  }

  const client = await serverSupabaseClient(event)

  // Get follows with band details
  const { data, error } = await client
    .from('follows')
    .select(`
      created_at,
      band:bands (
        id,
        name,
        slug,
        avatar_url,
        avatar_key,
        location,
        genres,
        total_streams,
        follower_count
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch followed bands:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch followed artists',
    })
  }

  return data || []
})
