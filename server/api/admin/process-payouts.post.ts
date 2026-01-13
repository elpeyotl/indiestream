// Admin: Process Stripe transfers for artists with balance >= minimum
import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

interface ProcessPayoutsRequest {
  bandIds?: string[] // Optional: specific bands to pay out
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
    apiVersion: '2025-02-24.acacia',
  })

  try {
    // Get artists with balance >= minimum and active Stripe accounts
    let query = serviceClient
      .from('artist_balances')
      .select(`
        band_id,
        balance_cents,
        bands!inner (
          id,
          name,
          stripe_account_id,
          stripe_account_status
        )
      `)
      .gte('balance_cents', MINIMUM_PAYOUT_CENTS)

    if (body.bandIds && body.bandIds.length > 0) {
      query = query.in('band_id', body.bandIds)
    }

    const { data: eligibleArtists, error: queryError } = await query

    if (queryError) {
      console.error('Failed to fetch eligible artists:', queryError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch eligible artists' })
    }

    if (!eligibleArtists || eligibleArtists.length === 0) {
      return {
        message: 'No artists eligible for payout',
        processed: 0,
        failed: 0,
        results: [],
      }
    }

    const results: Array<{
      bandId: string
      bandName: string
      amount: number
      status: 'success' | 'failed' | 'skipped'
      error?: string
      transferId?: string
    }> = []

    let processed = 0
    let failed = 0

    for (const artist of eligibleArtists) {
      const band = artist.bands as any
      const bandId = artist.band_id
      const bandName = band?.name || 'Unknown'
      const stripeAccountId = band?.stripe_account_id
      const stripeStatus = band?.stripe_account_status
      const amount = artist.balance_cents

      // Skip if no Stripe account or not active
      if (!stripeAccountId || stripeStatus !== 'active') {
        results.push({
          bandId,
          bandName,
          amount,
          status: 'skipped',
          error: stripeAccountId ? 'Stripe account not active' : 'No Stripe account connected',
        })
        continue
      }

      try {
        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount,
          currency: 'usd',
          destination: stripeAccountId,
          description: `Indiestream payout for ${bandName}`,
          metadata: {
            band_id: bandId,
            payout_date: new Date().toISOString(),
          },
        })

        // Create payout record
        const { error: payoutError } = await serviceClient
          .from('payouts')
          .insert({
            band_id: bandId,
            amount_cents: amount,
            stripe_transfer_id: transfer.id,
            status: 'completed',
            processed_at: new Date().toISOString(),
          })

        if (payoutError) {
          console.error('Failed to record payout:', payoutError)
        }

        // Update artist balance
        await serviceClient
          .from('artist_balances')
          .update({
            balance_cents: 0,
            last_payout_at: new Date().toISOString(),
          })
          .eq('band_id', bandId)

        // Update band total earnings
        await serviceClient
          .from('bands')
          .update({
            total_earnings_cents: serviceClient.sql`total_earnings_cents + ${amount}`,
          })
          .eq('id', bandId)

        results.push({
          bandId,
          bandName,
          amount,
          status: 'success',
          transferId: transfer.id,
        })

        processed++
        console.log(`Payout successful: ${bandName} - $${(amount / 100).toFixed(2)} - ${transfer.id}`)
      } catch (stripeError: any) {
        console.error(`Stripe transfer failed for ${bandName}:`, stripeError)

        // Record failed payout
        await serviceClient
          .from('payouts')
          .insert({
            band_id: bandId,
            amount_cents: amount,
            status: 'failed',
            error_message: stripeError.message,
          })

        results.push({
          bandId,
          bandName,
          amount,
          status: 'failed',
          error: stripeError.message,
        })

        failed++
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
