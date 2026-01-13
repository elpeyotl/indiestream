// Admin: Calculate user-centric revenue distribution for a period
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

interface CalculatePayoutsRequest {
  periodStart: string // "2026-01-01"
  periodEnd: string   // "2026-01-31"
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  // Verify user is admin
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<CalculatePayoutsRequest>(event)

  if (!body.periodStart || !body.periodEnd) {
    throw createError({ statusCode: 400, statusMessage: 'Period start and end dates required' })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  try {
    // Check if period already exists
    const { data: existingPeriod } = await serviceClient
      .from('revenue_periods')
      .select('id, status')
      .eq('period_start', body.periodStart)
      .eq('period_end', body.periodEnd)
      .single()

    if (existingPeriod?.status === 'finalized') {
      throw createError({
        statusCode: 400,
        statusMessage: 'This period has already been finalized',
      })
    }

    // Get all active subscribers during this period
    const { data: subscribers, error: subError } = await serviceClient
      .from('subscriptions')
      .select('user_id, stripe_subscription_id, plan')
      .in('status', ['active', 'trialing'])

    if (subError) {
      console.error('Failed to fetch subscribers:', subError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch subscribers' })
    }

    const subscriberIds = subscribers?.map(s => s.user_id) || []

    if (subscriberIds.length === 0) {
      return {
        message: 'No active subscribers found',
        artistsCount: 0,
        totalRevenue: 0,
      }
    }

    // Get listening data for subscribers during this period
    // User-centric model: each subscriber's fee is split among artists they listened to
    const { data: listeningData, error: listenError } = await serviceClient
      .from('listening_history')
      .select('user_id, band_id, duration_seconds')
      .in('user_id', subscriberIds)
      .gte('listened_at', body.periodStart)
      .lte('listened_at', `${body.periodEnd}T23:59:59.999Z`)
      .eq('completed', true)
      .eq('is_free_play', false)

    if (listenError) {
      console.error('Failed to fetch listening data:', listenError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch listening data' })
    }

    if (!listeningData || listeningData.length === 0) {
      return {
        message: 'No listening data found for this period',
        artistsCount: 0,
        totalRevenue: 0,
      }
    }

    // Calculate per-user listening distribution
    const userListening = new Map<string, Map<string, { seconds: number; streams: number }>>()

    for (const listen of listeningData) {
      if (!userListening.has(listen.user_id)) {
        userListening.set(listen.user_id, new Map())
      }
      const userBands = userListening.get(listen.user_id)!
      if (!userBands.has(listen.band_id)) {
        userBands.set(listen.band_id, { seconds: 0, streams: 0 })
      }
      const bandData = userBands.get(listen.band_id)!
      bandData.seconds += listen.duration_seconds || 0
      bandData.streams += 1
    }

    // Calculate artist earnings using user-centric model
    // Each subscriber pays $9.99, 85% goes to artists ($8.49)
    const SUBSCRIPTION_PRICE_CENTS = 999
    const ARTIST_SHARE = 0.85
    const ARTIST_POOL_PER_USER = Math.floor(SUBSCRIPTION_PRICE_CENTS * ARTIST_SHARE)

    const artistEarnings = new Map<string, {
      grossCents: number
      streamCount: number
      listeningSeconds: number
    }>()

    let totalRevenueCents = 0
    let totalArtistPoolCents = 0

    for (const [userId, bands] of userListening) {
      // Calculate this user's total listening time
      let totalUserSeconds = 0
      for (const [, data] of bands) {
        totalUserSeconds += data.seconds
      }

      if (totalUserSeconds === 0) continue

      // This user contributes their share
      totalRevenueCents += SUBSCRIPTION_PRICE_CENTS
      totalArtistPoolCents += ARTIST_POOL_PER_USER

      // Distribute this user's artist pool among bands they listened to
      for (const [bandId, data] of bands) {
        const shareOfUser = data.seconds / totalUserSeconds
        const earningsFromUser = Math.floor(ARTIST_POOL_PER_USER * shareOfUser)

        if (!artistEarnings.has(bandId)) {
          artistEarnings.set(bandId, { grossCents: 0, streamCount: 0, listeningSeconds: 0 })
        }
        const artist = artistEarnings.get(bandId)!
        artist.grossCents += earningsFromUser
        artist.streamCount += data.streams
        artist.listeningSeconds += data.seconds
      }
    }

    // Create or update revenue period
    let periodId: string

    if (existingPeriod) {
      periodId = existingPeriod.id

      // Delete existing earnings for this period
      await serviceClient
        .from('artist_earnings')
        .delete()
        .eq('revenue_period_id', periodId)

      // Update period
      await serviceClient
        .from('revenue_periods')
        .update({
          total_subscription_revenue_cents: totalRevenueCents,
          total_streams: listeningData.length,
          artist_pool_cents: totalArtistPoolCents,
          platform_fee_cents: totalRevenueCents - totalArtistPoolCents,
          status: 'calculating',
        })
        .eq('id', periodId)
    } else {
      // Create new period
      const { data: newPeriod, error: periodError } = await serviceClient
        .from('revenue_periods')
        .insert({
          period_start: body.periodStart,
          period_end: body.periodEnd,
          total_subscription_revenue_cents: totalRevenueCents,
          total_streams: listeningData.length,
          artist_pool_cents: totalArtistPoolCents,
          platform_fee_cents: totalRevenueCents - totalArtistPoolCents,
          status: 'calculating',
        })
        .select()
        .single()

      if (periodError || !newPeriod) {
        console.error('Failed to create revenue period:', periodError)
        throw createError({ statusCode: 500, statusMessage: 'Failed to create revenue period' })
      }

      periodId = newPeriod.id
    }

    // Insert artist earnings
    const earningsRecords = Array.from(artistEarnings.entries()).map(([bandId, data]) => ({
      revenue_period_id: periodId,
      band_id: bandId,
      stream_count: data.streamCount,
      listening_seconds: data.listeningSeconds,
      gross_earnings_cents: data.grossCents,
      net_earnings_cents: data.grossCents, // Net = Gross for now (no deductions)
      payout_status: 'pending',
    }))

    const { error: earningsError } = await serviceClient
      .from('artist_earnings')
      .insert(earningsRecords)

    if (earningsError) {
      console.error('Failed to insert artist earnings:', earningsError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to save artist earnings' })
    }

    // Update artist balances
    for (const [bandId, data] of artistEarnings) {
      await serviceClient
        .from('artist_balances')
        .upsert({
          band_id: bandId,
          balance_cents: data.grossCents,
          lifetime_earnings_cents: data.grossCents,
        }, {
          onConflict: 'band_id',
        })

      // If record exists, add to existing balance
      const { data: existing } = await serviceClient
        .from('artist_balances')
        .select('balance_cents, lifetime_earnings_cents')
        .eq('band_id', bandId)
        .single()

      if (existing) {
        await serviceClient
          .from('artist_balances')
          .update({
            balance_cents: (existing.balance_cents || 0) + data.grossCents,
            lifetime_earnings_cents: (existing.lifetime_earnings_cents || 0) + data.grossCents,
          })
          .eq('band_id', bandId)
      }
    }

    // Mark period as calculated
    await serviceClient
      .from('revenue_periods')
      .update({ status: 'calculated' })
      .eq('id', periodId)

    return {
      success: true,
      periodId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      totalRevenue: totalRevenueCents,
      artistPool: totalArtistPoolCents,
      platformFee: totalRevenueCents - totalArtistPoolCents,
      totalStreams: listeningData.length,
      artistsCount: artistEarnings.size,
      subscribersCount: userListening.size,
    }
  } catch (error: any) {
    console.error('Calculate payouts error:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to calculate payouts',
    })
  }
})
