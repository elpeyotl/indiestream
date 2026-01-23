// GET /api/user/purchases - Get user's purchase history
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Please log in to view purchases',
    })
  }

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  const client = await serverSupabaseClient(event)

  // Get purchases with album and band info
  const { data: purchases, count, error } = await client
    .from('purchases')
    .select(
      `
      id,
      amount_cents,
      currency,
      status,
      created_at,
      completed_at,
      album:albums!album_id (
        id,
        title,
        slug,
        cover_key,
        band:bands!band_id (
          id,
          name,
          slug
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch purchases:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch purchases',
    })
  }

  // Format the response
  const formattedPurchases = (purchases || []).map((purchase) => {
    const album = purchase.album as any
    const band = album?.band

    return {
      id: purchase.id,
      amount: purchase.amount_cents / 100,
      currency: purchase.currency,
      purchasedAt: purchase.completed_at || purchase.created_at,
      album: album
        ? {
            id: album.id,
            title: album.title,
            slug: album.slug,
            coverKey: album.cover_key,
            artist: band
              ? {
                  id: band.id,
                  name: band.name,
                  slug: band.slug,
                }
              : null,
          }
        : null,
    }
  })

  return {
    purchases: formattedPurchases,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
