// Audit logging utility for admin actions
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~/types/database'

export interface AuditLogEntry {
  adminId: string
  action: string // e.g., 'track.approve', 'band.suspend'
  entityType: 'band' | 'album' | 'track' | 'user' | 'report' | 'dmca' | 'settings' | 'featured_genre' | 'playlist'
  entityId?: string
  entityName?: string
  summary: string
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
  metadata?: Record<string, unknown>
}

/**
 * Create an audit log entry for an admin action
 *
 * @param client - Supabase service role client (must have permission to insert)
 * @param entry - The audit log entry data
 *
 * @example
 * await createAuditLog(client, {
 *   adminId: user.id,
 *   action: 'band.suspend',
 *   entityType: 'band',
 *   entityId: bandId,
 *   entityName: band.name,
 *   summary: `Suspended band "${band.name}"`,
 *   oldValue: { status: 'active' },
 *   newValue: { status: 'suspended', suspension_reason: reason },
 *   metadata: { reason }
 * })
 */
export async function createAuditLog(
  client: SupabaseClient<Database>,
  entry: AuditLogEntry
): Promise<void> {
  const { error } = await client.from('admin_audit_logs').insert({
    admin_id: entry.adminId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId || null,
    entity_name: entry.entityName || null,
    summary: entry.summary,
    old_value: (entry.oldValue || null) as Json,
    new_value: (entry.newValue || null) as Json,
    metadata: (entry.metadata || null) as Json,
  })

  if (error) {
    // Log error but don't fail the main operation
    console.error('[AuditLog] Failed to create audit log:', error)
    console.error('[AuditLog] Entry:', JSON.stringify(entry, null, 2))
  }
}

/**
 * Helper to extract relevant fields from a band for old/new value snapshots
 * Only includes fields that are typically modified by admin actions
 */
export function extractBandSnapshot(band: Record<string, unknown>): Record<string, unknown> {
  return {
    name: band.name,
    slug: band.slug,
    status: band.status,
    is_verified: band.is_verified,
    is_featured: band.is_featured,
    suspension_reason: band.suspension_reason,
    genres: band.genres,
    bio: band.bio,
    location: band.location,
    tagline: band.tagline,
  }
}

/**
 * Helper to extract relevant fields from an album for old/new value snapshots
 */
export function extractAlbumSnapshot(album: Record<string, unknown>): Record<string, unknown> {
  return {
    title: album.title,
    slug: album.slug,
    is_published: album.is_published,
    release_type: album.release_type,
    release_date: album.release_date,
    upc: album.upc,
    label_name: album.label_name,
    description: album.description,
  }
}

/**
 * Helper to extract relevant fields from a track for old/new value snapshots
 */
export function extractTrackSnapshot(track: Record<string, unknown>): Record<string, unknown> {
  return {
    title: track.title,
    moderation_status: track.moderation_status,
    moderation_notes: track.moderation_notes,
    is_explicit: track.is_explicit,
    isrc: track.isrc,
    iswc: track.iswc,
    track_number: track.track_number,
  }
}

/**
 * Helper to extract relevant fields from a user profile for old/new value snapshots
 */
export function extractUserSnapshot(user: Record<string, unknown>): Record<string, unknown> {
  return {
    role: user.role,
    email: user.email,
    display_name: user.display_name,
  }
}

/**
 * Helper to extract relevant fields from a content report for old/new value snapshots
 */
export function extractReportSnapshot(report: Record<string, unknown>): Record<string, unknown> {
  return {
    status: report.status,
    resolution_notes: report.resolution_notes,
    report_type: report.report_type,
  }
}

/**
 * Helper to extract relevant fields from a DMCA request for old/new value snapshots
 */
export function extractDmcaSnapshot(dmca: Record<string, unknown>): Record<string, unknown> {
  return {
    status: dmca.status,
    admin_notes: dmca.admin_notes,
    counter_notice_received: dmca.counter_notice_received,
  }
}
