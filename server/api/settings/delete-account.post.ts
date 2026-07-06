// Account self-deletion (GDPR/nDSG right to erasure).
// Deletes the authenticated user's own account and all dependent data via
// the shared delete flow. Blocked while the user has unpaid artist earnings
// so balances aren't orphaned before payout.
import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { deleteUserData, getUnpaidArtistBalanceCents } from '~/server/utils/deleteUserAccount'
import { enforceRateLimit } from '~/server/utils/rateLimit'

interface DeleteAccountBody {
  /** Must match the account email — the UI asks the user to type it */
  confirmation: string
}

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    max: 5,
    windowMs: 60 * 60 * 1000,
    message: 'Too many attempts. Please try again later.',
  })

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<DeleteAccountBody>(event)
  if (!body?.confirmation || body.confirmation.trim().toLowerCase() !== user.email?.toLowerCase()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Confirmation does not match your account email',
    })
  }

  const serviceClient = serverSupabaseServiceRole(event)

  // Admins must not remove themselves through this flow (mirrors the
  // self-delete guard in the admin endpoint).
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin accounts cannot be deleted here. Ask another admin to remove your account.',
    })
  }

  // Block deletion while artist earnings are outstanding
  const unpaidCents = await getUnpaidArtistBalanceCents(serviceClient, user.id)
  if (unpaidCents > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `You have unpaid artist earnings of CHF ${(unpaidCents / 100).toFixed(2)}. Please wait for your payout before deleting your account.`,
    })
  }

  // Cancel any active Stripe subscription first so the user isn't billed
  // after the account is gone. Abort deletion if cancellation fails.
  const { data: subscription } = await serviceClient
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subscription?.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(subscription.status)) {
    const config = useRuntimeConfig()
    try {
      const stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      })
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
    } catch (e) {
      // "Already canceled" is fine; anything else must block deletion
      if ((e as { code?: string })?.code !== 'resource_missing') {
        console.error('Failed to cancel Stripe subscription during account deletion:', e)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to cancel your subscription. Please cancel it manually and try again.',
        })
      }
    }
  }

  try {
    await deleteUserData(serviceClient, user.id)
    return { success: true, message: 'Account deleted' }
  } catch (e) {
    console.error('Account self-deletion failed:', e)
    throw createError({
      statusCode: 500,
      statusMessage: (e as { statusMessage?: string })?.statusMessage || 'Failed to delete account',
    })
  }
})
