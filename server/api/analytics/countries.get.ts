// API endpoint to get stream counts by country for a band
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const query = getQuery(event)
  const bandId = query.bandId as string
  const days = parseInt(query.days as string) || 30

  if (!bandId) {
    throw createError({
      statusCode: 400,
      message: 'bandId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Call the get_band_streams_by_country function
  const { data, error } = await client.rpc('get_band_streams_by_country', {
    p_band_id: bandId,
    p_days: days,
  })

  if (error) {
    console.error('Failed to fetch country analytics:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch country analytics',
    })
  }

  return data || []
})
