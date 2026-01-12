// API endpoint to follow a band
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to follow artists',
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

  const { data, error } = await client.rpc('follow_band', {
    p_band_id: bandId,
  })

  if (error) {
    console.error('Failed to follow band:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to follow artist',
    })
  }

  return { success: data }
})
