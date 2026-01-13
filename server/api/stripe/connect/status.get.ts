// Get Stripe Connect account status for a band
import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - please log in',
    })
  }

  const query = getQuery(event)
  const bandId = query.bandId as string

  if (!bandId) {
    throw createError({
      statusCode: 400,
      message: 'Band ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Verify user owns the band
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, owner_id, stripe_account_id, stripe_account_status')
    .eq('id', bandId)
    .single()

  if (bandError || !band) {
    throw createError({
      statusCode: 404,
      message: 'Band not found',
    })
  }

  if (band.owner_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not own this band',
    })
  }

  if (!band.stripe_account_id) {
    return {
      status: 'not_connected',
      accountId: null,
      payoutsEnabled: false,
      chargesEnabled: false,
      detailsSubmitted: false,
    }
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  try {
    const account = await stripe.accounts.retrieve(band.stripe_account_id)

    // Determine status
    let status = 'pending'
    if (account.details_submitted && account.payouts_enabled) {
      status = 'active'
    } else if (account.requirements?.disabled_reason) {
      status = 'restricted'
    }

    // Update status in database if it changed
    if (status !== band.stripe_account_status) {
      await client
        .from('bands')
        .update({ stripe_account_status: status })
        .eq('id', bandId)
    }

    return {
      status,
      accountId: band.stripe_account_id,
      payoutsEnabled: account.payouts_enabled || false,
      chargesEnabled: account.charges_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirements: account.requirements?.currently_due || [],
      disabledReason: account.requirements?.disabled_reason || null,
    }
  } catch (error: any) {
    console.error('Stripe status check error:', error)

    // If account doesn't exist, reset the band's stripe fields
    if (error.code === 'account_invalid') {
      await client
        .from('bands')
        .update({
          stripe_account_id: null,
          stripe_account_status: 'not_connected',
        })
        .eq('id', bandId)

      return {
        status: 'not_connected',
        accountId: null,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
      }
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to check account status',
    })
  }
})
