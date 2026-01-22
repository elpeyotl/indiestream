// Generate new account link for incomplete Stripe Connect onboarding
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
    .select('id, stripe_account_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw createError({
      statusCode: 404,
      message: 'Profile not found',
    })
  }

  if (!profile.stripe_account_id) {
    throw createError({
      statusCode: 400,
      message: 'No Stripe account found. Please create one first.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: `${config.public.appUrl}/dashboard/earnings?refresh=true`,
      return_url: `${config.public.appUrl}/dashboard/earnings?connected=true`,
      type: 'account_onboarding',
    })

    return {
      url: accountLink.url,
    }
  } catch (error: any) {
    console.error('Stripe account link error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create account link',
    })
  }
})
