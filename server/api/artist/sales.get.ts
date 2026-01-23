// GET /api/artist/sales - Get artist's album sales data
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Please log in to view sales',
    })
  }

  const query = getQuery(event)
  const bandId = query.band_id as string
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  const client = await serverSupabaseClient(event)

  // Verify user owns this band (if specified)
  if (bandId) {
    const { data: band } = await client
      .from('bands')
      .select('id, owner_id')
      .eq('id', bandId)
      .eq('owner_id', user.id)
      .single()

    if (!band) {
      throw createError({
        statusCode: 403,
        message: 'You do not have access to this band',
      })
    }
  }

  // Get all bands owned by user
  const { data: userBands } = await client
    .from('bands')
    .select('id')
    .eq('owner_id', user.id)

  if (!userBands || userBands.length === 0) {
    return {
      totalSales: 0,
      totalRevenue: 0,
      currency: 'CHF',
      purchases: [],
      page,
      limit,
      totalPages: 0,
    }
  }

  const bandIds = bandId ? [bandId] : userBands.map((b) => b.id)

  // Get sales statistics
  const { data: stats } = await client
    .from('purchases')
    .select('artist_share_cents')
    .in('band_id', bandIds)
    .eq('status', 'completed')

  const totalSales = stats?.length || 0
  const totalRevenue = (stats || []).reduce((sum, p) => sum + p.artist_share_cents, 0)

  // Get recent purchases with details
  const { data: purchases, count, error } = await client
    .from('purchases')
    .select(
      `
      id,
      amount_cents,
      artist_share_cents,
      platform_fee_cents,
      currency,
      created_at,
      completed_at,
      album:albums!album_id (
        id,
        title,
        slug
      ),
      band:bands!band_id (
        id,
        name
      ),
      user:profiles!user_id (
        id,
        display_name
      )
    `,
      { count: 'exact' }
    )
    .in('band_id', bandIds)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch sales:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch sales data',
    })
  }

  // Format the response
  const formattedPurchases = (purchases || []).map((purchase) => {
    const album = purchase.album as any
    const band = purchase.band as any
    const buyer = purchase.user as any

    return {
      id: purchase.id,
      amount: purchase.amount_cents / 100,
      artistShare: purchase.artist_share_cents / 100,
      platformFee: purchase.platform_fee_cents / 100,
      currency: purchase.currency,
      purchasedAt: purchase.completed_at || purchase.created_at,
      album: album
        ? {
            id: album.id,
            title: album.title,
            slug: album.slug,
          }
        : null,
      band: band
        ? {
            id: band.id,
            name: band.name,
          }
        : null,
      buyer: buyer
        ? {
            displayName: buyer.display_name || 'Anonymous',
          }
        : null,
    }
  })

  return {
    totalSales,
    totalRevenue: totalRevenue / 100,
    currency: 'CHF',
    purchases: formattedPurchases,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
})
