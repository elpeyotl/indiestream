export const APP_VERSION = '0.17.0'

export interface ChangelogEntry {
  version: string
  date: string
  changes: {
    type: 'added' | 'changed' | 'fixed' | 'removed'
    description: string
  }[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.17.0',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'New Release Email Notifications: Followers receive emails when artists publish new music' },
      { type: 'added', description: 'In-app notifications for new releases from followed artists' },
      { type: 'added', description: 'Notification API endpoint for album publishing' },
    ],
  },
  {
    version: '0.16.0',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Admin Revenue Dashboard: New Revenue tab with comprehensive financial metrics' },
      { type: 'added', description: 'Revenue Trend Chart: Line chart showing monthly revenue over last 12 months' },
      { type: 'added', description: 'Revenue Split Chart: Doughnut chart visualizing 70/15/15 split (Artists/CMO/Platform)' },
      { type: 'added', description: 'Subscriber Growth Chart: Track new and total subscribers over time' },
      { type: 'added', description: 'Artist Growth Chart: Track new and total artists joining the platform' },
      { type: 'added', description: 'Top Earning Artists: Ranked list by lifetime earnings (includes paid out amounts)' },
      { type: 'added', description: 'Subscriber Metrics: Active, trialing, canceled, and past due counts' },
      { type: 'fixed', description: 'Top artists now correctly shows lifetime earnings instead of just current balance' },
    ],
  },
  {
    version: '0.15.0',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Content Protection System: Track reporting for copyright, AI-generated content, and inappropriate content' },
      { type: 'added', description: 'Admin Content Reports tab with clickable stat cards for filtering' },
      { type: 'added', description: 'Track removal with R2 storage deletion and email notification to artists' },
      { type: 'added', description: 'DMCA compliance page with takedown request form and counter-notification process' },
      { type: 'added', description: 'Upload safeguards: AI declaration checkbox and copyright warning' },
      { type: 'changed', description: 'Admin UI: Clickable stat cards on Track Moderation, Artist Approvals, and Content Reports tabs' },
      { type: 'changed', description: 'Terms of Service updated with AI-Generated Content Policy' },
      { type: 'fixed', description: 'Report submission now correctly sends reason value' },
      { type: 'fixed', description: 'Toast notifications work after adding UNotifications to layout' },
    ],
  },
  {
    version: '0.14.3',
    date: '2026-01-16',
    changes: [
      { type: 'added', description: 'Selective artist payouts: Choose which artists to pay instead of paying all at once' },
      { type: 'added', description: 'Payout history view showing all completed, pending, and failed payouts' },
      { type: 'added', description: 'My Profile link in user menu (avatar dropdown)' },
      { type: 'added', description: 'Payment History button on dashboard subscription card' },
      { type: 'changed', description: 'Subscription card UI simplified - removed redundant navigation buttons' },
      { type: 'fixed', description: 'Impact stats not showing on public profile' },
      { type: 'fixed', description: 'Stripe payout currency changed from USD to CHF' },
    ],
  },
  {
    version: '0.14.2',
    date: '2026-01-16',
    changes: [
      { type: 'added', description: 'Bug Report Page at /bugs with embedded Tally form' },
      { type: 'added', description: 'Admin Album Management: Full CRUD for albums in admin panel' },
      { type: 'added', description: 'Shared AlbumEditModal component for DRY code reuse' },
      { type: 'changed', description: 'Contact page now includes "Report a Bug" card linking to /bugs' },
    ],
  },
  {
    version: '0.14.1',
    date: '2026-01-16',
    changes: [
      { type: 'added', description: 'Media Session API: Lock screen playback controls for mobile devices' },
      { type: 'changed', description: 'Play/pause button icons now properly centered in both mini and expanded player' },
      { type: 'changed', description: 'Expanded player cover art adapts to viewport height for better fit' },
      { type: 'changed', description: 'User menu now uses slideover panel instead of dropdown' },
      { type: 'fixed', description: 'Mobile player no longer overlaps bottom navigation' },
      { type: 'fixed', description: 'Album page layout shift on mobile - now uses skeleton loading' },
    ],
  },
  {
    version: '0.14.0',
    date: '2026-01-16',
    changes: [
      { type: 'added', description: 'Admin Artist/Band Management with searchable, filterable list' },
      { type: 'added', description: 'Full edit capabilities: Admins can edit all artist fields' },
      { type: 'added', description: 'Feature/unfeature artists: Control which artists appear on homepage' },
      { type: 'added', description: 'Verify artists: Mark artists as verified with blue checkmark badge' },
      { type: 'added', description: 'Status management: Set artist status to active, suspended, or removed' },
    ],
  },
  {
    version: '0.13.1',
    date: '2026-01-15',
    changes: [
      { type: 'changed', description: 'Enhanced Impact Share Page with colorful gradients and artist avatars' },
      { type: 'added', description: 'Icon badges and rank badges for top artists on share page' },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-01-15',
    changes: [
      { type: 'added', description: '"This Month" tab on My Impact page showing real-time impact stats' },
      { type: 'added', description: 'Social Impact Sharing: Generate shareable links with customizable stats' },
      { type: 'added', description: 'User Profile Impact Stats: Optional public display on user profiles' },
      { type: 'added', description: 'ShareImpactModal component for managing share settings' },
      { type: 'changed', description: 'Dashboard hero card now defaults to showing "This Month" data' },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-01-15',
    changes: [
      { type: 'added', description: 'My Impact button in mobile bottom nav for subscribers' },
      { type: 'added', description: 'Dashboard Hero Card showing total earnings sent to artists' },
      { type: 'changed', description: 'Navigation reordering: Discover → Library → Listening → Impact' },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-01-14',
    changes: [
      { type: 'added', description: 'Playlists: Create, edit, and delete custom playlists' },
      { type: 'added', description: 'Collaborative playlists with owner/editor/viewer roles' },
      { type: 'added', description: 'Drag-and-drop track reordering within playlists' },
      { type: 'added', description: '"Liked Songs" as a special system playlist' },
      { type: 'added', description: 'Playlist tab in Library page alongside Artists and Albums' },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-01-14',
    changes: [
      { type: 'added', description: 'User Profiles: Public profile pages at /user/[id]' },
      { type: 'added', description: 'Settings Page: Profile management with avatar upload' },
      { type: 'added', description: '"Followers" tab on artist pages showing all fans' },
      { type: 'added', description: 'UserAvatar component with automatic initials fallback' },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-01-14',
    changes: [
      { type: 'added', description: 'Listening Stats/Wrapped dashboard with overview metrics' },
      { type: 'added', description: 'Listening patterns: most active day/hour, 24-hour chart, streaks' },
      { type: 'added', description: 'Top 10 artists, tracks, albums, and top 5 genres' },
      { type: 'added', description: '"My Impact" page showing revenue split visualization' },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-01-14',
    changes: [
      { type: 'added', description: 'Heart/favorite button to like currently playing track' },
      { type: 'added', description: 'Shuffle mode: Randomizes queue playback order' },
      { type: 'added', description: 'Repeat modes: Cycle through off → repeat all → repeat one' },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-01-20',
    changes: [
      { type: 'added', description: 'User-level Stripe Connect: Labels with multiple artists now connect ONE Stripe account' },
      { type: 'added', description: 'Combined earnings dashboard at /dashboard/earnings' },
      { type: 'added', description: 'Listener location tracking for geographic analytics' },
      { type: 'added', description: 'Deezer API integration for ISRC lookup (replaced Spotify)' },
      { type: 'added', description: 'CISAC ISWC lookup link in upload form' },
      { type: 'changed', description: 'Stripe Connect moved from per-band to per-user (profiles table)' },
      { type: 'changed', description: 'Payout processing now groups bands by owner and sends single combined transfers' },
      { type: 'changed', description: 'Artist dashboard earnings tab now links to combined earnings page' },
      { type: 'removed', description: 'share_percentage from composer credits (not needed for PRO reporting)' },
      { type: 'fixed', description: 'Artist avatar images loading correctly on upload page' },
      { type: 'fixed', description: 'Square aspect ratio for artist placeholder avatars on discover and home pages' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Artist rights metadata (ISRC, ISWC, composer credits)' },
      { type: 'added', description: 'PRO export for SUISA/GEMA reporting' },
      { type: 'added', description: '"85% Music Rights" marketing messaging' },
      { type: 'changed', description: 'Revenue split updated to transparent 70/15/15 model (70% artists, 15% CMOs, 15% platform)' },
      { type: 'changed', description: 'Artists can listen to their own music unlimited (doesn\'t count against free tier)' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-01-14',
    changes: [
      { type: 'added', description: 'Artist payout system with Stripe Connect Express' },
      { type: 'added', description: 'Revenue dashboard for artists (balance, earnings, payout history)' },
      { type: 'added', description: 'Admin payout processing' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-01-13',
    changes: [
      { type: 'added', description: 'Stripe subscription integration with checkout flow' },
      { type: 'added', description: 'Free tier with 5 full-track plays per month' },
      { type: 'added', description: 'Subscription management via Stripe portal' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-01-12',
    changes: [
      { type: 'added', description: 'Follow artists functionality' },
      { type: 'added', description: 'Library page (Artists, Albums, Liked Songs)' },
      { type: 'added', description: 'Listening history tracking' },
      { type: 'added', description: 'Country tracking for streams' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-01-11',
    changes: [
      { type: 'added', description: 'Audio player with queue management' },
      { type: 'added', description: 'Album/track upload with R2 storage' },
      { type: 'added', description: 'Artist profile management' },
      { type: 'added', description: 'Discover and search functionality' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-01-10',
    changes: [
      { type: 'added', description: 'Initial release' },
      { type: 'added', description: 'User authentication' },
      { type: 'added', description: 'Basic artist and album pages' },
      { type: 'added', description: 'Supabase database setup' },
    ],
  },
]
