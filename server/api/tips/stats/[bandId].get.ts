// GET /api/tips/stats/[bandId] - Get public tip stats for an artist
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const bandId = getRouterParam(event, 'bandId')
  if (!bandId) {
    throw createError({ statusCode: 400, message: 'Band ID is required' })
  }

  const client = await serverSupabaseClient(event)

  // Verify band exists
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    throw createError({ statusCode: 404, message: 'Artist not found' })
  }

  // Get aggregated stats for completed tips
  const { data: tips, error: tipsError } = await client
    .from('artist_tips')
    .select('amount_cents')
    .eq('band_id', bandId)
    .eq('status', 'completed')

  if (tipsError) {
    console.error('Failed to fetch tip stats:', tipsError)
    throw createError({ statusCode: 500, message: 'Failed to fetch tip stats' })
  }

  const totalTips = tips?.length || 0
  const totalAmountCents = tips?.reduce((sum, tip) => sum + tip.amount_cents, 0) || 0

  return {
    totalTips,
    totalAmountCents,
  }
})
