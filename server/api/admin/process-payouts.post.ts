// Admin: Process Stripe transfers for users with combined band balance >= minimum
import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { sendPayoutSuccessEmail, sendPayoutFailedEmail } from '~/server/utils/email'

interface ProcessPayoutsRequest {
  userIds?: string[] // Optional: specific users to pay out
}

const MINIMUM_PAYOUT_CENTS = 1000 // $10.00

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
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

  const body = await readBody<ProcessPayoutsRequest>(event)
  const serviceClient = serverSupabaseServiceRole(event)

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Get all bands with balances, joined with their owners' Stripe info
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
      return {
        message: 'No bands with positive balance',
        processed: 0,
        failed: 0,
        results: [],
      }
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

    // Get Stripe account info for owners with sufficient balance
    const eligibleOwnerIds = Array.from(ownerBalances.entries())
      .filter(([_, data]) => data.totalBalance >= MINIMUM_PAYOUT_CENTS)
      .map(([ownerId]) => ownerId)

    // Apply user filter if specified
    const targetOwnerIds = body.userIds && body.userIds.length > 0
      ? eligibleOwnerIds.filter(id => body.userIds!.includes(id))
      : eligibleOwnerIds

    if (targetOwnerIds.length === 0) {
      return {
        message: 'No users eligible for payout (minimum $10.00)',
        processed: 0,
        failed: 0,
        results: [],
      }
    }

    // Get Stripe info for eligible users
    const { data: profiles, error: profilesError } = await serviceClient
      .from('profiles')
      .select('id, email, display_name, stripe_account_id, stripe_account_status')
      .in('id', targetOwnerIds)

    if (profilesError) {
      console.error('Failed to fetch profiles:', profilesError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch user profiles' })
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    const results: Array<{
      userId: string
      userName: string
      amount: number
      bandCount: number
      bands: string[]
      status: 'success' | 'failed' | 'skipped'
      error?: string
      transferId?: string
    }> = []

    let processed = 0
    let failed = 0

    for (const ownerId of targetOwnerIds) {
      const ownerData = ownerBalances.get(ownerId)!
      const profile = profileMap.get(ownerId)
      const userName = profile?.display_name || 'Unknown User'
      const stripeAccountId = profile?.stripe_account_id
      const stripeStatus = profile?.stripe_account_status
      const amount = ownerData.totalBalance
      const bandNames = ownerData.bands.map(b => b.bandName)

      // Skip if no Stripe account or not active
      if (!stripeAccountId || stripeStatus !== 'active') {
        results.push({
          userId: ownerId,
          userName,
          amount,
          bandCount: ownerData.bands.length,
          bands: bandNames,
          status: 'skipped',
          error: stripeAccountId ? 'Stripe account not active' : 'No Stripe account connected',
        })
        continue
      }

      try {
        // Create single Stripe transfer for all user's bands
        // Note: Using CHF as that's the platform's default currency
        const transfer = await stripe.transfers.create({
          amount,
          currency: 'chf',
          destination: stripeAccountId,
          description: `Fairtune payout for ${userName} (${ownerData.bands.length} artist${ownerData.bands.length > 1 ? 's' : ''})`,
          metadata: {
            user_id: ownerId,
            band_count: ownerData.bands.length.toString(),
            band_ids: ownerData.bands.map(b => b.bandId).join(','),
            payout_date: new Date().toISOString(),
          },
        })

        // Create payout records for each band
        for (const band of ownerData.bands) {
          const { error: payoutError } = await serviceClient
            .from('payouts')
            .insert({
              band_id: band.bandId,
              amount_cents: band.balance,
              stripe_transfer_id: transfer.id,
              status: 'completed',
              processed_at: new Date().toISOString(),
            })

          if (payoutError) {
            console.error(`Failed to record payout for band ${band.bandId}:`, payoutError)
          }

          // Clear band balance
          await serviceClient
            .from('artist_balances')
            .update({
              balance_cents: 0,
              last_payout_at: new Date().toISOString(),
            })
            .eq('band_id', band.bandId)

          // Update band total earnings
          await serviceClient.rpc('increment_band_earnings', {
            p_band_id: band.bandId,
            p_amount: band.balance,
          })
        }

        results.push({
          userId: ownerId,
          userName,
          amount,
          bandCount: ownerData.bands.length,
          bands: bandNames,
          status: 'success',
          transferId: transfer.id,
        })

        processed++
        console.log(`Payout successful: ${userName} - $${(amount / 100).toFixed(2)} (${ownerData.bands.length} bands) - ${transfer.id}`)

        // Send payout success email
        if (profile?.email) {
          try {
            await sendPayoutSuccessEmail({
              to: profile.email,
              artistName: userName,
              amount: amount / 100,
              currency: 'CHF',
              bands: bandNames,
              transferId: transfer.id,
            })
          } catch (emailError) {
            console.error('Failed to send payout success email:', emailError)
          }
        }
      } catch (stripeError: any) {
        console.error(`Stripe transfer failed for ${userName}:`, stripeError)

        // Record failed payouts for all bands
        for (const band of ownerData.bands) {
          await serviceClient
            .from('payouts')
            .insert({
              band_id: band.bandId,
              amount_cents: band.balance,
              status: 'failed',
              error_message: stripeError.message,
            })
        }

        results.push({
          userId: ownerId,
          userName,
          amount,
          bandCount: ownerData.bands.length,
          bands: bandNames,
          status: 'failed',
          error: stripeError.message,
        })

        failed++

        // Send payout failed email
        if (profile?.email) {
          try {
            await sendPayoutFailedEmail({
              to: profile.email,
              artistName: userName,
              amount: amount / 100,
              currency: 'CHF',
              errorMessage: stripeError.message,
            })
          } catch (emailError) {
            console.error('Failed to send payout failed email:', emailError)
          }
        }
      }
    }

    return {
      success: true,
      processed,
      failed,
      skipped: results.filter(r => r.status === 'skipped').length,
      totalAmount: results
        .filter(r => r.status === 'success')
        .reduce((sum, r) => sum + r.amount, 0),
      results,
    }
  } catch (error: any) {
    console.error('Process payouts error:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process payouts',
    })
  }
})
