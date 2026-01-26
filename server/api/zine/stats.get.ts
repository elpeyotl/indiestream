// GET /api/zine/stats - Platform-wide stats for the zine page
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  // Calculate this month's date range
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStartStr = monthStart.toISOString()

  // Fetch stats in parallel
  const [artistCountResult, payoutsResult, thisMonthPayoutsResult] = await Promise.all([
    // Count of active artists (bands with at least one published album)
    client
      .from('bands')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    // Total paid to artists (all time)
    client
      .from('payouts')
      .select('amount_cents')
      .eq('status', 'completed'),

    // This month's payouts
    client
      .from('payouts')
      .select('amount_cents')
      .eq('status', 'completed')
      .gte('created_at', monthStartStr),
  ])

  const artistCount = artistCountResult.count || 0

  const totalPaidToArtists = (payoutsResult.data || []).reduce(
    (sum, p) => sum + (p.amount_cents || 0),
    0
  )

  const thisMonthPaid = (thisMonthPayoutsResult.data || []).reduce(
    (sum, p) => sum + (p.amount_cents || 0),
    0
  )

  return {
    totalPaidToArtists,
    thisMonthPaid,
    artistCount,
  }
})
