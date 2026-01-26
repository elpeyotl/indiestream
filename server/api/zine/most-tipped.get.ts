// GET /api/zine/most-tipped - Artists who received the most tips this week
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole(event)

  // Calculate this week's date range (last 7 days)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoStr = weekAgo.toISOString()

  // Get tips from the last week, grouped by band
  const { data: tips } = await client
    .from('artist_tips')
    .select(`
      band_id,
      amount_cents,
      bands!inner (
        id,
        name,
        slug,
        avatar_key,
        theme_color
      )
    `)
    .eq('status', 'completed')
    .gte('created_at', weekAgoStr)

  if (!tips || tips.length === 0) {
    return { artists: [] }
  }

  // Aggregate by band
  const bandTips = new Map<string, {
    id: string
    name: string
    slug: string
    avatar_key: string | null
    theme_color: string | null
    tipCount: number
    totalCents: number
  }>()

  for (const tip of tips) {
    const band = tip.bands as any
    if (!band) continue

    const existing = bandTips.get(band.id)
    if (existing) {
      existing.tipCount += 1
      existing.totalCents += tip.amount_cents || 0
    } else {
      bandTips.set(band.id, {
        id: band.id,
        name: band.name,
        slug: band.slug,
        avatar_key: band.avatar_key,
        theme_color: band.theme_color,
        tipCount: 1,
        totalCents: tip.amount_cents || 0,
      })
    }
  }

  // Sort by tip count (descending)
  const sorted = Array.from(bandTips.values())
    .sort((a, b) => b.tipCount - a.tipCount)
    .slice(0, 10)

  return {
    artists: sorted.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      avatar_key: b.avatar_key,
      themeColor: b.theme_color,
      tipCount: b.tipCount,
    })),
  }
})
