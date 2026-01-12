// Contact form API endpoint using Resend
import { Resend } from 'resend'

interface ContactBody {
  name: string
  email: string
  subject: string
  message: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.resendApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Email service not configured',
    })
  }

  const body = await readBody<ContactBody>(event)

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

  const resend = new Resend(config.resendApiKey)

  try {
    await resend.emails.send({
      from: 'Indiestream Contact <onboarding@resend.dev>',
      to: config.contactEmail,
      replyTo: body.email,
      subject: `[Contact] ${body.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${body.name} (${body.email})</p>
        <p><strong>Subject:</strong> ${body.subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${body.message.replace(/\n/g, '<br />')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This message was sent from the Indiestream contact form.
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
