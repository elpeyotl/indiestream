// Public endpoint for user's impact stats (respects privacy setting)
// Use service role client to bypass RLS since this is a public endpoint
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID required' })
  }

  const client = serverSupabaseServiceRole(event)

  // Check if user has opted in to public impact
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('show_impact_publicly')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.log('[impact-stats] Profile not found for user:', userId, profileError)
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  console.log('[impact-stats] User profile:', { userId, show_impact_publicly: profile.show_impact_publicly })

  if (!profile.show_impact_publicly) {
    // User has not opted in - return null (not an error)
    console.log('[impact-stats] User has not opted in to public impact')
    return { impactPublic: false, stats: null }
  }

  // Revenue model constants
  const SUBSCRIPTION_PRICE_CENTS = 999
  const ARTIST_SHARE = 0.70

  // Get user's subscription info
  const { data: subscription } = await client
    .from('subscriptions')
    .select('status, created_at')
    .eq('user_id', userId)
    .single()

  console.log('[impact-stats] Subscription:', subscription)
  const isSubscribed = subscription && ['active', 'trialing'].includes(subscription.status)

  if (!isSubscribed) {
    // User is not subscribed, no impact to show
    console.log('[impact-stats] User not subscribed')
    return { impactPublic: true, stats: null }
  }

  // Calculate all-time impact
  const now = new Date()
  const subStart = subscription.created_at ? new Date(subscription.created_at) : now
  const periodStartStr = subStart.toISOString().split('T')[0]
  const periodEndStr = now.toISOString()

  // Calculate months subscribed
  const monthsDiff = (now.getFullYear() - subStart.getFullYear()) * 12 +
                    (now.getMonth() - subStart.getMonth())
  const monthsSubscribed = Math.max(1, monthsDiff + 1)

  // Calculate total amounts
  const totalPaidCents = SUBSCRIPTION_PRICE_CENTS * monthsSubscribed
  const artistPoolCents = Math.floor(totalPaidCents * ARTIST_SHARE)

  // Get listening data for all time (with band owner info to filter out own bands)
  const { data: listeningData } = await client
    .from('listening_history')
    .select(`
      duration_seconds,
      band_id,
      bands!inner (
        id,
        owner_id
      )
    `)
    .eq('user_id', userId)
    .eq('is_free_play', false)
    .eq('completed', true)
    .gte('listened_at', periodStartStr)
    .lte('listened_at', periodEndStr)

  // Filter out user's own bands and calculate stats
  const filteredData = (listeningData || []).filter(
    (listen: any) => listen.bands?.owner_id !== userId
  )

  const totalListeningSeconds = filteredData.reduce((sum: number, listen: any) =>
    sum + (listen.duration_seconds || 0), 0)

  const uniqueArtists = new Set(filteredData.map((listen: any) => listen.band_id))

  return {
    impactPublic: true,
    stats: {
      totalEarned: artistPoolCents,
      artistsSupported: uniqueArtists.size,
      listeningTime: totalListeningSeconds,
      streamCount: filteredData.length,
      monthsSubscribed,
    },
  }
})
