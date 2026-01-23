// POST /api/stripe/create-subscription - Create incomplete subscription for inline payment
import Stripe from 'stripe'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized - please log in',
    })
  }

  const body = await readBody<{ priceId: string }>(event)

  if (!body.priceId) {
    throw createError({
      statusCode: 400,
      message: 'Price ID is required',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Check if customer already has an active subscription
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (existingSubscriptions.data.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'You already have an active subscription',
      })
    }

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'trialing',
      limit: 1,
    })

    if (trialingSubscriptions.data.length > 0) {
      throw createError({
        statusCode: 400,
        message: 'You already have an active subscription',
      })
    }

    // Create subscription with incomplete status
    // The subscription will be activated when payment succeeds
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: body.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: 7,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    // Get the client secret from the PaymentIntent on the first invoice
    // When expanded, latest_invoice is an Invoice object with payment_intent as PaymentIntent
    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      payment_intent: Stripe.PaymentIntent | null
    }
    const paymentIntent = invoice?.payment_intent

    if (!paymentIntent?.client_secret) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create payment intent for subscription',
      })
    }

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      trialEnd: subscription.trial_end,
    }
  } catch (error: any) {
    console.error('Stripe subscription error:', error)

    // Re-throw if it's already a createError
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create subscription',
    })
  }
})
