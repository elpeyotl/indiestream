// GET /api/admin/revenue-stats - Get revenue metrics for admin dashboard
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Verify admin access
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    // Get subscription counts by status
    const { data: subStats } = await client
      .from('subscriptions')
      .select('status, stripe_subscription_id')

    // Only count subscriptions with Stripe IDs as real subscriptions
    const realSubs = subStats?.filter(s => s.stripe_subscription_id) || []
    const activeCount = realSubs.filter(s => s.status === 'active').length
    const trialingCount = realSubs.filter(s => s.status === 'trialing').length
    const canceledCount = realSubs.filter(s => s.status === 'canceled').length
    const pastDueCount = realSubs.filter(s => s.status === 'past_due').length

    // Calculate MRR (active + trialing subscribers * $9.99)
    const SUBSCRIPTION_PRICE_CENTS = 999
    const monthlyRecurringRevenue = (activeCount + trialingCount) * SUBSCRIPTION_PRICE_CENTS

    // Get total artist balances (pending payout)
    const { data: balances } = await client
      .from('artist_balances')
      .select('balance_cents')

    const pendingBalance = balances?.reduce((sum, b) => sum + (b.balance_cents || 0), 0) || 0

    // Get lifetime earnings total
    const { data: lifetimeData } = await client
      .from('artist_balances')
      .select('lifetime_earnings_cents')

    const lifetimeEarnings = lifetimeData?.reduce((sum, b) => sum + (b.lifetime_earnings_cents || 0), 0) || 0

    // Get total paid out (completed payouts)
    const { data: payouts } = await client
      .from('payouts')
      .select('amount_cents, status')

    const completedPayouts = payouts?.filter(p => p.status === 'completed') || []
    const totalPaidOut = completedPayouts.reduce((sum, p) => sum + (p.amount_cents || 0), 0)
    const pendingPayouts = payouts?.filter(p => p.status === 'pending') || []
    const totalPendingPayouts = pendingPayouts.reduce((sum, p) => sum + (p.amount_cents || 0), 0)

    // Get monthly revenue trend (last 12 months from revenue_periods)
    const { data: periods } = await client
      .from('revenue_periods')
      .select('period_start, period_end, total_subscription_revenue_cents, artist_pool_cents, cmo_fee_cents, platform_fee_cents, total_streams, status')
      .order('period_start', { ascending: false })
      .limit(12)

    // Get subscriber growth over time (last 12 months)
    // We'll count subscriptions created each month
    const { data: allSubs } = await client
      .from('subscriptions')
      .select('created_at, status, stripe_subscription_id')
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: true })

    // Group subscriptions by month
    const subscriberGrowth: Array<{ month: string; newSubscribers: number; totalSubscribers: number }> = []
    const monthlyNew = new Map<string, number>()

    // Count new subscribers per month
    for (const sub of allSubs || []) {
      const date = new Date(sub.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyNew.set(monthKey, (monthlyNew.get(monthKey) || 0) + 1)
    }

    // Generate last 12 months and calculate cumulative totals
    const now = new Date()
    let runningTotal = 0
    const months: string[] = []

    // First, calculate totals before our 12-month window
    for (const [monthKey, count] of monthlyNew.entries()) {
      const [year, month] = monthKey.split('-').map(Number)
      const monthDate = new Date(year, month - 1, 1)
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      if (monthDate < twelveMonthsAgo) {
        runningTotal += count
      }
    }

    // Now generate the 12-month window with cumulative totals
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const newThisMonth = monthlyNew.get(monthKey) || 0
      runningTotal += newThisMonth
      subscriberGrowth.push({
        month: monthKey,
        newSubscribers: newThisMonth,
        totalSubscribers: runningTotal,
      })
    }

    // Get artist/band growth over time (last 12 months)
    const { data: allBands } = await client
      .from('bands')
      .select('created_at, status')
      .order('created_at', { ascending: true })

    // Group artists by month
    const artistGrowth: Array<{ month: string; newArtists: number; totalArtists: number }> = []
    const monthlyNewArtists = new Map<string, number>()

    // Count new artists per month (only approved/active ones)
    for (const band of allBands || []) {
      if (band.status === 'pending') continue // Don't count pending artists
      const date = new Date(band.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyNewArtists.set(monthKey, (monthlyNewArtists.get(monthKey) || 0) + 1)
    }

    // Calculate artist totals before our 12-month window
    let artistRunningTotal = 0
    for (const [monthKey, count] of monthlyNewArtists.entries()) {
      const [year, month] = monthKey.split('-').map(Number)
      const monthDate = new Date(year, month - 1, 1)
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      if (monthDate < twelveMonthsAgo) {
        artistRunningTotal += count
      }
    }

    // Generate the 12-month window with cumulative artist totals
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const newThisMonth = monthlyNewArtists.get(monthKey) || 0
      artistRunningTotal += newThisMonth
      artistGrowth.push({
        month: monthKey,
        newArtists: newThisMonth,
        totalArtists: artistRunningTotal,
      })
    }

    // Get top earning artists (by lifetime earnings - includes paid out amounts)
    const { data: topArtists } = await client
      .from('artist_balances')
      .select(`
        band_id,
        balance_cents,
        lifetime_earnings_cents,
        bands (
          id,
          name,
          slug,
          avatar_key
        )
      `)
      .gt('lifetime_earnings_cents', 0)
      .order('lifetime_earnings_cents', { ascending: false })
      .limit(10)

    // Calculate churn rate (very basic - canceled / total)
    const totalSubs = activeCount + trialingCount + canceledCount
    const churnRate = totalSubs > 0 ? canceledCount / totalSubs : 0

    // Calculate average revenue per subscriber this period
    const avgRevenuePerSub = (activeCount + trialingCount) > 0
      ? monthlyRecurringRevenue / (activeCount + trialingCount)
      : 0

    return {
      // Current metrics
      monthlyRecurringRevenue,
      pendingBalance,
      totalPaidOut,
      totalPendingPayouts,
      lifetimeEarnings,
      platformFee: Math.floor(monthlyRecurringRevenue * 0.15),
      cmoFee: Math.floor(monthlyRecurringRevenue * 0.15),
      artistPool: Math.floor(monthlyRecurringRevenue * 0.70),

      // Subscriber metrics
      subscribers: {
        active: activeCount,
        trialing: trialingCount,
        canceled: canceledCount,
        pastDue: pastDueCount,
        total: activeCount + trialingCount,
        churnRate: Math.round(churnRate * 100) / 100,
        avgRevenuePerSub: Math.round(avgRevenuePerSub),
      },

      // Trend data (for charts) - reversed to chronological order
      monthlyTrend: (periods || []).reverse(),

      // Subscriber growth over time
      subscriberGrowth,

      // Artist growth over time
      artistGrowth,

      // Top artists
      topArtists: (topArtists || []).map(a => ({
        bandId: a.band_id,
        name: (a.bands as any)?.name || 'Unknown',
        slug: (a.bands as any)?.slug || '',
        avatarKey: (a.bands as any)?.avatar_key || null,
        balance: a.balance_cents,
        lifetime: a.lifetime_earnings_cents,
      })),
    }
  } catch (error: any) {
    console.error('Failed to fetch revenue stats:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to fetch revenue stats' })
  }
})
