// Get user's saved albums
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to view your library',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('saved_albums')
    .select(`
      created_at,
      album:albums (
        id,
        title,
        slug,
        cover_url,
        cover_key,
        release_type,
        release_date,
        band:bands (
          id,
          name,
          slug
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch saved albums:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch saved albums',
    })
  }

  return data || []
})
