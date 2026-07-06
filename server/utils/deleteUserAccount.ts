// Shared user deletion logic, used by the admin delete-user endpoint and
// account self-deletion (GDPR/nDSG). Deletes all user data and the auth
// user. Callers are responsible for authorization checks.
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the user's total unpaid artist balance in cents across all bands
 * they own. Self-deletion must be blocked while this is > 0 so earnings
 * aren't orphaned before payout.
 */
export async function getUnpaidArtistBalanceCents(
  serviceClient: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await serviceClient
    .from('artist_balances')
    .select('balance_cents, bands!inner (owner_id)')
    .eq('bands.owner_id', userId)
    .gt('balance_cents', 0)

  if (error) {
    console.error('Failed to fetch artist balances:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to check artist balance' })
  }

  return (data || []).reduce((sum, row) => sum + (row.balance_cents || 0), 0)
}

/**
 * Deletes a user's data and their auth account. Mirrors the admin delete
 * flow: dependent rows first (best effort), then the auth user (must
 * succeed). Throws if the auth user could not be deleted.
 */
export async function deleteUserData(serviceClient: SupabaseClient, userId: string): Promise<void> {
  // Delete user's bands (cascades to albums, tracks, listening_history via FK)
  const { error: bandsError } = await serviceClient
    .from('bands')
    .delete()
    .eq('owner_id', userId)

  if (bandsError) {
    console.error('Failed to delete bands:', bandsError)
  }

  // Delete user's listening history
  const { error: historyError } = await serviceClient
    .from('listening_history')
    .delete()
    .eq('user_id', userId)

  if (historyError) {
    console.error('Failed to delete listening history:', historyError)
  }

  // Delete user's library (saved albums, liked tracks)
  await serviceClient.from('saved_albums').delete().eq('user_id', userId)
  await serviceClient.from('liked_tracks').delete().eq('user_id', userId)

  // Delete user's follows
  await serviceClient.from('follows').delete().eq('user_id', userId)

  // Delete user's playlist tracks and playlists
  await serviceClient.from('playlist_tracks').delete().eq('added_by', userId)
  await serviceClient.from('playlists').delete().eq('user_id', userId)

  // Delete profile (should cascade from auth.users, but do it explicitly)
  const { error: profileDeleteError } = await serviceClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileDeleteError) {
    console.error('Failed to delete profile:', profileDeleteError)
  }

  // Delete the auth user using admin API
  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId)

  if (authError) {
    console.error('Failed to delete auth user:', authError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete user authentication' })
  }
}
