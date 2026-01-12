// Check if album is saved to user's library
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    return { isSaved: false }
  }

  const query = getQuery(event)
  const albumId = query.albumId as string

  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'albumId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('is_album_saved', {
    p_album_id: albumId,
  })

  if (error) {
    console.error('Failed to check album status:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to check album status',
    })
  }

  return { isSaved: data }
})
