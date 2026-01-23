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
    // For trials, we use pending_setup_intent to collect payment method
    // For non-trials, we'd use latest_invoice.payment_intent
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: body.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['pending_setup_intent', 'latest_invoice.payment_intent'],
      trial_period_days: 7,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    // With a trial, Stripe creates a SetupIntent (not PaymentIntent) since first charge is $0
    // Without a trial, it creates a PaymentIntent
    let clientSecret: string | null = null

    // Check for SetupIntent (trial case)
    const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent | null
    if (setupIntent?.client_secret) {
      clientSecret = setupIntent.client_secret
    }

    // Fallback to PaymentIntent (non-trial case)
    if (!clientSecret) {
      const invoice = subscription.latest_invoice as Stripe.Invoice & {
        payment_intent: Stripe.PaymentIntent | null
      }
      if (invoice?.payment_intent?.client_secret) {
        clientSecret = invoice.payment_intent.client_secret
      }
    }

    if (!clientSecret) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create payment intent for subscription',
      })
    }

    return {
      subscriptionId: subscription.id,
      clientSecret,
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
