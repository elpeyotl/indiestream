// Admin: Get all artists eligible for payouts with their balance info
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

const MINIMUM_PAYOUT_CENTS = 1000 // $10.00

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

  try {
    // Get all bands with balances
    const { data: bandsWithBalances, error: queryError } = await serviceClient
      .from('artist_balances')
      .select(`
        band_id,
        balance_cents,
        bands!inner (
          id,
          name,
          owner_id
        )
      `)
      .gt('balance_cents', 0)

    if (queryError) {
      console.error('Failed to fetch band balances:', queryError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch band balances' })
    }

    if (!bandsWithBalances || bandsWithBalances.length === 0) {
      return { users: [] }
    }

    // Group bands by owner and sum their balances
    const ownerBalances = new Map<string, {
      ownerId: string
      totalBalance: number
      bands: Array<{ bandId: string; bandName: string; balance: number }>
    }>()

    for (const item of bandsWithBalances) {
      const band = item.bands as any
      const ownerId = band.owner_id

      if (!ownerBalances.has(ownerId)) {
        ownerBalances.set(ownerId, {
          ownerId,
          totalBalance: 0,
          bands: [],
        })
      }

      const ownerData = ownerBalances.get(ownerId)!
      ownerData.totalBalance += item.balance_cents
      ownerData.bands.push({
        bandId: item.band_id,
        bandName: band.name,
        balance: item.balance_cents,
      })
    }

    // Get all owner IDs
    const ownerIds = Array.from(ownerBalances.keys())

    // Get profile info for all owners
    const { data: profiles, error: profilesError } = await serviceClient
      .from('profiles')
      .select('id, display_name, email, stripe_account_id, stripe_account_status')
      .in('id', ownerIds)

    if (profilesError) {
      console.error('Failed to fetch profiles:', profilesError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch user profiles' })
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // Build response with all user info
    const users = Array.from(ownerBalances.entries()).map(([ownerId, data]) => {
      const profile = profileMap.get(ownerId)
      const meetsMinimum = data.totalBalance >= MINIMUM_PAYOUT_CENTS
      const hasStripe = !!profile?.stripe_account_id
      const stripeActive = profile?.stripe_account_status === 'active'

      return {
        userId: ownerId,
        userName: profile?.display_name || 'Unknown User',
        email: profile?.email || '',
        totalBalance: data.totalBalance,
        bandCount: data.bands.length,
        bands: data.bands,
        stripeStatus: profile?.stripe_account_status || 'not_connected',
        eligible: meetsMinimum && stripeActive,
        reason: !meetsMinimum
          ? `Below minimum ($${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)})`
          : !hasStripe
            ? 'No Stripe account'
            : !stripeActive
              ? 'Stripe not active'
              : 'Ready',
      }
    })

    // Sort by balance descending
    users.sort((a, b) => b.totalBalance - a.totalBalance)

    return {
      users,
      minimumPayout: MINIMUM_PAYOUT_CENTS,
      eligibleCount: users.filter(u => u.eligible).length,
      totalEligibleAmount: users.filter(u => u.eligible).reduce((sum, u) => sum + u.totalBalance, 0),
    }
  } catch (e: any) {
    console.error('Fetch payout eligible failed:', e)
    throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to fetch eligible artists' })
  }
})
