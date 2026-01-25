// Listener-facing: Show where their subscription money went (all-time or last month)
// Now includes tips and album purchases for complete impact picture
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

interface ArtistBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  listeningSeconds: number
  streamCount: number
  percentageOfListening: number
  earningsCents: number
}

interface TipBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  tipCount: number
  totalGrossCents: number
  totalNetCents: number
}

interface PurchaseBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  albumId: string
  albumTitle: string
  albumSlug: string
  coverKey: string | null
  amountCents: number
  artistShareCents: number
  purchasedAt: string
}

interface MoneyDistribution {
  period: 'all-time' | 'last-month' | 'this-month'
  periodLabel: string
  subscriptionStatus: 'active' | 'trialing' | 'inactive'
  totalPaidCents: number
  artistPoolCents: number
  cmoFeeCents: number
  platformFeeCents: number
  totalListeningSeconds: number
  totalStreams: number
  monthsSubscribed: number
  artistBreakdown: ArtistBreakdown[]

  // Tips data
  tips: {
    totalGrossCents: number
    totalNetCents: number
    tipCount: number
    artistBreakdown: TipBreakdown[]
  }

  // Purchases data
  purchases: {
    totalGrossCents: number
    totalArtistShareCents: number
    purchaseCount: number
    breakdown: PurchaseBreakdown[]
  }

  // Combined totals across all support types
  totals: {
    totalToArtistsCents: number
    totalContributionCents: number
    uniqueArtistsSupported: number
  }

  // Whether user has any impact to show (for unsubscribed users)
  hasImpact: boolean
}

