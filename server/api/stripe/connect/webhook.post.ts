// Stripe Connect webhook handler for account updates
import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
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
        const bandId = account.metadata?.band_id

        console.log('Connect account updated:', {
          accountId: account.id,
          bandId,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        })

        if (bandId) {
          // Determine the status
          let status = 'pending'
          if (account.details_submitted && account.payouts_enabled) {
            status = 'active'
          } else if (account.requirements?.disabled_reason) {
            status = 'restricted'
          }

          // Update band's Stripe status
          const { error } = await supabase
            .from('bands')
            .update({
              stripe_account_status: status,
              stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
            })
            .eq('id', bandId)

          if (error) {
            console.error('Failed to update band Stripe status:', error)
          } else {
            console.log(`Band ${bandId} Stripe status updated to: ${status}`)
          }

          // If account is now active, ensure artist_balances record exists
          if (status === 'active') {
            const { error: balanceError } = await supabase
              .from('artist_balances')
              .upsert({
                band_id: bandId,
                balance_cents: 0,
                lifetime_earnings_cents: 0,
              }, { onConflict: 'band_id' })

            if (balanceError) {
              console.error('Failed to create artist balance record:', balanceError)
            }
          }
        } else {
          // Try to find band by stripe_account_id if no metadata
          const { data: band } = await supabase
            .from('bands')
            .select('id')
            .eq('stripe_account_id', account.id)
            .single()

          if (band) {
            let status = 'pending'
            if (account.details_submitted && account.payouts_enabled) {
              status = 'active'
            } else if (account.requirements?.disabled_reason) {
              status = 'restricted'
            }

            await supabase
              .from('bands')
              .update({
                stripe_account_status: status,
                stripe_onboarding_complete: account.details_submitted && account.payouts_enabled,
              })
              .eq('id', band.id)

            console.log(`Band ${band.id} Stripe status updated to: ${status}`)
          }
        }
        break
      }

      case 'account.application.deauthorized': {
        // Artist disconnected their Stripe account
        const account = stripeEvent.data.object as Stripe.Account
        const bandId = account.metadata?.band_id

        if (bandId) {
          await supabase
            .from('bands')
            .update({
              stripe_account_id: null,
              stripe_account_status: 'not_connected',
              stripe_onboarding_complete: false,
            })
            .eq('id', bandId)

          console.log(`Band ${bandId} disconnected Stripe account`)
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
