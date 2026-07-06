// API endpoint to record a stream
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { enforceRateLimit } from '~/server/utils/rateLimit'

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
  // Generous: legitimate playback records at most a few streams per minute,
  // even with heavy skipping.
  enforceRateLimit(event, {
    max: 60,
    windowMs: 60 * 1000,
    message: 'Too many stream events. Please slow down.',
  })

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

  // Determine free-play status SERVER-SIDE — never trust a client flag, or a
  // free user could mark their plays as paid streams and inflate payouts.
  // Subscribers (active/trialing) and the band's own owner stream unlimited and
  // are not free plays; everyone else's plays are free plays, which never count
  // toward artist stats or payouts. The record_stream function consumes the
  // free-play allowance atomically and applies replay/duration protection.
  let hasSubscription = false
  {
    const { data: sub } = await client
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()
    hasSubscription = !!sub
  }
  const shouldCountAsFreePlay = !isOwnMusic && !hasSubscription

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
