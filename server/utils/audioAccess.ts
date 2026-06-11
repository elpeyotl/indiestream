// Authorization for R2 object keys served via the stream endpoints.
//
// Open keys (public artwork + standard-quality streams) may be signed for
// anyone — this preserves logged-out previews, public share pages and the
// free tier. Restricted keys (lossless masters, pre-transcode originals and
// per-user bulk-upload archives) require an entitled, authenticated user.

import type { SupabaseClient } from '@supabase/supabase-js'

type AuthUser = { id: string } | null

// Prefixes anyone may fetch.
const OPEN_PREFIXES = ['covers/', 'avatars/', 'banners/', 'streaming/']

export function isOpenKey(key: string): boolean {
  return OPEN_PREFIXES.some((p) => key.startsWith(p))
}

async function ownsBand(client: SupabaseClient, userId: string, bandId?: string): Promise<boolean> {
  if (!bandId) return false
  const { data } = await client
    .from('bands')
    .select('id')
    .eq('id', bandId)
    .eq('owner_id', userId)
    .maybeSingle()
  return !!data
}

async function isAdmin(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return data?.role === 'admin'
}

async function hasActiveSubscription(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await client
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()
  return !!data
}

/**
 * Authorize access to a restricted (non-open) R2 key. Throws a 401/403 H3
 * error if the caller may not access it. `client` must be a service-role
 * client (ownership/subscription checks bypass RLS deliberately).
 */
export async function authorizeRestrictedKey(
  key: string,
  user: AuthUser,
  client: SupabaseClient,
): Promise<void> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const segments = key.split('/')
  const prefix = segments[0]
  const bandId = segments[1]

  // Admins may access any object (e.g. moderation playback of originals).
  if (await isAdmin(client, user.id)) return

  switch (prefix) {
    case 'hifi':
      // Lossless streaming: band owner or active subscriber.
      if ((await ownsBand(client, user.id, bandId)) || (await hasActiveSubscription(client, user.id))) {
        return
      }
      throw createError({ statusCode: 403, statusMessage: 'Hi-fi streaming requires an active subscription' })

    case 'archive':
    case 'audio':
      // Pre-transcode originals / archived masters: band owner only.
      if (await ownsBand(client, user.id, bandId)) return
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    case 'bulk-uploads':
      // bulk-uploads/<userId>/...
      if (bandId === user.id) return
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

    default:
      // Never sign unknown key shapes.
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}
