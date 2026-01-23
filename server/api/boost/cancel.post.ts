// POST /api/boost/cancel - Cancel Artist Boost subscription
import Stripe from 'stripe'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  // Get existing boost
  const { data: boost } = await client
    .from('artist_boosts')
    .select('stripe_subscription_id, status')
    .eq('user_id', user.id)
    .single()

  if (!boost || !boost.stripe_subscription_id) {
    throw createError({
      statusCode: 404,
      message: 'No boost subscription found.',
    })
  }

  if (boost.status === 'canceled') {
    throw createError({
      statusCode: 400,
      message: 'Boost is already canceled.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Cancel the subscription at period end (so they keep boost until paid period expires)
    const canceledSubscription = await stripe.subscriptions.update(boost.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Note: We don't update the local status to 'canceled' yet
    // That will happen via webhook when the subscription actually ends
    // For now, just return the updated state

    return {
      success: true,
      message: 'Your Artist Boost will be canceled at the end of your current billing period.',
      cancelAt: canceledSubscription.cancel_at
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null,
    }
  } catch (error: any) {
    console.error('Stripe boost cancel error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to cancel Artist Boost',
    })
  }
})
