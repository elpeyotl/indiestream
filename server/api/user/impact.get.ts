// GET /api/user/impact - Current user's monthly impact stats for homepage
// Now includes tips and purchases for non-subscribers
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  // If not logged in, return null stats
  if (!user) {
    return { isLoggedIn: false, isSubscribed: false, stats: null, hasImpact: false }
  }

  const client = await serverSupabaseServiceRole(event)

  // Revenue model constants
  const SUBSCRIPTION_PRICE_CENTS = 999
  const ARTIST_SHARE = 0.70

  // Calculate this month's date range
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartStr = monthStart.toISOString()
  const monthEndStr = now.toISOString()

  // Get user's subscription status
  const { data: subscription } = await client
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .single()

  const isSubscribed = subscription && ['active', 'trialing'].includes(subscription.status)

  // Always fetch tips and purchases for all logged-in users
  const [tipsResult, purchasesResult] = await Promise.all([
    // Get tips this month
    client
      .from('artist_tips')
      .select(`
        amount_cents,
        net_amount_cents,
        band_id,
        bands!inner (owner_id)
      `)
      .eq('tipper_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', monthStartStr)
      .lte('created_at', monthEndStr),

    // Get purchases this month
    client
      .from('purchases')
      .select(`
        amount_cents,
        artist_share_cents,
        band_id,
        bands!inner (owner_id)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', monthStartStr)
      .lte('completed_at', monthEndStr),
  ])

  // Filter out own bands from tips and purchases
  const tipsData = (tipsResult.data || []).filter((tip: any) => tip.bands?.owner_id !== user.id)
  const purchasesData = (purchasesResult.data || []).filter((p: any) => p.bands?.owner_id !== user.id)

  // Calculate tips totals
  const totalTipsNet = tipsData.reduce((sum: number, tip: any) => sum + (tip.net_amount_cents || 0), 0)
  const tipCount = tipsData.length
  const tipBandIds = new Set(tipsData.map((t: any) => t.band_id))

  // Calculate purchases totals
  const totalPurchasesArtistShare = purchasesData.reduce((sum: number, p: any) => sum + (p.artist_share_cents || 0), 0)
  const purchaseCount = purchasesData.length
  const purchaseBandIds = new Set(purchasesData.map((p: any) => p.band_id))

  // For non-subscribers, return tips/purchases only
  if (!isSubscribed) {
    const hasImpact = tipCount > 0 || purchaseCount > 0
    const allBandIds = new Set([...tipBandIds, ...purchaseBandIds])

    if (!hasImpact) {
      return { isLoggedIn: true, isSubscribed: false, stats: null, hasImpact: false }
    }

    return {
      isLoggedIn: true,
      isSubscribed: false,
      hasImpact: true,
      stats: {
        monthlyEarnings: 0,
        artistsSupported: allBandIds.size,
        hoursListened: 0,
        streamCount: 0,
        tipsCents: totalTipsNet,
        purchasesCents: totalPurchasesArtistShare,
        tipCount,
        purchaseCount,
      },
    }
  }

  // For subscribers, also get streaming data
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
    if (listen.is_free_play === true) return false
    if (listen.bands?.owner_id === user.id) return false
    return true
  })

  // Calculate streaming stats
  const totalListeningSeconds = filteredData.reduce(
    (sum: number, listen: any) => sum + (listen.duration_seconds || 0),
    0
  )
  const streamingBandIds = new Set(filteredData.map((listen: any) => listen.band_id))

  // Monthly earnings share (their subscription's artist pool)
  const monthlyEarningsCents = Math.floor(SUBSCRIPTION_PRICE_CENTS * ARTIST_SHARE)

  // Combine all unique artists
  const allBandIds = new Set([...streamingBandIds, ...tipBandIds, ...purchaseBandIds])
  const hasImpact = filteredData.length > 0 || tipCount > 0 || purchaseCount > 0

  return {
    isLoggedIn: true,
    isSubscribed: true,
    hasImpact,
    stats: {
      monthlyEarnings: monthlyEarningsCents,
      artistsSupported: allBandIds.size,
      hoursListened: Math.round((totalListeningSeconds / 3600) * 10) / 10,
      streamCount: filteredData.length,
      tipsCents: totalTipsNet,
      purchasesCents: totalPurchasesArtistShare,
      tipCount,
      purchaseCount,
    },
  }
})
