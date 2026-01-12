// Save an album to user's library
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to save albums',
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

  const { data, error } = await client.rpc('save_album', {
    p_album_id: albumId,
  })

  if (error) {
    console.error('Failed to save album:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save album',
    })
  }

  return { success: data }
})
