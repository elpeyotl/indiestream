// Global middleware to show coming soon page on production domain.
// Invited users can bypass it via ?invite=<INVITE_SECRET>, which sets a
// 30-day cookie. The secret is only available server-side, so validation
// happens during SSR; client-side navigation trusts the cookie (every
// full page load re-validates it on the server).
const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export default defineNuxtRouteMiddleware((to) => {
  // Skip if already on coming-soon page
  if (to.path === '/coming-soon') return

  const config = useRuntimeConfig()
  if (!config.public.comingSoonMode) return

  const inviteCookie = useCookie<string | null>('invite_access', {
    maxAge: INVITE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })

  if (import.meta.server) {
    const secret = typeof config.inviteSecret === 'string' ? config.inviteSecret : ''
    if (secret) {
      // Invite link: validate the query param and persist access
      if (to.query.invite === secret) {
        inviteCookie.value = secret
        return
      }
      // Returning invited user
      if (inviteCookie.value === secret) return
    }
    return navigateTo('/coming-soon')
  }

  // Client-side: the secret isn't exposed here, so trust cookie presence.
  // A forged cookie only survives until the next full page load.
  if (inviteCookie.value) return

  return navigateTo('/coming-soon')
})
