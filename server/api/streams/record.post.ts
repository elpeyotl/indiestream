// API endpoint to record a stream
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

// Get country code from request headers
// Cloudflare: CF-IPCountry
// Vercel: X-Vercel-IP-Country
function getCountryCode(event: any): string | null {
  const headers = getHeaders(event)

  // Try Cloudflare header first (if using CF in front of Vercel)
  const cfCountry = headers['cf-ipcountry']
  if (cfCountry && cfCountry !== 'XX') {
    return cfCountry.toUpperCase()
  }

  // Try Vercel header
  const vercelCountry = headers['x-vercel-ip-country']
  if (vercelCountry) {
    return vercelCountry.toUpperCase()
  }

  // In development, use a default country for testing
  if (process.dev) {
    return 'DE' // Default to Germany for dev testing
  }

  return null
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const body = await readBody(event)
  const { trackId, durationSeconds, isFreePlay } = body

  if (!trackId || typeof durationSeconds !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'trackId and durationSeconds are required',
    })
  }

  // Get country from request headers
  const countryCode = getCountryCode(event)

  const client = await serverSupabaseClient(event)

  // Get track's band_id to check ownership
  const { data: track } = await client
    .from('tracks')
    .select('band_id')
    .eq('id', trackId)
    .single()

  // Check if user owns the band (artists can listen to their own music unlimited)
  let isOwnMusic = false
  if (track?.band_id) {
    const { data: ownsBand } = await client
      .from('bands')
      .select('id')
      .eq('id', track.band_id)
      .eq('owner_id', user.id)
      .single()

    isOwnMusic = !!ownsBand
  }

  // Note: Free play consumption happens in the record_stream database function
  // to ensure atomicity and avoid double-counting
  // If user owns the band, this is NOT a free play (they can listen unlimited)
  const shouldCountAsFreePlay = !isOwnMusic && (isFreePlay || false)

  // Call the record_stream function with country and free play flag
  const { data, error } = await client.rpc('record_stream', {
    p_track_id: trackId,
    p_duration_seconds: Math.floor(durationSeconds),
    p_country_code: countryCode,
    p_is_free_play: shouldCountAsFreePlay,
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
