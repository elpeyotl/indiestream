// Create a shareable link for impact stats
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)
  const body = await readBody(event)

  const {
    period,
    showTotalEarned,
    showArtistsSupported,
    showListeningTime,
    showStreamCount,
    showArtistBreakdown
  } = body

  // Validate period
  if (!['this-month', 'last-month', 'all-time'].includes(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid period. Must be "this-month", "last-month", or "all-time"' })
  }

  // Validate at least one stat is enabled
  if (!showTotalEarned && !showArtistsSupported && !showListeningTime && !showStreamCount && !showArtistBreakdown) {
    throw createError({ statusCode: 400, statusMessage: 'At least one stat must be enabled' })
  }

  // Generate unique URL-safe token (16 bytes = 128 bits of entropy)
  const token = randomBytes(16).toString('base64url')

  // Save to database
  const { data, error } = await client
    .from('impact_shares')
    .insert({
      user_id: user.id,
      token,
      period,
      show_total_earned: showTotalEarned ?? true,
      show_artists_supported: showArtistsSupported ?? true,
      show_listening_time: showListeningTime ?? true,
      show_stream_count: showStreamCount ?? true,
      show_artist_breakdown: showArtistBreakdown ?? false,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create impact share:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create share link' })
  }

  // Get hostname from request headers
  const host = event.node.req.headers.host || 'localhost:3000'

  return {
    token: data.token,
    shareUrl: `${host}/impact/share/${data.token}`
  }
})
