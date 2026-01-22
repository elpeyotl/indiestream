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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: `${config.public.appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.appUrl}/pricing`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
        trial_period_days: 7,
      },
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return {
      sessionId: session.id,
      url: session.url,
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create checkout session',
    })
  }
})
