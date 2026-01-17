// Create Stripe Connect Express account for user (covers all their bands)
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

  const client = await serverSupabaseClient(event)

  // Get user's profile with Stripe info
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, display_name, stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw createError({
      statusCode: 404,
      message: 'Profile not found',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  // If already has an account, return account link for completion or status
  if (profile.stripe_account_id) {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)

    if (account.details_submitted && account.payouts_enabled) {
      return {
        accountId: profile.stripe_account_id,
        status: 'active',
        message: 'Account already set up',
      }
    }

    // Need to complete onboarding
    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: `${config.public.appUrl}/dashboard/earnings?refresh=true`,
      return_url: `${config.public.appUrl}/dashboard/earnings?connected=true`,
      type: 'account_onboarding',
    })

    return {
      accountId: profile.stripe_account_id,
      url: accountLink.url,
      status: 'pending',
    }
  }

  try {
    // Create Express account for the user
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
      business_profile: {
        name: profile.display_name || user.email,
        product_description: 'Music streaming royalties from Fairstream',
      },
      capabilities: {
        transfers: { requested: true },
      },
    })

    // Update profile with Stripe account ID
    const { error: updateError } = await client
      .from('profiles')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update profile with Stripe account:', updateError)
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${config.public.appUrl}/dashboard/earnings?refresh=true`,
      return_url: `${config.public.appUrl}/dashboard/earnings?connected=true`,
      type: 'account_onboarding',
    })

    return {
      accountId: account.id,
      url: accountLink.url,
      status: 'pending',
    }
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create Stripe Connect account',
    })
  }
})
