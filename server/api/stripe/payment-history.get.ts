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

  const supabase = await serverSupabaseClient(event)

  // Get user's Stripe customer ID from subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, status, plan')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.stripe_customer_id) {
    // Return empty history for users without Stripe customer
    return {
      invoices: [],
      totalPaid: 0,
      subscriptionStatus: subscription?.status || 'inactive',
    }
  }

  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  })

  try {
    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 100,
    })

    // Calculate total paid
    const totalPaid = invoices.data
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)

    // Format invoices for response
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      date: invoice.created,
      amount: invoice.amount_paid || invoice.amount_due || 0,
      status: invoice.status,
      description: invoice.lines.data[0]?.description || 'Subscription',
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
    }))

    return {
      invoices: formattedInvoices,
      totalPaid,
      subscriptionStatus: subscription.status,
    }
  } catch (error: any) {
    console.error('Stripe payment history error:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch payment history',
    })
  }
})
