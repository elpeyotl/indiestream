// Server-side handler for Supabase auth callback
// This handles the PKCE flow properly by exchanging the code server-side

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const next = (query.next as string) || '/dashboard'

  if (code) {
    const supabase = await serverSupabaseClient(event)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully exchanged code, redirect to dashboard or next page
      return sendRedirect(event, next)
    }

    // If there's an error, redirect to confirm page with error
    console.error('Auth confirmation error:', error.message)
    return sendRedirect(event, `/confirm?error=${encodeURIComponent(error.message)}`)
  }

  // No code provided, redirect to confirm page
  return sendRedirect(event, '/confirm?error=No+code+provided')
})
