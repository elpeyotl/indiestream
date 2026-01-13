// Get artist earnings summary and payout history
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - please log in',
    })
  }

  const query = getQuery(event)
  const bandId = query.bandId as string

  if (!bandId) {
    throw createError({
      statusCode: 400,
      message: 'Band ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Verify user owns the band
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, owner_id, name, stripe_account_id, stripe_account_status, total_earnings_cents')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    throw createError({
      statusCode: 404,
      message: 'Band not found',
    })
  }

  if (band.owner_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not own this band',
    })
  }

  // Get artist balance
  const { data: balance } = await client
    .from('artist_balances')
    .select('balance_cents, lifetime_earnings_cents, last_payout_at')
    .eq('band_id', bandId)
    .single()

  // Get current month's earnings
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const { data: currentMonthEarnings } = await client
    .from('artist_earnings')
    .select('net_earnings_cents, stream_count')
    .eq('band_id', bandId)
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  const thisMonthEarnings = currentMonthEarnings?.reduce(
    (sum, e) => sum + (e.net_earnings_cents || 0),
    0
  ) || 0

  const thisMonthStreams = currentMonthEarnings?.reduce(
    (sum, e) => sum + (e.stream_count || 0),
    0
  ) || 0

  // Get recent payout history
  const { data: payouts } = await client
    .from('payouts')
    .select('id, amount_cents, status, stripe_transfer_id, created_at, processed_at')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get earnings by period
  const { data: earningsByPeriod } = await client
    .from('artist_earnings')
    .select(`
      id,
      stream_count,
      listening_seconds,
      gross_earnings_cents,
      net_earnings_cents,
      payout_status,
      created_at,
      revenue_periods (
        period_start,
        period_end
      )
    `)
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })
    .limit(12)

  return {
    bandId,
    bandName: band.name,
    stripeStatus: band.stripe_account_status || 'not_connected',
    stripeAccountId: band.stripe_account_id,

    // Balance info
    currentBalance: balance?.balance_cents || 0,
    lifetimeEarnings: balance?.lifetime_earnings_cents || band.total_earnings_cents || 0,
    lastPayoutAt: balance?.last_payout_at || null,

    // This month
    thisMonthEarnings,
    thisMonthStreams,

    // Minimum payout threshold
    minimumPayout: 1000, // $10.00 in cents

    // Can request payout?
    canRequestPayout: (balance?.balance_cents || 0) >= 1000 && band.stripe_account_status === 'active',

    // Payout history
    payouts: payouts?.map(p => ({
      id: p.id,
      amount: p.amount_cents,
      status: p.status,
      stripeTransferId: p.stripe_transfer_id,
      createdAt: p.created_at,
      processedAt: p.processed_at,
    })) || [],

    // Earnings by period
    earningsByPeriod: earningsByPeriod?.map(e => ({
      id: e.id,
      streamCount: e.stream_count,
      listeningSeconds: e.listening_seconds,
      grossEarnings: e.gross_earnings_cents,
      netEarnings: e.net_earnings_cents,
      payoutStatus: e.payout_status,
      createdAt: e.created_at,
      periodStart: (e.revenue_periods as any)?.period_start,
      periodEnd: (e.revenue_periods as any)?.period_end,
    })) || [],
  }
})
