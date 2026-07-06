// Contact form API endpoint using Resend
import { Resend } from 'resend'
import { enforceRateLimit } from '~/server/utils/rateLimit'

interface ContactBody {
  name: string
  email: string
  subject: string
  message: string
  // Spam protection: honeypot field (must stay empty) and milliseconds
  // between form render and submit (bots submit instantly)
  website?: string
  elapsedMs?: number
}

// Humans need at least a couple of seconds to fill out a form
const MIN_SUBMIT_TIME_MS = 2000

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many messages sent. Please try again in an hour.',
  })

  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Email service not configured',
    })
  }

  const body = await readBody<ContactBody>(event)

  // Silently discard bot submissions: filled honeypot or a submit faster
  // than any human could manage. Return the normal success response so
  // bots can't tell they were filtered.
  if (body.website || typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_SUBMIT_TIME_MS) {
    return { success: true, message: 'Message sent successfully' }
  }

  // Validate required fields
  if (!body.name || !body.email || !body.subject || !body.message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'All fields are required',
    })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address',
    })
  }

  // Escape all user-supplied fields before interpolating into the email HTML
  // to prevent HTML/phishing injection into the admin inbox.
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const safeName = escapeHtml(body.name)
  const safeEmail = escapeHtml(body.email)
  const safeSubject = escapeHtml(body.subject)
  const safeMessage = escapeHtml(body.message).replace(/\n/g, '<br />')

  const resend = new Resend(config.resendApiKey)

  try {
    await resend.emails.send({
      from: 'Fairtune Contact <onboarding@resend.dev>',
      to: config.contactEmail,
      replyTo: body.email,
      subject: `[Contact] ${safeSubject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This message was sent from the Fairtune contact form.
        </p>
      `,
    })

    return { success: true, message: 'Message sent successfully' }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send message. Please try again later.',
    })
  }
})
