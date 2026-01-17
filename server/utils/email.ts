// Email utilities using Resend and React Email templates
import { Resend } from 'resend'
import { render } from '@react-email/render'

let resendClient: Resend | null = null

export const getResendClient = () => {
  if (resendClient) return resendClient

  const config = useRuntimeConfig()
  resendClient = new Resend(config.resendApiKey)

  return resendClient
}

// Base email options interface
interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

// Send email with error handling
export const sendEmail = async (options: SendEmailOptions) => {
  const config = useRuntimeConfig()
  const client = getResendClient()

  const fromAddress = options.from || `Indiestream <noreply@${config.public.emailDomain || 'indiestream.art'}>`

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      throw new Error(error.message)
    }

    console.log('[Email] Sent successfully:', data?.id)
    return data
  } catch (err) {
    console.error('[Email] Error sending email:', err)
    throw err
  }
}

// Type definitions for email data
export interface WelcomeEmailData {
  to: string
  userName: string
  subscriptionTier: string
}

export interface SubscriptionConfirmedEmailData {
  to: string
  userName: string
  tier: string
  amount: number
  currency: string
  periodEnd: string
}

export interface PaymentFailedEmailData {
  to: string
  userName: string
  amount: number
  currency: string
  updatePaymentUrl: string
}

export interface ArtistApprovedEmailData {
  to: string
  artistName: string
  bandName: string
  dashboardUrl: string
}

export interface ArtistRejectedEmailData {
  to: string
  artistName: string
  bandName: string
  reason?: string
}

export interface PayoutSuccessEmailData {
  to: string
  artistName: string
  amount: number
  currency: string
  bands: string[]
  transferId: string
}

export interface PayoutFailedEmailData {
  to: string
  artistName: string
  amount: number
  currency: string
  errorMessage: string
}

// Helper to render React Email templates to HTML
export const renderEmailTemplate = async (template: React.ReactElement): Promise<string> => {
  return render(template)
}

// Wrapper functions for each email type (will be implemented with templates)
export const sendWelcomeEmail = async (data: WelcomeEmailData) => {
  const { WelcomeEmail } = await import('../emails/WelcomeEmail')
  const html = await renderEmailTemplate(WelcomeEmail(data))

  return sendEmail({
    to: data.to,
    subject: 'Welcome to Indiestream! 🎵',
    html,
  })
}

export const sendSubscriptionConfirmedEmail = async (data: SubscriptionConfirmedEmailData) => {
  const { SubscriptionConfirmedEmail } = await import('../emails/SubscriptionConfirmedEmail')
  const html = await renderEmailTemplate(SubscriptionConfirmedEmail(data))

  return sendEmail({
    to: data.to,
    subject: 'Your Indiestream subscription is active',
    html,
  })
}

export const sendPaymentFailedEmail = async (data: PaymentFailedEmailData) => {
  const { PaymentFailedEmail } = await import('../emails/PaymentFailedEmail')
  const html = await renderEmailTemplate(PaymentFailedEmail(data))

  return sendEmail({
    to: data.to,
    subject: 'Payment failed - Action required',
    html,
  })
}

export const sendArtistApprovedEmail = async (data: ArtistApprovedEmailData) => {
  const { ArtistApprovedEmail } = await import('../emails/ArtistApprovedEmail')
  const html = await renderEmailTemplate(ArtistApprovedEmail(data))

  return sendEmail({
    to: data.to,
    subject: `${data.bandName} is now live on Indiestream! 🎉`,
    html,
  })
}

export const sendArtistRejectedEmail = async (data: ArtistRejectedEmailData) => {
  const { ArtistRejectedEmail } = await import('../emails/ArtistRejectedEmail')
  const html = await renderEmailTemplate(ArtistRejectedEmail(data))

  return sendEmail({
    to: data.to,
    subject: `Update on your ${data.bandName} artist application`,
    html,
  })
}

export const sendPayoutSuccessEmail = async (data: PayoutSuccessEmailData) => {
  const { PayoutSuccessEmail } = await import('../emails/PayoutSuccessEmail')
  const html = await renderEmailTemplate(PayoutSuccessEmail(data))

  return sendEmail({
    to: data.to,
    subject: `Payout of ${data.currency} ${data.amount.toFixed(2)} processed! 💰`,
    html,
  })
}

export const sendPayoutFailedEmail = async (data: PayoutFailedEmailData) => {
  const { PayoutFailedEmail } = await import('../emails/PayoutFailedEmail')
  const html = await renderEmailTemplate(PayoutFailedEmail(data))

  return sendEmail({
    to: data.to,
    subject: 'Payout failed - Action may be required',
    html,
  })
}
