import { serverSupabaseServiceRole } from '#supabase/server'
import { enforceRateLimit } from '~/server/utils/rateLimit'

interface NewsletterSignupBody {
  email: string
  // Spam protection: honeypot field (must stay empty) and milliseconds
  // between form render and submit (bots submit instantly)
  website?: string
  elapsedMs?: number
}

// Humans need at least a couple of seconds before submitting
const MIN_SUBMIT_TIME_MS = 2000

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Too many signup attempts. Please try again in an hour.',
  })

  const body = await readBody<NewsletterSignupBody>(event)

  // Silently discard bot submissions: filled honeypot or a submit faster
  // than any human could manage. Return the normal success response so
  // bots can't tell they were filtered.
  if (body.website || typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_SUBMIT_TIME_MS) {
    return { success: true }
  }

  if (!body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  // Basic email validation (same regex as contact.post.ts)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address',
    })
  }

  const supabase = await serverSupabaseServiceRole(event)

  const { error } = await supabase
    .from('newsletter_signups')
    .upsert(
      { email: body.email.toLowerCase().trim() },
      { onConflict: 'email', ignoreDuplicates: true }
    )

  if (error) {
    console.error('[Newsletter Signup] Insert error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Something went wrong. Please try again.',
    })
  }

  return { success: true }
})
