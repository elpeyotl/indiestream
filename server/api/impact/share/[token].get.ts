// Fetch shared impact data by token (public endpoint)
// Use service role client to bypass RLS since this is a public endpoint
// that needs to read listening_history for any user (based on the share token)
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token required' })
  }

  const client = serverSupabaseServiceRole(event)

  // Get share preferences
  const { data: share, error: shareError } = await client
    .from('impact_shares')
    .select('*')
    .eq('token', token)
    .single()

  if (shareError || !share) {
    throw createError({ statusCode: 404, statusMessage: 'Share not found' })
  }

  // Increment view count (fire and forget)
  client
    .from('impact_shares')
    .update({ view_count: share.view_count + 1 })
    .eq('id', share.id)
    .then() // Don't await, just fire

  // Revenue model constants
  const SUBSCRIPTION_PRICE_CENTS = 999
  const ARTIST_SHARE = 0.70

  // Get user's subscription info
  const { data: subscription } = await client
    .from('subscriptions')
    .select('status, created_at')
    .eq('user_id', share.user_id)
    .single()

  const isSubscribed = subscription && ['active', 'trialing'].includes(subscription.status)

  // Calculate date range based on period
  let periodStartStr: string
  let periodEndStr: string
  let periodLabel: string
  let monthsSubscribed = 0

  const now = new Date()

  if (share.period === 'this-month') {
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    periodStartStr = thisMonth.toISOString().split('T')[0]
    periodEndStr = now.toISOString()
    periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthsSubscribed = 1
  } else if (share.period === 'last-month') {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    periodStartStr = lastMonth.toISOString().split('T')[0]
    periodEndStr = lastMonthEnd.toISOString()
    periodLabel = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthsSubscribed = 1
  } else {
    // All-time
    if (subscription?.created_at) {
      const subStart = new Date(subscription.created_at)
      periodStartStr = subStart.toISOString().split('T')[0]
      const monthsDiff = (now.getFullYear() - subStart.getFullYear()) * 12 +
                        (now.getMonth() - subStart.getMonth())
      monthsSubscribed = Math.max(1, monthsDiff + 1)
    } else {
      periodStartStr = '2020-01-01'
      monthsSubscribed = 1
    }
    periodEndStr = now.toISOString()
    periodLabel = 'All Time'
  }

  // Calculate total amounts
  const totalPaidCents = SUBSCRIPTION_PRICE_CENTS * monthsSubscribed
  const artistPoolCents = Math.floor(totalPaidCents * ARTIST_SHARE)

  // Fetch tips and purchases for the period if enabled
  let tipsData: any[] = []
  let purchasesData: any[] = []

  if (share.show_tips) {
    const { data: tips } = await client
      .from('artist_tips')
      .select(`
        amount_cents,
        net_amount_cents,
        band_id,
        bands!inner (id, name, owner_id)
      `)
      .eq('tipper_id', share.user_id)
      .eq('status', 'completed')
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr)

    // Filter out tips to own bands
    tipsData = (tips || []).filter((tip: any) => tip.bands?.owner_id !== share.user_id)
  }

  if (share.show_purchases) {
    const { data: purchases } = await client
      .from('purchases')
      .select(`
        amount_cents,
        artist_share_cents,
        band_id,
        albums!inner (title),
        bands!inner (id, name, owner_id)
      `)
      .eq('user_id', share.user_id)
      .eq('status', 'completed')
      .gte('completed_at', periodStartStr)
      .lte('completed_at', periodEndStr)

    // Filter out purchases of own albums
    purchasesData = (purchases || []).filter((p: any) => p.bands?.owner_id !== share.user_id)
  }

  // Calculate tips totals
  const totalTipsNetCents = tipsData.reduce((sum: number, tip: any) => sum + (tip.net_amount_cents || 0), 0)
  const tipCount = tipsData.length
  const tipBandIds = new Set(tipsData.map((t: any) => t.band_id))

  // Calculate purchases totals
  const totalPurchasesArtistShareCents = purchasesData.reduce((sum: number, p: any) => sum + (p.artist_share_cents || 0), 0)
  const purchaseCount = purchasesData.length
  const purchaseBandIds = new Set(purchasesData.map((p: any) => p.band_id))

  // Get listening data for the period
  const { data: listeningData } = await client
    .from('listening_history')
    .select(`
      duration_seconds,
      completed,
      band_id,
      tracks!inner (
        albums!inner (
          bands!inner (
            id,
            name,
            slug,
            avatar_key,
            owner_id
          )
        )
      )
    `)
    .eq('user_id', share.user_id)
    .eq('is_free_play', false)
    .eq('completed', true)
    .gte('listened_at', periodStartStr)
    .lte('listened_at', periodEndStr)

  // Calculate per-band listening
  const bandListening = new Map<string, {
    name: string
    slug: string
    avatarKey: string | null
    seconds: number
    streams: number
  }>()

  let totalListeningSeconds = 0
  let totalStreams = 0

  for (const listen of listeningData || []) {
    const band = listen.tracks.albums.bands
    const bandId = band.id
    const duration = listen.duration_seconds || 0

    // Skip if this is the user's own band
    if (band.owner_id === share.user_id) {
      continue
    }

    totalListeningSeconds += duration
    totalStreams += 1

    if (!bandListening.has(bandId)) {
      bandListening.set(bandId, {
        name: band.name,
        slug: band.slug,
        avatarKey: band.avatar_key,
        seconds: 0,
        streams: 0,
      })
    }

    const bandData = bandListening.get(bandId)!
    bandData.seconds += duration
    bandData.streams += 1
  }

  // Calculate distribution
  const artistBreakdown: any[] = []
  let totalEarnings = 0

  for (const [bandId, data] of bandListening) {
    const shareOfListening = totalListeningSeconds > 0
      ? data.seconds / totalListeningSeconds
      : 0
    const earningsCents = Math.floor(artistPoolCents * shareOfListening)

    totalEarnings += earningsCents

    artistBreakdown.push({
      bandId,
      bandName: data.name,
      bandSlug: data.slug,
      avatarKey: data.avatarKey,
      listeningSeconds: data.seconds,
      streamCount: data.streams,
      percentageOfListening: shareOfListening * 100,
      earningsCents,
    })
  }

  // Handle rounding
  if (totalEarnings < artistPoolCents && artistBreakdown.length > 0) {
    artistBreakdown.sort((a, b) => b.earningsCents - a.earningsCents)
    const remainder = artistPoolCents - totalEarnings
    artistBreakdown[0].earningsCents += remainder
  }

  // Sort by earnings descending
  artistBreakdown.sort((a, b) => b.earningsCents - a.earningsCents)

  // Get user profile (display name, avatar)
  const { data: profile } = await client
    .from('profiles')
    .select('display_name, avatar_key')
    .eq('id', share.user_id)
    .single()

  // Calculate combined unique artists
  const allBandIds = new Set([
    ...Array.from(bandListening.keys()),
    ...tipBandIds,
    ...purchaseBandIds
  ])

  // Calculate combined total to artists
  const totalToArtistsCents = artistPoolCents + totalTipsNetCents + totalPurchasesArtistShareCents

  // Filter stats based on visibility preferences
  return {
    period: share.period,
    periodLabel,
    user: {
      displayName: profile?.display_name || 'Anonymous',
      avatarKey: profile?.avatar_key || null,
    },
    stats: {
      totalEarned: share.show_total_earned ? totalToArtistsCents : null,
      artistsSupported: share.show_artists_supported ? allBandIds.size : null,
      listeningTime: share.show_listening_time ? totalListeningSeconds : null,
      streamCount: share.show_stream_count ? totalStreams : null,
    },
    artistBreakdown: share.show_artist_breakdown ? artistBreakdown.slice(0, 10) : [],
    tips: share.show_tips ? {
      totalNetCents: totalTipsNetCents,
      tipCount,
      artistCount: tipBandIds.size,
    } : null,
    purchases: share.show_purchases ? {
      totalArtistShareCents: totalPurchasesArtistShareCents,
      purchaseCount,
      artistCount: purchaseBandIds.size,
    } : null,
  }
})
