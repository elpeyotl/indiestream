// GET /api/albums/[id]/purchase-status - Check if user owns this album
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    return {
      owned: false,
      purchase: null,
    }
  }

  const albumId = getRouterParam(event, 'id')
  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'Album ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Check for completed purchase
  const { data: purchase } = await client
    .from('purchases')
    .select('id, amount_cents, currency, created_at, completed_at')
    .eq('user_id', user.id)
    .eq('album_id', albumId)
    .eq('status', 'completed')
    .single()

  return {
    owned: !!purchase,
    purchase: purchase
      ? {
          id: purchase.id,
          amount: purchase.amount_cents / 100,
          currency: purchase.currency,
          purchasedAt: purchase.completed_at || purchase.created_at,
        }
      : null,
  }
})
