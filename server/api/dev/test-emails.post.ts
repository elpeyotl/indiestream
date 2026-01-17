// POST /api/dev/test-emails - Send all test emails (dev only, no auth)
import {
  sendWelcomeEmail,
  sendSubscriptionConfirmedEmail,
  sendPaymentFailedEmail,
  sendArtistApprovedEmail,
  sendArtistRejectedEmail,
  sendPayoutSuccessEmail,
  sendPayoutFailedEmail,
} from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, statusMessage: 'Dev endpoint only' })
  }

  const to = 'hello.indiestream@gmail.com'
  const results: { template: string; success: boolean; emailId?: string; error?: string }[] = []

  // Helper to delay between sends (Resend rate limit: 2/sec)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Send each email with delay
  try {
    const r1 = await sendWelcomeEmail({ to, userName: 'Test User', subscriptionTier: 'listener' })
    results.push({ template: 'welcome', success: true, emailId: r1.id })
  } catch (e: any) {
    results.push({ template: 'welcome', success: false, error: e.message })
  }

  await delay(600)

  try {
    const r2 = await sendSubscriptionConfirmedEmail({
      to,
      userName: 'Test User',
      tier: 'Listener',
      amount: 9.99,
      currency: 'CHF',
      periodEnd: 'February 17, 2026',
    })
    results.push({ template: 'subscription-confirmed', success: true, emailId: r2.id })
  } catch (e: any) {
    results.push({ template: 'subscription-confirmed', success: false, error: e.message })
  }

  await delay(600)

  try {
    const r3 = await sendPaymentFailedEmail({
      to,
      userName: 'Test User',
      amount: 9.99,
      currency: 'CHF',
      updatePaymentUrl: `${config.public.appUrl}/settings/billing`,
    })
    results.push({ template: 'payment-failed', success: true, emailId: r3.id })
  } catch (e: any) {
    results.push({ template: 'payment-failed', success: false, error: e.message })
  }

  await delay(600)

  try {
    const r4 = await sendArtistApprovedEmail({
      to,
      artistName: 'Test Artist',
      bandName: 'The Test Band',
      dashboardUrl: `${config.public.appUrl}/dashboard`,
    })
    results.push({ template: 'artist-approved', success: true, emailId: r4.id })
  } catch (e: any) {
    results.push({ template: 'artist-approved', success: false, error: e.message })
  }

  await delay(600)

  try {
    const r5 = await sendArtistRejectedEmail({
      to,
      artistName: 'Test Artist',
      bandName: 'The Test Band',
      reason: 'This is a test rejection reason for preview purposes.',
    })
    results.push({ template: 'artist-rejected', success: true, emailId: r5.id })
  } catch (e: any) {
    results.push({ template: 'artist-rejected', success: false, error: e.message })
  }

  await delay(600)

  try {
    const r6 = await sendPayoutSuccessEmail({
      to,
      artistName: 'Test Artist',
      amount: 150.00,
      currency: 'CHF',
      bands: ['The Test Band', 'Side Project'],
      transferId: 'tr_test_123456',
    })
    results.push({ template: 'payout-success', success: true, emailId: r6.id })
  } catch (e: any) {
    results.push({ template: 'payout-success', success: false, error: e.message })
  }

  await delay(600)

  try {
    const r7 = await sendPayoutFailedEmail({
      to,
      artistName: 'Test Artist',
      amount: 150.00,
      currency: 'CHF',
      errorMessage: 'Test error: Bank account verification required',
    })
    results.push({ template: 'payout-failed', success: true, emailId: r7.id })
  } catch (e: any) {
    results.push({ template: 'payout-failed', success: false, error: e.message })
  }

  const successCount = results.filter(r => r.success).length

  return {
    message: `Sent ${successCount}/7 emails to ${to}`,
    results,
  }
})
