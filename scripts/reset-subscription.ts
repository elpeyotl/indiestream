// Script to reset a user's subscription and purchases for testing
// Usage: npx tsx scripts/reset-subscription.ts <email>

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') })

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/reset-subscription.ts <email>')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
  console.error('Missing environment variables. Make sure SUPABASE_URL, SUPABASE_SERVICE_KEY, and STRIPE_SECRET_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey)

async function resetSubscription() {
  console.log(`\nResetting subscription for: ${email}\n`)

  // 1. Find user in Supabase
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    console.error('User not found in Supabase:', profileError?.message)
    process.exit(1)
  }

  console.log(`Found user: ${profile.id}`)

  // 2. Delete subscription from Supabase
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  if (subscription) {
    console.log(`Found subscription in Supabase:`, {
      status: subscription.status,
      plan: subscription.plan,
      stripe_subscription_id: subscription.stripe_subscription_id,
    })

    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', profile.id)

    if (deleteError) {
      console.error('Failed to delete subscription from Supabase:', deleteError.message)
    } else {
      console.log('✓ Deleted subscription from Supabase')
    }
  } else {
    console.log('No subscription found in Supabase')
  }

  // 3. Delete purchases from Supabase
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, album_id, amount_cents, status')
    .eq('user_id', profile.id)

  if (purchases && purchases.length > 0) {
    console.log(`Found ${purchases.length} purchase(s) in Supabase`)
    for (const purchase of purchases) {
      console.log(`  - Album ${purchase.album_id}: $${(purchase.amount_cents / 100).toFixed(2)} (${purchase.status})`)
    }

    const { error: deletePurchasesError } = await supabase
      .from('purchases')
      .delete()
      .eq('user_id', profile.id)

    if (deletePurchasesError) {
      console.error('Failed to delete purchases from Supabase:', deletePurchasesError.message)
    } else {
      console.log(`✓ Deleted ${purchases.length} purchase(s) from Supabase`)
    }
  } else {
    console.log('No purchases found in Supabase')
  }

  // 4. Find and cancel Stripe subscriptions
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    const customerId = customers.data[0].id
    console.log(`Found Stripe customer: ${customerId}`)

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    })

    if (subscriptions.data.length > 0) {
      for (const sub of subscriptions.data) {
        console.log(`Canceling Stripe subscription: ${sub.id} (${sub.status})`)
        try {
          await stripe.subscriptions.cancel(sub.id)
          console.log(`✓ Canceled subscription ${sub.id}`)
        } catch (e: any) {
          console.log(`  Subscription already canceled or error: ${e.message}`)
        }
      }
    } else {
      console.log('No active Stripe subscriptions found')
    }
  } else {
    console.log('No Stripe customer found for this email')
  }

  console.log('\n✓ Done! User can now test subscription and purchase flows.\n')
}

resetSubscription().catch(console.error)
