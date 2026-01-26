// GET /api/zine/first-payouts - Artists who just received their first payout
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  // Get artists who received their first payout in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  // First, get all completed payouts
  const { data: payouts } = await client
    .from('payouts')
    .select(`
      id,
      band_id,
      created_at,
      bands!inner (
        id,
        name,
        slug,
        avatar_key,
        theme_color
      )
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: true })

  if (!payouts || payouts.length === 0) {
    return { artists: [] }
  }

  // Find artists whose FIRST payout was within the last 30 days
  const firstPayouts = new Map<string, {
    band: any
    firstPayoutDate: string
  }>()

  for (const payout of payouts) {
    const bandId = payout.band_id
    if (!firstPayouts.has(bandId)) {
      // This is their first payout
      firstPayouts.set(bandId, {
        band: payout.bands,
        firstPayoutDate: payout.created_at,
      })
    }
  }

  // Filter to those whose first payout was recent
  const recentFirstPayouts = Array.from(firstPayouts.values())
    .filter(p => new Date(p.firstPayoutDate) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.firstPayoutDate).getTime() - new Date(a.firstPayoutDate).getTime())
    .slice(0, 10)

  return {
    artists: recentFirstPayouts.map(p => ({
      id: p.band.id,
      name: p.band.name,
      slug: p.band.slug,
      avatar_key: p.band.avatar_key,
      themeColor: p.band.theme_color,
    })),
  }
})
