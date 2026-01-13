// Create Stripe Connect Express account for artist
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

  const body = await readBody<{ bandId: string }>(event)

  if (!body.bandId) {
    throw createError({
      statusCode: 400,
      message: 'Band ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Verify user owns the band
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, name, owner_id, stripe_account_id, stripe_account_status')
    .eq('id', body.bandId)
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

  // If already has an account, return account link instead
  if (band.stripe_account_id) {
    // Check if account needs onboarding completion
    const stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    })

    const account = await stripe.accounts.retrieve(band.stripe_account_id)

    if (account.details_submitted && account.payouts_enabled) {
      return {
        accountId: band.stripe_account_id,
        status: 'active',
        message: 'Account already set up',
      }
    }

    // Need to complete onboarding
    const accountLink = await stripe.accountLinks.create({
      account: band.stripe_account_id,
      refresh_url: `${config.public.appUrl}/dashboard/artist/${body.bandId}?tab=earnings&refresh=true`,
      return_url: `${config.public.appUrl}/dashboard/artist/${body.bandId}?tab=earnings&connected=true`,
      type: 'account_onboarding',
    })

    return {
      accountId: band.stripe_account_id,
      url: accountLink.url,
      status: 'pending',
    }
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  try {
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: {
        band_id: body.bandId,
        supabase_user_id: user.id,
      },
      business_profile: {
        name: band.name,
        product_description: 'Music streaming royalties from Indiestream',
      },
      capabilities: {
        transfers: { requested: true },
      },
    })

    // Update band with Stripe account ID
    const { error: updateError } = await client
      .from('bands')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
      })
      .eq('id', body.bandId)

    if (updateError) {
      console.error('Failed to update band with Stripe account:', updateError)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${config.public.appUrl}/dashboard/artist/${body.bandId}?tab=earnings&refresh=true`,
      return_url: `${config.public.appUrl}/dashboard/artist/${body.bandId}?tab=earnings&connected=true`,
      type: 'account_onboarding',
    })

    return {
      accountId: account.id,
      url: accountLink.url,
      status: 'pending',
    }
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create Stripe Connect account',
    })
  }
})
