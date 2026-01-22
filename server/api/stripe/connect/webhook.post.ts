// Stripe Connect webhook handler for account updates
import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'

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
    // Use Connect webhook secret if available, otherwise fall back to main secret
    const webhookSecret = config.stripeConnectWebhookSecret || config.stripeWebhookSecret
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Connect webhook signature verification failed:', err.message)
    throw createError({
      statusCode: 400,
      message: `Webhook Error: ${err.message}`,
    })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    switch (stripeEvent.type) {
      case 'account.updated': {
        const account = stripeEvent.data.object as Stripe.Account
        const userId = account.metadata?.supabase_user_id

        console.log('Connect account updated:', {
          accountId: account.id,
          userId,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        })

        // Determine the status
        let status = 'pending'
        if (account.details_submitted && account.payouts_enabled) {
          status = 'active'
        } else if (account.requirements?.disabled_reason) {
          status = 'restricted'
        }

        if (userId) {
          // Update user's profile Stripe status
          const { error } = await supabase
            .from('profiles')
            .update({
              stripe_account_status: status,
              stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
            })
            .eq('id', userId)

          if (error) {
            console.error('Failed to update profile Stripe status:', error)
          } else {
            console.log(`User ${userId} Stripe status updated to: ${status}`)
          }

          // If account is now active, ensure artist_balances records exist for all user's bands
          if (status === 'active') {
            const { data: bands } = await supabase
              .from('bands')
              .select('id')
              .eq('owner_id', userId)

            if (bands) {
              for (const band of bands) {
                const { error: balanceError } = await supabase
                  .from('artist_balances')
                  .upsert({
                    band_id: band.id,
                    balance_cents: 0,
                    lifetime_earnings_cents: 0,
                  }, { onConflict: 'band_id' })

                if (balanceError) {
                  console.error(`Failed to create artist balance for band ${band.id}:`, balanceError)
                }
              }
            }
          }
        } else {
          // Try to find user by stripe_account_id if no metadata
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_account_id', account.id)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                stripe_account_status: status,
                stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
              })
              .eq('id', profile.id)

            console.log(`User ${profile.id} Stripe status updated to: ${status}`)
          }
        }
        break
      }

      case 'account.application.deauthorized': {
        // User disconnected their Stripe account
        const application = stripeEvent.data.object as any
        const accountId = typeof application.account === 'string' ? application.account : application.account?.id

        if (accountId) {
          await supabase
            .from('profiles')
            .update({
              stripe_account_id: null,
              stripe_account_status: 'not_connected',
              stripe_onboarding_complete: false,
            })
            .eq('stripe_account_id', accountId)

          console.log(`Stripe account ${accountId} disconnected`)
              })
              .eq('id', profile.id)

            console.log(`User ${profile.id} disconnected Stripe account`)
          }
        }
        break
      }

      case 'payout.paid': {
        // Stripe payout to connected account was successful
        const payout = stripeEvent.data.object as Stripe.Payout
        console.log('Connect payout paid:', payout.id, payout.amount)
        break
      }

      case 'payout.failed': {
        // Stripe payout to connected account failed
        const payout = stripeEvent.data.object as Stripe.Payout
        console.error('Connect payout failed:', payout.id, payout.failure_message)
        break
      }

      default:
        console.log(`Unhandled Connect event type: ${stripeEvent.type}`)
    }

    return { received: true }
  } catch (error: any) {
    console.error('Connect webhook processing error:', error)
    throw createError({
      statusCode: 500,
      message: 'Webhook processing failed',
    })
  }
})
