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

  const supabase = await serverSupabaseClient(event)

  // Get user's Stripe customer ID from subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.stripe_customer_id) {
    throw createError({
      statusCode: 404,
      message: 'No subscription found',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Use the request origin for local development
    const origin = getHeader(event, 'origin') || config.public.appUrl

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    })

    return {
      url: session.url,
    }
  } catch (error: any) {
    console.error('Stripe portal error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create portal session',
    })
  }
})
