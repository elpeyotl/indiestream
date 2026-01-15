// Listener-facing: Show where their subscription money went (all-time or last month)
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
            avatar_key
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

  // If no listening data, return empty breakdown
  if (!listeningData || listeningData.length === 0) {
    return {
      period,
      periodLabel,
      subscriptionStatus,
      totalPaidCents,
      artistPoolCents,
      cmoFeeCents,
      platformFeeCents,
      totalListeningSeconds: 0,
      totalStreams: 0,
      monthsSubscribed,
      artistBreakdown: [],
    }
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

  for (const listen of listeningData) {
    const band = listen.tracks.albums.bands
    const bandId = band.id
    const duration = listen.duration_seconds || 0

    totalListeningSeconds += duration

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
      avatarUrl: null, // Will be filled by frontend with presigned URL
      listeningSeconds: data.seconds,
      streamCount: data.streams,
      percentageOfListening: shareOfListening * 100,
      earningsCents,
    })
  }

  // Handle rounding: ensure earnings sum to exactly artistPoolCents
  if (totalEarnings < artistPoolCents && artistBreakdown.length > 0) {
    // Sort by earnings descending and add remainder to top artist
    artistBreakdown.sort((a, b) => b.earningsCents - a.earningsCents)
    const remainder = artistPoolCents - totalEarnings
    artistBreakdown[0].earningsCents += remainder
  }

  // Sort by earnings descending for display
  artistBreakdown.sort((a, b) => b.earningsCents - a.earningsCents)

  return {
    period,
    periodLabel,
    subscriptionStatus,
    totalPaidCents,
    artistPoolCents,
    cmoFeeCents,
    platformFeeCents,
    totalListeningSeconds,
    totalStreams: listeningData.length,
    monthsSubscribed,
    artistBreakdown,
  }
})
