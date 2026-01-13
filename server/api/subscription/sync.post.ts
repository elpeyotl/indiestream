// Sync subscription status from Stripe (for when webhook fails)
import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // Get the subscription record
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!existingSub?.stripe_customer_id) {
      // No customer ID, try to find by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      })

      if (customers.data.length === 0) {
        return { synced: false, message: 'No Stripe customer found' }
      }

      // Found customer, get their subscriptions
      const customerId = customers.data[0].id
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1,
      })

      if (subscriptions.data.length === 0) {
        return { synced: false, message: 'No Stripe subscription found' }
      }

      const subscription = subscriptions.data[0]

      // Update the database
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          plan: 'listener',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription.trial_end || subscription.current_period_end) * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, { onConflict: 'user_id' })

      if (upsertError) {
        console.error('Failed to sync subscription:', upsertError)
        throw createError({ statusCode: 500, statusMessage: 'Failed to sync subscription' })
      }

      return {
        synced: true,
        status: subscription.status,
        subscriptionId: subscription.id,
      }
    }

    // Has customer ID, get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: existingSub.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      return { synced: false, message: 'No Stripe subscription found for customer' }
    }

    const subscription = subscriptions.data[0]

    // Update the database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription.trial_end || subscription.current_period_end) * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update subscription:', updateError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to update subscription' })
    }

    return {
      synced: true,
      status: subscription.status,
      subscriptionId: subscription.id,
    }
  } catch (error: any) {
    console.error('Sync subscription error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to sync subscription',
    })
  }
})
