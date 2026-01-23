// GET /api/tips/[bandId] - Get tips received by an artist (artist view only)
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const bandId = getRouterParam(event, 'bandId')
  if (!bandId) {
    throw createError({ statusCode: 400, message: 'Band ID is required' })
  }

  const client = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = parseInt(query.offset as string) || 0

  // Verify user owns this band
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, owner_id')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    throw createError({ statusCode: 404, message: 'Artist not found' })
  }

  if (band.owner_id !== user.id) {
    throw createError({ statusCode: 403, message: 'You can only view tips for your own artist profile' })
  }

  // Get tips for this band
  const { data: tips, error: tipsError, count } = await client
    .from('artist_tips')
    .select('*', { count: 'exact' })
    .eq('band_id', bandId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tipsError) {
    console.error('Failed to fetch tips:', tipsError)
    throw createError({ statusCode: 500, message: 'Failed to fetch tips' })
  }

  // Format tips for display (respect anonymity)
  const formattedTips = (tips || []).map((tip) => ({
    id: tip.id,
    amount_cents: tip.amount_cents,
    net_amount_cents: tip.net_amount_cents,
    message: tip.message,
    tipper_name: tip.is_anonymous ? null : tip.tipper_name,
    is_anonymous: tip.is_anonymous,
    created_at: tip.created_at,
  }))

  return {
    tips: formattedTips,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
})
