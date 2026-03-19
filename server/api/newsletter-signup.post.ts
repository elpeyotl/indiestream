import { serverSupabaseServiceRole } from '#supabase/server'

interface NewsletterSignupBody {
  email: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<NewsletterSignupBody>(event)

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
