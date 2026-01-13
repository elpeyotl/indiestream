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

  const body = await readBody<{ bandId: string }>(event)

  if (!body.bandId) {
    throw createError({
      statusCode: 400,
      message: 'Band ID is required',
    })
  }

  const client = await serverSupabaseClient(event)

  // Verify user owns the band and get Stripe account
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id, owner_id, stripe_account_id')
    .eq('id', body.bandId)
    .single()

  if (bandError || !band) {
    throw createError({
      statusCode: 404,
      message: 'Band not found',
    })
  }

  if (band.owner_id !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not own this band',
    })
  }

  if (!band.stripe_account_id) {
    throw createError({
      statusCode: 400,
      message: 'No Stripe account found. Please create one first.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
  })

  try {
    const accountLink = await stripe.accountLinks.create({
      account: band.stripe_account_id,
      refresh_url: `${config.public.appUrl}/dashboard/artist/${body.bandId}?tab=earnings&refresh=true`,
      return_url: `${config.public.appUrl}/dashboard/artist/${body.bandId}?tab=earnings&connected=true`,
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
