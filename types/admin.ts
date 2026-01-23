// Shared TypeScript interfaces for admin dashboard

export interface AdminUser {
  id: string
  email: string
  display_name: string | null
  role: 'user' | 'band' | 'admin'
  created_at: string
  updated_at: string
  band_count: number
  stream_count: number
}

export interface AdminBand {
  id: string
  name: string
  slug: string
  tagline: string | null
  bio: string | null
  location: string | null
  website: string | null
  avatar_key: string | null
  banner_key: string | null
  theme_color: string
  genres: string[]
  is_verified: boolean
  is_featured: boolean
  featured_at: string | null
  featured_by: string | null
  status: 'active' | 'suspended' | 'removed'
  flag_count: number
  suspended_at: string | null
  suspended_by: string | null
  suspension_reason: string | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  total_streams: number
  total_earnings_cents: number
  created_at: string
  updated_at: string
  owner: {
    id: string
    email: string
    display_name: string | null
  }
  album_count: number
  track_count: number
}

export interface ModerationQueueItem {
  id: string
  track_id: string
  band_id: string
  submitted_by: string
  priority: 'normal' | 'high' | 'urgent'
  status: 'pending' | 'pending_update' | 'approved' | 'rejected' | 'revision_requested'
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  track: {
    id: string
    title: string
    track_number: number
    duration_seconds: number
    is_explicit: boolean
    isrc: string | null
    iswc: string | null
    is_cover: boolean
    moderation_status: string
    moderation_notes: string | null
    moderated_at: string | null
    moderated_by: string | null
    audio_key: string | null
    album: {
      id: string
      title: string
      slug: string
      cover_key: string | null
    } | null
    credits?: Array<{
      id: string
      role: string
      name: string
      ipi_number: string | null
    }>
  }
  band: {
    id: string
    name: string
    slug: string
    avatar_key: string | null
    owner: {
      id: string
      email: string
      display_name: string | null
    }
  }
  submitter: {
    id: string
    email: string
    display_name: string | null
  }
}

export interface AdminAlbum {
  id: string
  band_id: string
  title: string
  slug: string
  description: string | null
  release_type: 'single' | 'ep' | 'album'
  release_date: string | null
  cover_key: string | null
  is_published: boolean
  upc: string | null
  label_name: string | null
  p_line: string | null
  c_line: string | null
  created_at: string
  updated_at: string
  band: { id: string; name: string; slug: string } | null
  track_count: number
  tracks?: AdminAlbumTrack[]
}

export interface AdminAlbumTrack {
  id: string
  title: string
  track_number: number
  is_explicit: boolean
  isrc: string | null
  iswc: string | null
  moderation_status: string
  moderation_notes?: string | null
  credits?: Array<{ id: string; role: string; name: string; ipi_number: string | null }>
}

export interface PendingArtist {
  id: string
  name: string
  slug: string
  bio: string | null
  location: string | null
  website: string | null
  avatar_key: string | null
  avatar_url: string | null
  genres: string[]
  status: string
  created_at: string
  // Social links
  instagram: string | null
  twitter: string | null
  facebook: string | null
  youtube: string | null
  spotify: string | null
  soundcloud: string | null
  bandcamp: string | null
  tiktok: string | null
  owner: {
    id: string
    email: string
    display_name: string | null
  } | null
}

export interface ContentReport {
  id: string
  track_id: string
  reporter_id: string | null
  reporter_email: string | null
  reason: 'copyright' | 'ai_generated' | 'inappropriate' | 'other'
  details: string | null
  evidence_url: string | null
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  track: {
    id: string
    title: string
    isrc: string | null
    album: {
      id: string
      title: string
      slug: string
      band: {
        id: string
        name: string
        slug: string
      }
    }
  }
  reporter: {
    id: string
    display_name: string | null
    email: string
  } | null
  resolver: {
    id: string
    display_name: string | null
  } | null
}

export interface DmcaRequest {
  id: string
  claimant_name: string
  claimant_email: string
  claimant_address: string
  claimant_phone: string | null
  copyrighted_work_description: string
  infringing_url: string
  original_work_url: string | null
  good_faith_statement: boolean
  accuracy_statement: boolean
  signature: string
  signature_date: string | null
  status: 'pending' | 'processing' | 'content_removed' | 'counter_notice' | 'resolved' | 'rejected'
  admin_notes: string | null
  processed_at: string | null
  processed_by: string | null
  counter_notice_received: boolean
  counter_notice_date: string | null
  counter_notice_details: string | null
  created_at: string
  updated_at: string
}