export default defineEventHandler(async (event): Promise<MoneyDistribution> => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)

  // Get period parameter (default to this-month)
  const period = (query.period as string) || 'this-month'

  if (period !== 'all-time' && period !== 'last-month' && period !== 'this-month') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid period. Must be "all-time", "last-month", or "this-month"' })
  }

  // Revenue model constants
  const SUBSCRIPTION_PRICE_CENTS = 999
  const ARTIST_SHARE = 0.70
  const CMO_SHARE = 0.15
  const PLATFORM_SHARE = 0.15

  // Check user's subscription status and created date
  const { data: subscription } = await client
    .from('subscriptions')
    .select('status, stripe_subscription_id, created_at')
    .eq('user_id', user.id)
    .single()

  const isSubscribed = subscription &&
    subscription.stripe_subscription_id &&
    ['active', 'trialing'].includes(subscription.status)

  const subscriptionStatus = isSubscribed
    ? (subscription.status as 'active' | 'trialing')
    : 'inactive'

  // Calculate date range based on period
  let periodStartStr: string
  let periodEndStr: string
  let periodLabel: string
  let monthsSubscribed = 0

  if (period === 'this-month') {
    // Get current calendar month (from 1st to now)
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    periodStartStr = thisMonth.toISOString().split('T')[0]
    periodEndStr = now.toISOString()
    periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthsSubscribed = 1
  } else if (period === 'last-month') {
    // Get previous calendar month
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    periodStartStr = lastMonth.toISOString().split('T')[0]
    periodEndStr = lastMonthEnd.toISOString()
    periodLabel = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthsSubscribed = 1
  } else {
    // All-time: from subscription start to now
    if (subscription?.created_at) {
      const subStart = new Date(subscription.created_at)
      periodStartStr = subStart.toISOString().split('T')[0]

      // Calculate months subscribed (rough estimate)
      const now = new Date()
      const monthsDiff = (now.getFullYear() - subStart.getFullYear()) * 12 +
                        (now.getMonth() - subStart.getMonth())
      monthsSubscribed = Math.max(1, monthsDiff + 1) // At least 1 month
    } else {
      // Fallback: use account creation date
      periodStartStr = '2020-01-01' // Platform launch date fallback
      monthsSubscribed = 1
    }
    periodEndStr = new Date().toISOString()
    periodLabel = 'All Time'
  }

  // Calculate total amounts based on period
  const totalPaidCents = SUBSCRIPTION_PRICE_CENTS * monthsSubscribed
  const artistPoolCents = Math.floor(totalPaidCents * ARTIST_SHARE)
  const cmoFeeCents = Math.floor(totalPaidCents * CMO_SHARE)
  const platformFeeCents = Math.floor(totalPaidCents * PLATFORM_SHARE)

  // Get listening data for the period (only paid streams)
  const { data: listeningData, error: listenError } = await client
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
    .eq('user_id', user.id)
    .eq('is_free_play', false)
    .eq('completed', true)
    .gte('listened_at', periodStartStr)
    .lte('listened_at', periodEndStr)

  if (listenError) {
    console.error('Failed to fetch listening data:', listenError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch listening data' })
  }

  // Get tips for the period
  const { data: tipsData, error: tipsError } = await client
    .from('artist_tips')
    .select(`
      id,
      amount_cents,
      net_amount_cents,
      band_id,
      created_at,
      bands!inner (
        id,
        name,
        slug,
        avatar_key,
        owner_id
      )
    `)
    .eq('tipper_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', periodStartStr)
    .lte('created_at', periodEndStr)

  if (tipsError) {
    console.error('Failed to fetch tips data:', tipsError)
    // Don't throw - just continue without tips data
  }

  // Get purchases for the period
  const { data: purchasesData, error: purchasesError } = await client
    .from('purchases')
    .select(`
      id,
      amount_cents,
      artist_share_cents,
      band_id,
      completed_at,
      albums!inner (
        id,
        title,
        slug,
        cover_key
      ),
      bands!inner (
        id,
        name,
        slug,
        avatar_key,
        owner_id
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', periodStartStr)
    .lte('completed_at', periodEndStr)

  if (purchasesError) {
    console.error('Failed to fetch purchases data:', purchasesError)
    // Don't throw - just continue without purchases data
  }

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
    if (band.owner_id === user.id) {
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

  // Calculate distribution of artist pool among bands
  const artistBreakdown: ArtistBreakdown[] = []
  let totalStreamingEarnings = 0

  for (const [bandId, data] of bandListening) {
    const shareOfListening = totalListeningSeconds > 0
      ? data.seconds / totalListeningSeconds
      : 0
    const earningsCents = Math.floor(artistPoolCents * shareOfListening)

    totalStreamingEarnings += earningsCents

    artistBreakdown.push({
      bandId,
      bandName: data.name,
      bandSlug: data.slug,
      avatarKey: data.avatarKey,
      avatarUrl: null, // Will be filled by frontend with presigned URL
      listeningSeconds: data.seconds,
      streamCount: data.streams,
      percentageOfListening: shareOfListening * 100,
      earningsCents,
    })
  }

  // Handle rounding: ensure earnings sum to exactly artistPoolCents
  if (totalStreamingEarnings < artistPoolCents && artistBreakdown.length > 0) {
    // Sort by earnings descending and add remainder to top artist
    artistBreakdown.sort((a, b) => b.earningsCents - a.earningsCents)
    const remainder = artistPoolCents - totalStreamingEarnings
    artistBreakdown[0].earningsCents += remainder
  }

  // Sort by earnings descending for display
  artistBreakdown.sort((a, b) => b.earningsCents - a.earningsCents)

  // Aggregate tips by band
  const tipsByBand = new Map<string, {
    name: string
    slug: string
    avatarKey: string | null
    tipCount: number
    totalGross: number
    totalNet: number
  }>()

  let totalTipsGross = 0
  let totalTipsNet = 0
  let totalTipCount = 0

  for (const tip of tipsData || []) {
    const band = tip.bands as any
    const bandId = band.id

    // Skip if this is the user's own band
    if (band.owner_id === user.id) {
      continue
    }

    const grossAmount = tip.amount_cents || 0
    const netAmount = tip.net_amount_cents || 0

    totalTipsGross += grossAmount
    totalTipsNet += netAmount
    totalTipCount += 1

    if (!tipsByBand.has(bandId)) {
      tipsByBand.set(bandId, {
        name: band.name,
        slug: band.slug,
        avatarKey: band.avatar_key,
        tipCount: 0,
        totalGross: 0,
        totalNet: 0,
      })
    }

    const bandData = tipsByBand.get(bandId)!
    bandData.tipCount += 1
    bandData.totalGross += grossAmount
    bandData.totalNet += netAmount
  }

  // Build tips breakdown
  const tipsBreakdown: TipBreakdown[] = []
  for (const [bandId, data] of tipsByBand) {
    tipsBreakdown.push({
      bandId,
      bandName: data.name,
      bandSlug: data.slug,
      avatarKey: data.avatarKey,
      avatarUrl: null,
      tipCount: data.tipCount,
      totalGrossCents: data.totalGross,
      totalNetCents: data.totalNet,
    })
  }

  // Sort tips by net amount descending
  tipsBreakdown.sort((a, b) => b.totalNetCents - a.totalNetCents)

  // Aggregate purchases
  const purchasesBreakdown: PurchaseBreakdown[] = []
  let totalPurchasesGross = 0
  let totalPurchasesArtistShare = 0

  for (const purchase of purchasesData || []) {
    const band = purchase.bands as any
    const album = purchase.albums as any

    // Skip if this is the user's own band
    if (band.owner_id === user.id) {
      continue
    }

    const grossAmount = purchase.amount_cents || 0
    const artistShare = purchase.artist_share_cents || 0

    totalPurchasesGross += grossAmount
    totalPurchasesArtistShare += artistShare

    purchasesBreakdown.push({
      bandId: band.id,
      bandName: band.name,
      bandSlug: band.slug,
      avatarKey: band.avatar_key,
      avatarUrl: null,
      albumId: album.id,
      albumTitle: album.title,
      albumSlug: album.slug,
      coverKey: album.cover_key,
      amountCents: grossAmount,
      artistShareCents: artistShare,
      purchasedAt: purchase.completed_at,
    })
  }

  // Sort purchases by artist share descending
  purchasesBreakdown.sort((a, b) => b.artistShareCents - a.artistShareCents)

  // Calculate unique artists supported across all sources
  const allSupportedBandIds = new Set<string>([
    ...artistBreakdown.map(a => a.bandId),
    ...tipsBreakdown.map(t => t.bandId),
    ...purchasesBreakdown.map(p => p.bandId),
  ])

  // Calculate combined totals
  const streamingArtistEarnings = isSubscribed ? artistPoolCents : 0
  const totalToArtistsCents = streamingArtistEarnings + totalTipsNet + totalPurchasesArtistShare
  const totalContributionCents = (isSubscribed ? totalPaidCents : 0) + totalTipsGross + totalPurchasesGross

  // Determine if user has any impact to show
  const hasImpact = totalStreams > 0 || totalTipCount > 0 || purchasesBreakdown.length > 0

  return {
    period,
    periodLabel,
    subscriptionStatus,
    totalPaidCents: isSubscribed ? totalPaidCents : 0,
    artistPoolCents: isSubscribed ? artistPoolCents : 0,
    cmoFeeCents: isSubscribed ? cmoFeeCents : 0,
    platformFeeCents: isSubscribed ? platformFeeCents : 0,
    totalListeningSeconds,
    totalStreams,
    monthsSubscribed: isSubscribed ? monthsSubscribed : 0,
    artistBreakdown,

    tips: {
      totalGrossCents: totalTipsGross,
      totalNetCents: totalTipsNet,
      tipCount: totalTipCount,
      artistBreakdown: tipsBreakdown,
    },

    purchases: {
      totalGrossCents: totalPurchasesGross,
      totalArtistShareCents: totalPurchasesArtistShare,
      purchaseCount: purchasesBreakdown.length,
      breakdown: purchasesBreakdown,
    },

    totals: {
      totalToArtistsCents,
      totalContributionCents,
      uniqueArtistsSupported: allSupportedBandIds.size,
    },

    hasImpact,
  }
})
