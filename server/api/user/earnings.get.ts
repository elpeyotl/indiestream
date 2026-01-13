// Get combined earnings across all user's bands
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - please log in',
    })
  }

  const client = await serverSupabaseClient(event)

  // Get user's profile with Stripe info
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, display_name, stripe_account_id, stripe_account_status, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw createError({
      statusCode: 404,
      message: 'Profile not found',
    })
  }

  // Get all user's bands with their balances
  const { data: bands, error: bandsError } = await client
    .from('bands')
    .select(`
      id,
      name,
      slug,
      total_streams,
      total_earnings_cents,
      artist_balances (
        balance_cents,
        lifetime_earnings_cents,
        last_payout_at
      )
    `)
    .eq('owner_id', user.id)
    .order('total_streams', { ascending: false })

  if (bandsError) {
    console.error('Failed to fetch bands:', bandsError)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch bands',
    })
  }

  // Calculate combined totals
  let totalBalance = 0
  let totalLifetimeEarnings = 0

  const bandBreakdown = (bands || []).map(band => {
    const balance = Array.isArray(band.artist_balances)
      ? band.artist_balances[0]
      : band.artist_balances

    const bandBalance = balance?.balance_cents || 0
    const bandLifetime = balance?.lifetime_earnings_cents || band.total_earnings_cents || 0

    totalBalance += bandBalance
    totalLifetimeEarnings += bandLifetime

    return {
      id: band.id,
      name: band.name,
      slug: band.slug,
      totalStreams: band.total_streams || 0,
      currentBalance: bandBalance,
      lifetimeEarnings: bandLifetime,
      lastPayoutAt: balance?.last_payout_at || null,
    }
  })

  // Get current month's earnings across all bands
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const bandIds = (bands || []).map(b => b.id)
  let thisMonthEarnings = 0
  let thisMonthStreams = 0

  if (bandIds.length > 0) {
    const { data: currentMonthEarnings } = await client
      .from('artist_earnings')
      .select('net_earnings_cents, stream_count')
      .in('band_id', bandIds)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString())

    thisMonthEarnings = currentMonthEarnings?.reduce(
      (sum, e) => sum + (e.net_earnings_cents || 0),
      0
    ) || 0

    thisMonthStreams = currentMonthEarnings?.reduce(
      (sum, e) => sum + (e.stream_count || 0),
      0
    ) || 0
  }

  // Get recent payout history across all bands
  let payouts: any[] = []
  if (bandIds.length > 0) {
    const { data: payoutData } = await client
      .from('payouts')
      .select('id, band_id, amount_cents, status, stripe_transfer_id, created_at, processed_at')
      .in('band_id', bandIds)
      .order('created_at', { ascending: false })
      .limit(20)

    // Group payouts by transfer ID (combined payouts share the same transfer)
    const transferMap = new Map<string, {
      id: string
      amount: number
      status: string
      stripeTransferId: string | null
      createdAt: string
      processedAt: string | null
      bands: string[]
    }>()

    const bandMap = new Map((bands || []).map(b => [b.id, b.name]))

    for (const p of payoutData || []) {
      const key = p.stripe_transfer_id || p.id
      if (!transferMap.has(key)) {
        transferMap.set(key, {
          id: p.id,
          amount: 0,
          status: p.status,
          stripeTransferId: p.stripe_transfer_id,
          createdAt: p.created_at,
          processedAt: p.processed_at,
          bands: [],
        })
      }
      const entry = transferMap.get(key)!
      entry.amount += p.amount_cents
      const bandName = bandMap.get(p.band_id)
      if (bandName && !entry.bands.includes(bandName)) {
        entry.bands.push(bandName)
      }
    }

    payouts = Array.from(transferMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }

  return {
    // User Stripe status
    stripeStatus: profile.stripe_account_status || 'not_connected',
    stripeAccountId: profile.stripe_account_id,
    stripeOnboardingComplete: profile.stripe_onboarding_complete || false,

    // Combined totals
    totalBalance,
    totalLifetimeEarnings,
    thisMonthEarnings,
    thisMonthStreams,

    // Payout info
    minimumPayout: 1000, // $10.00 in cents
    canRequestPayout: totalBalance >= 1000 && profile.stripe_account_status === 'active',

    // Per-band breakdown
    bandCount: bandBreakdown.length,
    bands: bandBreakdown,

    // Combined payout history
    payouts,
  }
})
