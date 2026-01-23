// POST /api/tips/create - Create a tip checkout session for an artist
// Anyone can tip (guest checkout supported)
import Stripe from 'stripe'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

interface TipRequest {
  bandId: string
  amountCents: number
  message?: string
  isAnonymous?: boolean
  tipperName?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<TipRequest>(event)

  // Validate input
  if (!body.bandId) {
    throw createError({ statusCode: 400, message: 'Band ID is required' })
  }

  if (!body.amountCents || body.amountCents < 100) {
    throw createError({ statusCode: 400, message: 'Minimum tip amount is $1' })
  }

  if (body.amountCents > 50000) {
    throw createError({ statusCode: 400, message: 'Maximum tip amount is $500' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  // Get band info for the checkout description
  const { data: band, error: bandError } = await supabase
    .from('bands')
    .select('id, name, slug, owner_id')
    .eq('id', body.bandId)
    .single()

  if (bandError || !band) {
    throw createError({ statusCode: 404, message: 'Artist not found' })
  }

  // Check if user is logged in (optional)
  let user = null
  try {
    user = await serverSupabaseUser(event)
  } catch {
    // Guest tip - that's fine
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  // Get the origin for return URLs
  const origin = getHeader(event, 'origin') || config.public.appUrl

  try {
    // Create the tip record first (pending status)
    const { data: tip, error: tipError } = await supabase
      .from('artist_tips')
      .insert({
        band_id: body.bandId,
        tipper_id: user?.id || null,
        tipper_name: body.tipperName || null,
        amount_cents: body.amountCents,
        message: body.message || null,
        is_anonymous: body.isAnonymous || false,
        status: 'pending',
      })
      .select('id')
      .single()

    if (tipError) {
      console.error('Failed to create tip record:', tipError)
      throw createError({ statusCode: 500, message: 'Failed to create tip' })
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: body.amountCents,
            product_data: {
              name: `Tip for ${band.name}`,
              description: '100% goes to the artist (minus payment processing)',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'artist_tip',
        tip_id: tip.id,
        band_id: body.bandId,
        band_name: band.name,
        tipper_id: user?.id || '',
        is_anonymous: body.isAnonymous ? 'true' : 'false',
      },
      success_url: `${origin}/${band.slug}?tip=success`,
      cancel_url: `${origin}/${band.slug}?tip=cancelled`,
      // Allow guest checkout
      customer_creation: user ? undefined : 'always',
      // Pre-fill email if logged in
      customer_email: user?.email || undefined,
    })

    // Update tip record with checkout session ID
    await supabase
      .from('artist_tips')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', tip.id)

    return {
      checkoutUrl: session.url,
      tipId: tip.id,
    }
  } catch (error: any) {
    console.error('Stripe checkout error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create checkout session',
    })
  }
})
