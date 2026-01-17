// POST /api/admin/test-email - Send test emails (admin only)
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import {
  sendWelcomeEmail,
  sendSubscriptionConfirmedEmail,
  sendPaymentFailedEmail,
  sendArtistApprovedEmail,
  sendArtistRejectedEmail,
  sendPayoutSuccessEmail,
  sendPayoutFailedEmail,
} from '~/server/utils/email'

const templates = [
  'welcome',
  'subscription-confirmed',
  'payment-failed',
  'artist-approved',
  'artist-rejected',
  'payout-success',
  'payout-failed',
] as const

type TemplateName = typeof templates[number]

interface TestEmailRequest {
  template: TemplateName
  to: string
}

export default defineEventHandler(async (event) => {
  // Verify admin access
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<TestEmailRequest>(event)

  if (!body.template || !templates.includes(body.template)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid template. Valid options: ${templates.join(', ')}`,
    })
  }

  if (!body.to || !body.to.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Valid email address required' })
  }

  const config = useRuntimeConfig()

  try {
    switch (body.template) {
      case 'welcome':
        await sendWelcomeEmail({
          to: body.to,
          userName: 'Test User',
          subscriptionTier: 'listener',
        })
        break

      case 'subscription-confirmed':
        await sendSubscriptionConfirmedEmail({
          to: body.to,
          userName: 'Test User',
          tier: 'Listener',
          amount: 9.99,
          currency: 'CHF',
          periodEnd: 'February 17, 2026',
        })
        break

      case 'payment-failed':
        await sendPaymentFailedEmail({
          to: body.to,
          userName: 'Test User',
          amount: 9.99,
          currency: 'CHF',
          updatePaymentUrl: `${config.public.appUrl}/settings/billing`,
        })
        break

      case 'artist-approved':
        await sendArtistApprovedEmail({
          to: body.to,
          artistName: 'Test Artist',
          bandName: 'The Test Band',
          dashboardUrl: `${config.public.appUrl}/dashboard`,
        })
        break

      case 'artist-rejected':
        await sendArtistRejectedEmail({
          to: body.to,
          artistName: 'Test Artist',
          bandName: 'The Test Band',
          reason: 'This is a test rejection reason for preview purposes.',
        })
        break

      case 'payout-success':
        await sendPayoutSuccessEmail({
          to: body.to,
          artistName: 'Test Artist',
          amount: 150.00,
          currency: 'CHF',
          bands: ['The Test Band', 'Side Project'],
          transferId: 'tr_test_123456',
        })
        break

      case 'payout-failed':
        await sendPayoutFailedEmail({
          to: body.to,
          artistName: 'Test Artist',
          amount: 150.00,
          currency: 'CHF',
          errorMessage: 'Test error: Bank account verification required',
        })
        break
    }

    return {
      success: true,
      message: `Test email "${body.template}" sent to ${body.to}`,
    }
  } catch (error: any) {
    console.error('Failed to send test email:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to send test email',
    })
  }
})
