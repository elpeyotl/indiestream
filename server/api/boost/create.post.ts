// POST /api/boost/create - Create an Artist Boost subscription
// Only available to active subscribers
import Stripe from 'stripe'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface CreateBoostRequest {
  amountCents: number // 500, 1000, or 2000
}

const BOOST_TIERS: Record<number, string | undefined> = {
  500: process.env.STRIPE_BOOST_PRICE_5,
  1000: process.env.STRIPE_BOOST_PRICE_10,
  2000: process.env.STRIPE_BOOST_PRICE_20,
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody<CreateBoostRequest>(event)

  // Validate amount
  const priceId = BOOST_TIERS[body.amountCents]
  if (!priceId) {
    throw createError({
      statusCode: 400,
      message: 'Invalid boost amount. Choose $5, $10, or $20.',
    })
  }

  const client = await serverSupabaseClient(event)

  // Check if user has an active subscription
  const { data: subscription } = await client
    .from('subscriptions')
    .select('stripe_customer_id, status')
    .eq('user_id', user.id)
    .single()

  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    throw createError({
      statusCode: 403,
      message: 'Artist Boost is only available to active subscribers.',
    })
  }

  if (!subscription.stripe_customer_id) {
    throw createError({
      statusCode: 400,
      message: 'No payment method on file. Please update your subscription first.',
    })
  }

  // Check if user already has an active boost
  const { data: existingBoost } = await client
    .from('artist_boosts')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (existingBoost && existingBoost.status === 'active') {
    throw createError({
      statusCode: 400,
      message: 'You already have an active Artist Boost. Update or cancel it first.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Create the boost subscription
    const boostSubscription = await stripe.subscriptions.create({
      customer: subscription.stripe_customer_id,
      items: [{ price: priceId }],
      metadata: {
        type: 'artist_boost',
        supabase_user_id: user.id,
      },
      // Use the customer's default payment method
      default_payment_method: undefined, // Uses customer's default
      payment_behavior: 'error_if_incomplete',
    }) as any

    // Create or update boost record
    const { error: boostError } = await client.from('artist_boosts').upsert({
      user_id: user.id,
      stripe_subscription_id: boostSubscription.id,
      amount_cents: body.amountCents,
      status: boostSubscription.status,
      current_period_start: boostSubscription.current_period_start
        ? new Date(boostSubscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: boostSubscription.current_period_end
        ? new Date(boostSubscription.current_period_end * 1000).toISOString()
        : null,
    }, { onConflict: 'user_id' })

    if (boostError) {
      console.error('Failed to create boost record:', boostError)
      // Cancel the Stripe subscription since we couldn't record it
      await stripe.subscriptions.cancel(boostSubscription.id)
      throw createError({ statusCode: 500, message: 'Failed to create boost' })
    }

    return {
      success: true,
      boost: {
        id: boostSubscription.id,
        amount_cents: body.amountCents,
        status: boostSubscription.status,
      },
    }
  } catch (error: any) {
    console.error('Stripe boost error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create Artist Boost',
    })
  }
})
