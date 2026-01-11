// API endpoint to record a stream
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const body = await readBody(event)
  const { trackId, durationSeconds } = body

  if (!trackId || typeof durationSeconds !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'trackId and durationSeconds are required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Call the record_stream function
  const { data, error } = await client.rpc('record_stream', {
    p_track_id: trackId,
    p_duration_seconds: Math.floor(durationSeconds),
  })

  if (error) {
    console.error('Failed to record stream:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to record stream',
    })
  }

  return { success: data }
})
