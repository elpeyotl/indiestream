// Shared user deletion logic, used by the admin delete-user endpoint and
// account self-deletion (GDPR/nDSG). Deletes all user data and the auth
// user. Callers are responsible for authorization checks.
import type { SupabaseClient } from '@supabase/supabase-js'
import { deleteFromR2ByPrefix } from '~/server/utils/r2'

// Every R2 prefix that can hold assets of a band (uploads, transcodes,
// artwork). See server/utils/r2.ts and server/api/transcoding/presign.post.ts
// for where these keys are generated.
const BAND_ASSET_PREFIXES = ['audio', 'covers', 'avatars', 'banners', 'streaming', 'hifi', 'archive']

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
 * Collects the R2 prefixes holding all of a user's stored files: every
 * asset prefix of every band they own, their profile avatars and their
 * bulk-upload archives. Must run BEFORE the bands rows are deleted.
 */
async function collectR2Prefixes(serviceClient: SupabaseClient, userId: string): Promise<string[]> {
  const { data: bands, error } = await serviceClient
    .from('bands')
    .select('id')
    .eq('owner_id', userId)

  if (error) {
    console.error('Failed to fetch bands for R2 cleanup:', error)
  }

  const prefixes: string[] = []
  for (const band of bands || []) {
    for (const assetPrefix of BAND_ASSET_PREFIXES) {
      prefixes.push(`${assetPrefix}/${band.id}/`)
    }
  }

  // Profile avatars are keyed avatars/<userId>-<timestamp>.<ext>; the prefix
  // also catches versions orphaned by earlier re-uploads.
  prefixes.push(`avatars/${userId}-`)

  // Transient bulk-upload ZIP archives (not tracked in any table)
  prefixes.push(`bulk-uploads/${userId}/`)

  return prefixes
}

/**
 * Deletes a user's data and their auth account. Mirrors the admin delete
 * flow: dependent rows first (best effort), then the auth user (must
 * succeed), then the user's files in R2 (best effort — a storage failure
 * must not resurrect an already-deleted account). Throws if the auth user
 * could not be deleted.
 */
export async function deleteUserData(serviceClient: SupabaseClient, userId: string): Promise<void> {
  // Collect storage prefixes while the band rows still exist
  const r2Prefixes = await collectR2Prefixes(serviceClient, userId)

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

  // Delete stored files (audio, transcodes, artwork, avatars, bulk uploads).
  // Best effort: failures are logged for manual cleanup but don't fail the
  // deletion — the account itself is already gone.
  for (const prefix of r2Prefixes) {
    try {
      const deleted = await deleteFromR2ByPrefix(prefix)
      if (deleted > 0) {
        console.log(`Deleted ${deleted} R2 object(s) under ${prefix}`)
      }
    } catch (e) {
      console.error(`Failed to delete R2 objects under ${prefix} for user ${userId}:`, e)
    }
  }
}
