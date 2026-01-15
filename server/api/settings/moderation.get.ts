// GET /api/settings/moderation - Get moderation settings (public, cached)
import { serverSupabaseServiceRole } from '#supabase/server'

// Simple in-memory cache
let cachedSettings: { requireModeration: boolean; timestamp: number } | null = null
const CACHE_TTL = 60000 // 1 minute

export default defineEventHandler(async (event) => {
  // Return cached value if fresh
  if (cachedSettings && Date.now() - cachedSettings.timestamp < CACHE_TTL) {
    return { requireModeration: cachedSettings.requireModeration }
  }

  const client = await serverSupabaseServiceRole(event)

  const { data } = await client
    .from('platform_settings')
    .select('value')
    .eq('key', 'require_track_moderation')
    .single()

  const requireModeration = data?.value === true || data?.value === 'true'

  // Update cache
  cachedSettings = {
    requireModeration,
    timestamp: Date.now(),
  }

  return { requireModeration }
})
