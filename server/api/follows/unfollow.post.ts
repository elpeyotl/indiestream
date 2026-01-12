// API endpoint to unfollow a band
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to unfollow artists',
    })
  }

  const body = await readBody(event)
  const bandId = body.bandId as string

  if (!bandId) {
    throw createError({
      statusCode: 400,
      message: 'bandId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('unfollow_band', {
    p_band_id: bandId,
  })

  if (error) {
    console.error('Failed to unfollow band:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to unfollow artist',
    })
  }

  return { success: data }
})
