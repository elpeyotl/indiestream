// POST /api/boost/update - Update Artist Boost tier
import Stripe from 'stripe'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface UpdateBoostRequest {
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

  const body = await readBody<UpdateBoostRequest>(event)

  // Validate amount
  const newPriceId = BOOST_TIERS[body.amountCents]
  if (!newPriceId) {
    throw createError({
      statusCode: 400,
      message: 'Invalid boost amount. Choose $5, $10, or $20.',
    })
  }

  const client = await serverSupabaseClient(event)

  // Get existing boost
  const { data: boost } = await client
    .from('artist_boosts')
    .select('stripe_subscription_id, amount_cents, status')
    .eq('user_id', user.id)
    .single()

  if (!boost || boost.status !== 'active') {
    throw createError({
      statusCode: 404,
      message: 'No active boost found. Create one first.',
    })
  }

  if (boost.amount_cents === body.amountCents) {
    throw createError({
      statusCode: 400,
      message: 'This is already your current boost amount.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Get the subscription to find the item ID
    const subscription = await stripe.subscriptions.retrieve(boost.stripe_subscription_id!)

    if (!subscription.items.data.length) {
      throw createError({ statusCode: 500, message: 'Invalid subscription state' })
    }

    const subscriptionItemId = subscription.items.data[0].id

    // Update the subscription with new price
    // proration_behavior: 'always_invoice' means the change takes effect immediately
    // and any price difference is charged/credited right away
    const updatedSubscription = await stripe.subscriptions.update(boost.stripe_subscription_id!, {
      items: [
        {
          id: subscriptionItemId,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
      metadata: {
        type: 'artist_boost',
        supabase_user_id: user.id,
      },
    })

    // Update local record
    await client.from('artist_boosts').update({
      amount_cents: body.amountCents,
    }).eq('user_id', user.id)

    return {
      success: true,
      boost: {
        amount_cents: body.amountCents,
        status: updatedSubscription.status,
      },
    }
  } catch (error: any) {
    console.error('Stripe boost update error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update Artist Boost',
    })
  }
})
