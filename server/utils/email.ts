// Email utilities using Resend and MJML templates
import { Resend } from 'resend'
import mjml2html from 'mjml'

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

  // Use Resend's test domain for development, or configure RESEND_FROM_EMAIL for production
  const fromAddress = options.from || `Fairtune <${config.resendFromEmail || 'onboarding@resend.dev'}>`

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

export interface TrackRemovedEmailData {
  to: string
  artistName: string
  trackTitle: string
  albumTitle: string
  bandName: string
  reason: 'copyright' | 'ai_generated' | 'inappropriate' | 'other'
  details?: string
}

export interface NewReleaseEmailData {
  to: string
  followerName: string
  bandName: string
  bandSlug: string
  albumTitle: string
  albumSlug: string
  releaseType: 'album' | 'ep' | 'single'
  description?: string | null
  coverUrl?: string | null
}

// Helper to render MJML templates to HTML
export const renderEmailTemplate = (mjmlTemplate: string): string => {
  const { html, errors } = mjml2html(mjmlTemplate)
  if (errors && errors.length > 0) {
    console.error('[Email] MJML compilation errors:', errors)
  }
  return html
}

// Wrapper functions for each email type
export const sendWelcomeEmail = async (data: WelcomeEmailData) => {
  const { getWelcomeEmailTemplate } = await import('../emails/WelcomeEmail')
  const html = renderEmailTemplate(getWelcomeEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: 'Welcome to Fairtune!',
    html,
  })
}

export const sendSubscriptionConfirmedEmail = async (data: SubscriptionConfirmedEmailData) => {
  const { getSubscriptionConfirmedEmailTemplate } = await import('../emails/SubscriptionConfirmedEmail')
  const html = renderEmailTemplate(getSubscriptionConfirmedEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: 'Your Fairtune subscription is active',
    html,
  })
}

export const sendPaymentFailedEmail = async (data: PaymentFailedEmailData) => {
  const { getPaymentFailedEmailTemplate } = await import('../emails/PaymentFailedEmail')
  const html = renderEmailTemplate(getPaymentFailedEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: 'Payment failed - Action required',
    html,
  })
}

export const sendArtistApprovedEmail = async (data: ArtistApprovedEmailData) => {
  const { getArtistApprovedEmailTemplate } = await import('../emails/ArtistApprovedEmail')
  const html = renderEmailTemplate(getArtistApprovedEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: `${data.bandName} is now live on Fairtune!`,
    html,
  })
}

export const sendArtistRejectedEmail = async (data: ArtistRejectedEmailData) => {
  const { getArtistRejectedEmailTemplate } = await import('../emails/ArtistRejectedEmail')
  const html = renderEmailTemplate(getArtistRejectedEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: `Update on your ${data.bandName} artist application`,
    html,
  })
}

export const sendPayoutSuccessEmail = async (data: PayoutSuccessEmailData) => {
  const { getPayoutSuccessEmailTemplate } = await import('../emails/PayoutSuccessEmail')
  const html = renderEmailTemplate(getPayoutSuccessEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: `Payout of ${data.currency} ${data.amount.toFixed(2)} processed!`,
    html,
  })
}

export const sendPayoutFailedEmail = async (data: PayoutFailedEmailData) => {
  const { getPayoutFailedEmailTemplate } = await import('../emails/PayoutFailedEmail')
  const html = renderEmailTemplate(getPayoutFailedEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: 'Payout failed - Action may be required',
    html,
  })
}

export const sendTrackRemovedEmail = async (data: TrackRemovedEmailData) => {
  const { getTrackRemovedEmailTemplate } = await import('../emails/TrackRemovedEmail')
  const html = renderEmailTemplate(getTrackRemovedEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: `Track Removed: ${data.trackTitle}`,
    html,
  })
}

export const sendNewReleaseEmail = async (data: NewReleaseEmailData) => {
  const { getNewReleaseEmailTemplate } = await import('../emails/NewReleaseEmail')
  const html = renderEmailTemplate(getNewReleaseEmailTemplate(data))

  return sendEmail({
    to: data.to,
    subject: `New Release: ${data.albumTitle} by ${data.bandName}`,
    html,
  })
}
