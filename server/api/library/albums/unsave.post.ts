// Remove an album from user's library
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to unsave albums',
    })
  }

  const body = await readBody(event)
  const albumId = body.albumId as string

  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'albumId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('unsave_album', {
    p_album_id: albumId,
  })

  if (error) {
    console.error('Failed to unsave album:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to remove album from library',
    })
  }

  return { success: data }
})
