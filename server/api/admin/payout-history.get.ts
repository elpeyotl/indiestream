// Admin: Get payout history
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

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

  const serviceClient = serverSupabaseServiceRole(event)

  // Get query params for pagination
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const offset = (page - 1) * limit

  try {
    // Get payouts with band info
    const { data: payouts, error: payoutsError, count } = await serviceClient
      .from('payouts')
      .select(`
        id,
        band_id,
        amount_cents,
        status,
        stripe_transfer_id,
        error_message,
        created_at,
        processed_at,
        bands (
          id,
          name,
          owner_id,
          profiles:owner_id (
            display_name,
            email
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (payoutsError) {
      console.error('Failed to fetch payouts:', payoutsError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch payout history' })
    }

    // Group payouts by stripe_transfer_id to show combined transfers
    const transferMap = new Map<string, {
      id: string
      stripeTransferId: string | null
      totalAmount: number
      status: string
      errorMessage: string | null
      createdAt: string
      processedAt: string | null
      bands: Array<{ id: string; name: string; amount: number }>
      user: { name: string; email: string } | null
    }>()

    for (const p of payouts || []) {
      const key = p.stripe_transfer_id || p.id
      const band = p.bands as any
      const ownerProfile = band?.profiles

      if (!transferMap.has(key)) {
        transferMap.set(key, {
          id: p.id,
          stripeTransferId: p.stripe_transfer_id,
          totalAmount: 0,
          status: p.status,
          errorMessage: p.error_message,
          createdAt: p.created_at,
          processedAt: p.processed_at,
          bands: [],
          user: ownerProfile ? {
            name: ownerProfile.display_name || 'Unknown',
            email: ownerProfile.email || '',
          } : null,
        })
      }

      const entry = transferMap.get(key)!
      entry.totalAmount += p.amount_cents
      if (band) {
        entry.bands.push({
          id: band.id,
          name: band.name,
          amount: p.amount_cents,
        })
      }
    }

    const groupedPayouts = Array.from(transferMap.values())

    // Get totals
    const { data: totals } = await serviceClient
      .from('payouts')
      .select('amount_cents, status')

    const totalPaid = totals?.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount_cents, 0) || 0
    const totalFailed = totals?.filter(t => t.status === 'failed').reduce((sum, t) => sum + t.amount_cents, 0) || 0
    const totalPending = totals?.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount_cents, 0) || 0

    return {
      payouts: groupedPayouts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      totals: {
        paid: totalPaid,
        failed: totalFailed,
        pending: totalPending,
      },
    }
  } catch (e: any) {
    console.error('Fetch payout history failed:', e)
    throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to fetch payout history' })
  }
})
