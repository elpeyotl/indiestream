import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendWelcomeEmail, sendSubscriptionConfirmedEmail, sendPaymentFailedEmail, sendPurchaseConfirmationEmail } from '~/server/utils/email'

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

        // Handle artist tips
        if (session.metadata?.type === 'artist_tip') {
          const tipId = session.metadata.tip_id
          const bandId = session.metadata.band_id
          const bandName = session.metadata.band_name

          console.log('Artist tip completed:', { tipId, bandId, sessionId: session.id })

          // Calculate net amount (after Stripe fees ~2.9% + $0.30)
          const grossAmount = session.amount_total || 0
          const stripeFee = Math.ceil(grossAmount * 0.029 + 30) // Estimate
          const netAmount = Math.max(0, grossAmount - stripeFee)

          // Update tip status to completed
          const { error: tipError } = await supabase
            .from('artist_tips')
            .update({
              status: 'completed',
              net_amount_cents: netAmount,
              stripe_payment_intent_id: session.payment_intent as string,
              tipper_email: session.customer_details?.email || null,
            })
            .eq('id', tipId)

          if (tipError) {
            console.error('Failed to update tip status:', tipError)
          } else {
            console.log('Tip marked as completed:', { tipId, grossAmount, netAmount })

            // Credit artist balance with net amount
            // Get existing balance for this band
            const { data: existingBalance } = await supabase
              .from('artist_balances')
              .select('balance_cents, lifetime_earnings_cents')
              .eq('band_id', bandId)
              .single()

            if (existingBalance) {
              // Update existing balance
              const { error: updateError } = await supabase
                .from('artist_balances')
                .update({
                  balance_cents: existingBalance.balance_cents + netAmount,
                  lifetime_earnings_cents: existingBalance.lifetime_earnings_cents + netAmount,
                  updated_at: new Date().toISOString(),
                })
                .eq('band_id', bandId)

              if (updateError) {
                console.error('Failed to update artist balance:', updateError)
              } else {
                console.log('Artist balance credited (tip):', { bandId, netAmount })
              }
            } else {
              // Create new balance record
              const { error: insertError } = await supabase
                .from('artist_balances')
                .insert({
                  band_id: bandId,
                  balance_cents: netAmount,
                  lifetime_earnings_cents: netAmount,
                })

              if (insertError) {
                console.error('Failed to create artist balance:', insertError)
              } else {
                console.log('Artist balance created (tip):', { bandId, netAmount })
              }
            }
          }
          break
        }

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
        const isCreated = stripeEvent.type === 'customer.subscription.created'

        // Check if this is an Artist Boost subscription
        if (subscription.metadata?.type === 'artist_boost') {
          const userId = subscription.metadata.supabase_user_id
          if (userId) {
            // Get the price amount from the subscription item
            const amountCents = subscription.items?.data?.[0]?.price?.unit_amount || 0

            await supabase.from('artist_boosts').upsert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              amount_cents: amountCents,
              status: subscription.status,
              current_period_start: toISOString(subscription.current_period_start),
              current_period_end: toISOString(subscription.current_period_end),
            }, { onConflict: 'user_id' })

            console.log('Artist boost updated:', {
              userId,
              status: subscription.status,
              amountCents,
            })
          }
          break
        }

        // Regular subscription handling
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
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            plan: 'listener',
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

          // Send welcome/confirmation emails for new subscriptions (trialing or active)
          if (isCreated && (subscription.status === 'trialing' || subscription.status === 'active')) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, display_name')
              .eq('id', userId)
              .single()

            if (profile?.email) {
              const periodEndDate = periodEnd
                ? new Date(periodEnd * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''

              const isTrial = subscription.status === 'trialing'

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
                  tier: isTrial ? 'Listener (7-day trial)' : 'Listener',
                  amount: 9.99,
                  currency: 'USD',
                  periodEnd: periodEndDate,
                })

                console.log('Sent subscription emails to:', profile.email)
              } catch (emailError) {
                console.error('Failed to send subscription emails:', emailError)
              }
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription

        // Check if this is an Artist Boost subscription
        const subMetadata = (subscription as any).metadata
        if (subMetadata?.type === 'artist_boost') {
          await supabase
            .from('artist_boosts')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', subscription.id)

          console.log('Artist boost canceled:', subscription.id)
          break
        }

        // Regular subscription deletion
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

      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent

        // Check if this is an album purchase
        if (paymentIntent.metadata?.type === 'album_purchase') {
          const userId = paymentIntent.metadata.supabase_user_id
          const albumId = paymentIntent.metadata.album_id
          const albumTitle = paymentIntent.metadata.album_title
          const bandName = paymentIntent.metadata.band_name

          console.log('Album purchase completed:', {
            userId,
            albumId,
            paymentIntentId: paymentIntent.id,
          })

          // Update purchase status to completed and get purchase details
          const { data: purchase, error: updateError } = await supabase
            .from('purchases')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntent.id)
            .select('band_id, artist_share_cents')
            .single()

          if (updateError) {
            console.error('Failed to update purchase status:', updateError)
          } else {
            console.log('Purchase marked as completed')

            // Credit artist balance with their share
            if (purchase?.band_id && purchase?.artist_share_cents > 0) {
              const { data: existingBalance } = await supabase
                .from('artist_balances')
                .select('balance_cents, lifetime_earnings_cents')
                .eq('band_id', purchase.band_id)
                .single()

              if (existingBalance) {
                // Update existing balance
                const { error: balanceError } = await supabase
                  .from('artist_balances')
                  .update({
                    balance_cents: existingBalance.balance_cents + purchase.artist_share_cents,
                    lifetime_earnings_cents: existingBalance.lifetime_earnings_cents + purchase.artist_share_cents,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('band_id', purchase.band_id)

                if (balanceError) {
                  console.error('Failed to update artist balance (purchase):', balanceError)
                } else {
                  console.log('Artist balance credited (purchase):', { bandId: purchase.band_id, amount: purchase.artist_share_cents })
                }
              } else {
                // Create new balance record
                const { error: insertError } = await supabase
                  .from('artist_balances')
                  .insert({
                    band_id: purchase.band_id,
                    balance_cents: purchase.artist_share_cents,
                    lifetime_earnings_cents: purchase.artist_share_cents,
                  })

                if (insertError) {
                  console.error('Failed to create artist balance (purchase):', insertError)
                } else {
                  console.log('Artist balance created (purchase):', { bandId: purchase.band_id, amount: purchase.artist_share_cents })
                }
              }
            }

            // Send purchase confirmation email
            if (userId) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, display_name')
                .eq('id', userId)
                .single()

              if (profile?.email) {
                const amount = paymentIntent.amount / 100
                const currency = (paymentIntent.currency || 'chf').toUpperCase()
                const config = useRuntimeConfig()

                try {
                  await sendPurchaseConfirmationEmail({
                    to: profile.email,
                    userName: profile.display_name || 'Music Lover',
                    albumTitle: albumTitle || 'Album',
                    artistName: bandName || 'Artist',
                    amount,
                    currency,
                    downloadUrl: `${config.public.appUrl}/library/purchases`,
                  })
                } catch (emailError) {
                  console.error('Failed to send purchase confirmation email:', emailError)
                }
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
