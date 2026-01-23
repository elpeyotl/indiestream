// GET /api/user/impact - Current user's monthly impact stats for homepage
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  // If not logged in, return null stats
  if (!user) {
    return { isLoggedIn: false, isSubscribed: false, stats: null }
  }

  const client = await serverSupabaseServiceRole(event)

  // Revenue model constants
  const SUBSCRIPTION_PRICE_CENTS = 999
  const ARTIST_SHARE = 0.70

  // Get user's subscription status
  const { data: subscription } = await client
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const isSubscribed = subscription && ['active', 'trialing'].includes(subscription.status)

  if (!isSubscribed) {
    return { isLoggedIn: true, isSubscribed: false, stats: null }
  }

  // Calculate this month's impact
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartStr = monthStart.toISOString()
  const monthEndStr = now.toISOString()

  // Get listening data for this month (excluding user's own bands)
  // Use left join to not exclude records where band might not exist
  const { data: listeningData } = await client
    .from('listening_history')
    .select(`
      duration_seconds,
      band_id,
      is_free_play,
      bands (
        id,
        owner_id
      )
    `)
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('listened_at', monthStartStr)
    .lte('listened_at', monthEndStr)

  // Filter: exclude free plays and user's own bands
  const filteredData = (listeningData || []).filter((listen: any) => {
    // Exclude free plays (treat null as false for backwards compatibility)
    if (listen.is_free_play === true) return false
    // Exclude user's own bands
    if (listen.bands?.owner_id === user.id) return false
    return true
  })

  // Calculate stats
  const totalListeningSeconds = filteredData.reduce(
    (sum: number, listen: any) => sum + (listen.duration_seconds || 0),
    0
  )
  const uniqueArtists = new Set(filteredData.map((listen: any) => listen.band_id))

  // Monthly earnings share (their subscription's artist pool)
  const monthlyEarningsCents = Math.floor(SUBSCRIPTION_PRICE_CENTS * ARTIST_SHARE)

  return {
    isLoggedIn: true,
    isSubscribed: true,
    stats: {
      monthlyEarnings: monthlyEarningsCents,
      artistsSupported: uniqueArtists.size,
      hoursListened: Math.round((totalListeningSeconds / 3600) * 10) / 10, // Round to 1 decimal
      streamCount: filteredData.length,
    },
  }
})
