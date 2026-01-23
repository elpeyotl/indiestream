// Check if user can play a full track (for pre-play validation)
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    return {
      canPlay: false,
      reason: 'unauthenticated',
    }
  }

  const body = await readBody(event)
  const { trackId } = body

  const client = await serverSupabaseClient(event)

  // Check if user owns the band for this track (artists can always play their own music)
  // Also check if user has purchased the album
  if (trackId) {
    const { data: track } = await client
      .from('tracks')
      .select('band_id, album_id')
      .eq('id', trackId)
      .single()

    if (track?.band_id) {
      const { data: ownsBand } = await client
        .from('bands')
        .select('id')
        .eq('id', track.band_id)
        .eq('owner_id', user.id)
        .single()

      if (ownsBand) {
        return {
          canPlay: true,
          reason: 'own_music',
          isSubscribed: false,
          isFree: false,
          isOwnMusic: true,
          isPurchased: false,
        }
      }
    }

    // Check if user has purchased the album for this track
    if (track?.album_id) {
      const { data: purchase } = await client
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('album_id', track.album_id)
        .eq('status', 'completed')
        .single()

      if (purchase) {
        return {
          canPlay: true,
          reason: 'album_purchase',
          isSubscribed: false,
          isFree: false,
          isOwnMusic: false,
          isPurchased: true,
        }
      }
    }
  }

  const { data, error } = await client.rpc('check_free_play_allowance')

  if (error) {
    console.error('Failed to check free play allowance:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to check free play allowance',
    })
  }

  // data is the return value: 'allowed', 'limit_reached', or 'subscribed'
  const status = data as string

  return {
    canPlay: status === 'allowed' || status === 'subscribed',
    reason: status,
    isSubscribed: status === 'subscribed',
    isFree: status === 'allowed' || status === 'limit_reached',
    isOwnMusic: false,
    isPurchased: false,
  }
})
