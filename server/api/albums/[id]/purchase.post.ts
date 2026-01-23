// POST /api/albums/[id]/purchase - Create PaymentIntent for album purchase
import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Please log in to purchase albums',
    })
  }

  const albumId = getRouterParam(event, 'id')
  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'Album ID is required',
    })
  }

  const body = await readBody<{ amount_cents?: number }>(event)
  const client = await serverSupabaseServiceRole(event)

  // Get album with band info
  const { data: album, error: albumError } = await client
    .from('albums')
    .select(`
      id,
      title,
      purchasable,
      price_cents,
      pay_what_you_want,
      minimum_price_cents,
      band_id,
      band:bands!band_id (
        id,
        name,
        owner_id
      )
    `)
    .eq('id', albumId)
    .eq('is_published', true)
    .single()

  if (albumError || !album) {
    throw createError({
      statusCode: 404,
      message: 'Album not found',
    })
  }

  if (!album.purchasable) {
    throw createError({
      statusCode: 400,
      message: 'This album is not available for purchase',
    })
  }

  // Check if user already owns this album
  const { data: existingPurchase } = await client
    .from('purchases')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('album_id', albumId)
    .eq('status', 'completed')
    .single()

  if (existingPurchase) {
    throw createError({
      statusCode: 400,
      message: 'You already own this album',
    })
  }

  // Determine the amount
  let amountCents: number

  if (album.pay_what_you_want) {
    // Pay what you want - use provided amount or minimum
    const minimumCents = album.minimum_price_cents || 100
    amountCents = body.amount_cents || minimumCents

    if (amountCents < minimumCents) {
      throw createError({
        statusCode: 400,
        message: `Minimum price is ${(minimumCents / 100).toFixed(2)} CHF`,
      })
    }
  } else {
    // Fixed price
    if (!album.price_cents) {
      throw createError({
        statusCode: 400,
        message: 'Album price not configured',
      })
    }
    amountCents = album.price_cents
  }

  // Calculate revenue split (85% artist, 15% platform)
  const artistShareCents = Math.round(amountCents * 0.85)
  const platformFeeCents = amountCents - artistShareCents

  // Get artist's Stripe Connect account
  const band = album.band as { id: string; name: string; owner_id: string }
  const { data: artistProfile } = await client
    .from('profiles')
    .select('stripe_account_id, stripe_account_status')
    .eq('id', band.owner_id)
    .single()

  if (!artistProfile?.stripe_account_id || artistProfile.stripe_account_status !== 'active') {
    throw createError({
      statusCode: 400,
      message: 'Artist has not set up payments yet',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create PaymentIntent with automatic transfer to artist
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'chf',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: artistProfile.stripe_account_id,
        amount: artistShareCents,
      },
      metadata: {
        type: 'album_purchase',
        supabase_user_id: user.id,
        album_id: albumId,
        album_title: album.title,
        band_id: band.id,
        band_name: band.name,
        artist_share_cents: artistShareCents.toString(),
        platform_fee_cents: platformFeeCents.toString(),
      },
    })

    // Create pending purchase record
    const { error: purchaseError } = await client.from('purchases').insert({
      user_id: user.id,
      album_id: albumId,
      band_id: band.id,
      amount_cents: amountCents,
      artist_share_cents: artistShareCents,
      platform_fee_cents: platformFeeCents,
      currency: 'CHF',
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })

    if (purchaseError) {
      // If it's a unique violation, the user may have a pending purchase
      if (purchaseError.code === '23505') {
        // Update existing pending purchase
        await client
          .from('purchases')
          .update({
            amount_cents: amountCents,
            artist_share_cents: artistShareCents,
            platform_fee_cents: platformFeeCents,
            stripe_payment_intent_id: paymentIntent.id,
            status: 'pending',
          })
          .eq('user_id', user.id)
          .eq('album_id', albumId)
      } else {
        console.error('Failed to create purchase record:', purchaseError)
        throw createError({
          statusCode: 500,
          message: 'Failed to create purchase',
        })
      }
    }

    return {
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
      currency: 'CHF',
    }
  } catch (error: any) {
    console.error('Stripe purchase error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create payment',
    })
  }
})
