import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendWelcomeEmail, sendSubscriptionConfirmedEmail, sendPaymentFailedEmail } from '~/server/utils/email'

// Helper to safely convert Unix timestamp to ISO string
const toISOString = (timestamp: number | undefined | null): string | null => {
  if (!timestamp) return null
  return new Date(timestamp * 1000).toISOString()
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  // Get raw body for signature verification
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      message: 'Missing body or signature',
    })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripeWebhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    throw createError({
      statusCode: 400,
      message: `Webhook Error: ${err.message}`,
    })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        console.log('Checkout completed:', { userId, customerId, subscriptionId })

        if (userId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any

          const { error: upsertError } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            plan: 'listener',
            current_period_start: toISOString(subscription.current_period_start),
            current_period_end: toISOString(subscription.current_period_end),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: 'user_id' })

          if (upsertError) {
            console.error('Failed to upsert subscription:', upsertError)
          } else {
            console.log('Subscription created/updated successfully')

            // Send welcome and subscription emails
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, display_name')
              .eq('id', userId)
              .single()

            if (profile?.email) {
              const periodEndDate = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''

              // Get invoice amount
              const invoiceAmount = session.amount_total ? session.amount_total / 100 : 9.99

              try {
                // Send welcome email
                await sendWelcomeEmail({
                  to: profile.email,
                  userName: profile.display_name || 'Listener',
                  subscriptionTier: 'listener',
                })

                // Send subscription confirmation
                await sendSubscriptionConfirmedEmail({
                  to: profile.email,
                  userName: profile.display_name || 'Listener',
                  tier: 'Listener',
                  amount: invoiceAmount,
                  currency: (session.currency || 'chf').toUpperCase(),
                  periodEnd: periodEndDate,
                })
              } catch (emailError) {
                console.error('Failed to send subscription emails:', emailError)
              }
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as any

        // Try to get userId from metadata first, otherwise look up by subscription ID
        let userId = subscription.metadata?.supabase_user_id

        if (!userId) {
          const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          userId = existingSub?.user_id
        }

        if (userId) {
          // For trial subscriptions, use trial_end as the period end
          const periodEnd = subscription.trial_end || subscription.current_period_end

          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_start: toISOString(subscription.current_period_start || subscription.trial_start),
            current_period_end: toISOString(periodEnd),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: 'user_id' })

          console.log('Subscription updated:', {
            userId,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: toISOString(periodEnd),
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription

        // Update by subscription ID since metadata may not be available
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        console.log('Subscription deleted:', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
          const userId = subscription.metadata?.supabase_user_id

          if (userId) {
            await supabase.from('subscriptions').upsert({
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              status: subscription.status,
              current_period_start: toISOString(subscription.current_period_start),
              current_period_end: toISOString(subscription.current_period_end),
            }, { onConflict: 'user_id' })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id

        if (subscriptionId) {
          // Get the subscription to find the user
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (sub) {
            await supabase
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('user_id', sub.user_id)

            // Send payment failed email
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, display_name')
              .eq('id', sub.user_id)
              .single()

            if (profile?.email) {
              const invoiceAmount = invoice.amount_due ? invoice.amount_due / 100 : 9.99
              const config = useRuntimeConfig()

              try {
                await sendPaymentFailedEmail({
                  to: profile.email,
                  userName: profile.display_name || 'Listener',
                  amount: invoiceAmount,
                  currency: (invoice.currency || 'chf').toUpperCase(),
                  updatePaymentUrl: `${config.public.appUrl}/settings/billing`,
                })
              } catch (emailError) {
                console.error('Failed to send payment failed email:', emailError)
              }
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`)
    }

    return { received: true }
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    throw createError({
      statusCode: 500,
      message: 'Webhook processing failed',
    })
  }
})