export interface RevenueStats {
  monthlyRecurringRevenue: number
  pendingBalance: number
  totalPaidOut: number
  totalPendingPayouts: number
  lifetimeEarnings: number
  platformFee: number
  cmoFee: number
  artistPool: number
  subscribers: {
    active: number
    trialing: number
    canceled: number
    pastDue: number
    total: number
    churnRate: number
    avgRevenuePerSub: number
  }
  monthlyTrend: Array<{
    period_start: string
    total_subscription_revenue_cents: number
    artist_pool_cents: number
  }>
  subscriberGrowth: Array<{
    month: string
    newSubscribers: number
    totalSubscribers: number
  }>
  artistGrowth: Array<{
    month: string
    newArtists: number
    totalArtists: number
  }>
  topArtists: Array<{
    bandId: string
    name: string
    slug: string
    avatarKey: string | null
    balance: number
    lifetime: number
  }>
}

export interface PayoutCalculationResult {
  success: boolean
  periodId: string
  periodStart: string
  periodEnd: string
  totalRevenue: number
  artistPool: number
  platformFee: number
  totalStreams: number
  artistsCount: number
  subscribersCount: number
}

export interface PayoutProcessResult {
  success: boolean
  processed: number
  failed: number
  skipped: number
  totalAmount: number
  results: Array<{
    bandId: string
    bandName: string
    amount: number
    status: 'success' | 'failed' | 'skipped'
    error?: string
    transferId?: string
  }>
}

export interface EligibleArtist {
  userId: string
  userName: string
  email: string
  totalBalance: number
  bandCount: number
  bands: Array<{ bandId: string; bandName: string; balance: number }>
  stripeStatus: string
  eligible: boolean
  reason: string
}

export interface EligibleArtistsResponse {
  users: EligibleArtist[]
  minimumPayout: number
  eligibleCount: number
  totalEligibleAmount: number
}

export interface PayoutHistoryItem {
  id: string
  stripeTransferId: string | null
  totalAmount: number
  status: string
  errorMessage: string | null
  createdAt: string
  processedAt: string | null
  bands: Array<{ id: string; name: string; amount: number }>
  user: { name: string; email: string } | null
}

export interface AdminPlaylist {
  id: string
  title: string
  description: string | null
  is_public: boolean
  is_featured: boolean
  is_curated: boolean
  featured_at: string | null
  track_count: number
  cover_key: string | null
  created_at: string
  owner: {
    id: string
    display_name: string | null
    email: string
  } | null
}

// Filter options constants
export const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Artist', value: 'band' },
  { label: 'Admin', value: 'admin' },
]

export const statusFilterOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Removed', value: 'removed' },
]

export const featuredFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Featured', value: 'true' },
  { label: 'Not Featured', value: 'false' },
]

export const verifiedFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'true' },
  { label: 'Not Verified', value: 'false' },
]

export const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Removed', value: 'removed' },
]

export const moderationStatusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Pending Update', value: 'pending_update' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Revision Requested', value: 'revision_requested' },
]

export const moderationPriorityOptions = [
  { label: 'All Priority', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
]

export const artistApprovalsStatusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Rejected', value: 'removed' },
]

export const reportsStatusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Investigating', value: 'investigating' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
]

export const dmcaStatusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Content Removed', value: 'content_removed' },
  { label: 'Counter Notice', value: 'counter_notice' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Rejected', value: 'rejected' },
]

export const playlistFilterOptions = [
  { label: 'All Playlists', value: 'all' },
  { label: 'Featured', value: 'featured' },
  { label: 'Curated', value: 'curated' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

export const albumPublishedFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'true' },
  { label: 'Draft', value: 'false' },
]

export const monthOptions = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 },
]

// Audit Log Types
export interface AdminAuditLog {
  id: string
  admin_id: string
  created_at: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  summary: string
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  admin?: {
    id: string
    email: string
    display_name: string | null
  }
}

export const auditEntityTypeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Bands', value: 'band' },
  { label: 'Albums', value: 'album' },
  { label: 'Tracks', value: 'track' },
  { label: 'Users', value: 'user' },
  { label: 'Reports', value: 'report' },
  { label: 'DMCA', value: 'dmca' },
  { label: 'Settings', value: 'settings' },
  { label: 'Featured Genres', value: 'featured_genre' },
  { label: 'Playlists', value: 'playlist' },
]

export const auditActionOptions = [
  { label: 'All Actions', value: 'all' },
  { label: 'Approve', value: 'approve' },
  { label: 'Reject', value: 'reject' },
  { label: 'Delete', value: 'delete' },
  { label: 'Update', value: 'update' },
  { label: 'Suspend', value: 'suspend' },
  { label: 'Feature', value: 'feature' },
  { label: 'Verify', value: 'verify' },
  { label: 'Publish', value: 'publish' },
]
