export const APP_VERSION = '0.28.0'

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
    version: '0.28.0',
    date: '2026-03-19',
    changes: [
      { type: 'added', description: 'Email signup on coming-soon page for launch notifications' },
    ],
  },
  {
    version: '0.27.0',
    date: '2026-03-12',
    changes: [
      { type: 'added', description: 'Offline audio streaming: download albums for offline playback' },
      { type: 'added', description: 'Dedicated offline mode with auto-redirect when connection is lost' },
      { type: 'added', description: 'Offline indicator and storage management in library' },
    ],
  },
  {
    version: '0.26.0',
    date: '2026-03-11',
    changes: [
      { type: 'changed', description: 'Pricing updated to CHF 12/month single tier with FLAC streaming' },
      { type: 'added', description: 'Terms acceptance required for uploads with contract confirmation email on approval' },
      { type: 'added', description: 'Collapsible track tiles in upload wizard for easier reordering' },
    ],
  },
  {
    version: '0.25.0',
    date: '2026-03-09',
    changes: [
      { type: 'fixed', description: 'SUISA CSV export: deduplicate songs and quote all fields' },
      { type: 'fixed', description: 'White dropdown backgrounds on Windows Chrome' },
      { type: 'added', description: 'Tooltips on track upload error icons' },
    ],
  },
  {
    version: '0.24.0',
    date: '2026-03-02',
    changes: [
      { type: 'added', description: 'Album actions menu with track actions always visible' },
      { type: 'added', description: 'Play/pause toggle on PlayAllButton' },
      { type: 'fixed', description: 'Followers tab not loading when switching tabs interactively' },
    ],
  },
  {
    version: '0.23.0',
    date: '2026-01-26',
    changes: [
      { type: 'added', description: 'Zine page for curated album discovery' },
      { type: 'added', description: 'Artist Support: Tips and Boost features' },
      { type: 'added', description: 'Tips and purchases integrated into impact stats and artist dashboard' },
      { type: 'fixed', description: 'Artist earnings not credited for tips and purchases' },
    ],
  },
  {
    version: '0.22.0',
    date: '2026-01-23',
    changes: [
      { type: 'added', description: 'Album purchase and download feature' },
      { type: 'added', description: 'Inline payment for subscriptions with purchase success page' },
      { type: 'added', description: 'Unlimited streaming for purchased albums' },
      { type: 'added', description: 'AlbumCard component with owned badge across all album grids' },
      { type: 'added', description: 'Homepage redesign with featured albums and new pages' },
      { type: 'added', description: 'Haptic feedback across mobile interactions' },
      { type: 'added', description: 'Admin audit logging system' },
      { type: 'changed', description: 'Album purchase/download UI made more compact' },
      { type: 'changed', description: 'Replaced all outline buttons with ghost variant' },
      { type: 'fixed', description: 'Subscription flow for trials using SetupIntent' },
      { type: 'fixed', description: 'Free play counter race condition' },
      { type: 'fixed', description: 'Foreign key constraint for band deletion' },
    ],
  },
  {
    version: '0.21.0',
    date: '2026-01-23',
    changes: [
      { type: 'added', description: 'Lyrics language field with author credit validation' },
      { type: 'added', description: 'Browse links and guest mobile navigation' },
      { type: 'added', description: 'Welcome tutorial carousel on subscription success page' },
      { type: 'added', description: 'Guest middleware to redirect logged-in users from login/register' },
      { type: 'added', description: 'Image resizing in bulk upload' },
      { type: 'changed', description: 'Renamed Stats to My Impact in navigation' },
      { type: 'fixed', description: 'Impact share page RLS issue and own bands filtered out' },
      { type: 'fixed', description: 'Bulk upload SSR error with lazy-loaded JSZip' },
      { type: 'fixed', description: 'DMCA form now requires artist/album URL' },
    ],
  },
  {
    version: '0.20.0',
    date: '2026-01-22',
    changes: [
      { type: 'added', description: 'Rebrand from Indiestream/Fairstream to Fairtune' },
      { type: 'added', description: 'Mobile search page with shared useSearch composable' },
      { type: 'added', description: 'Genre enhancements: hero banners, filtering, featured genres system' },
      { type: 'changed', description: 'Migrated composables to Pinia stores with SWR caching pattern' },
      { type: 'changed', description: 'Enabled TypeScript strict mode across entire codebase' },
      { type: 'changed', description: 'Upgraded Stripe to latest stable v20' },
      { type: 'fixed', description: 'Subscription sync handling for trialing subscriptions' },
      { type: 'fixed', description: 'Vue hydration mismatch on dashboard page' },
      { type: 'fixed', description: 'Play button not updating when audio starts' },
    ],
  },
  {
    version: '0.19.0',
    date: '2026-01-21',
    changes: [
      { type: 'added', description: 'Coming soon page with environment variable toggle' },
      { type: 'added', description: 'Stale-while-revalidate caching with localStorage persistence' },
      { type: 'changed', description: 'Combined Impact and Listening into unified Stats page with tabs' },
      { type: 'changed', description: 'Refactored pages to use Nuxt built-in data fetching' },
      { type: 'fixed', description: 'Notification bell on desktop, changed mark all read to clear all' },
      { type: 'fixed', description: 'Background selector popover and mobile touch handling in expanded player' },
    ],
  },
  {
    version: '0.18.5',
    date: '2026-01-20',
    changes: [
      { type: 'fixed', description: 'Notification bell no longer conflicts with Nuxt UI toast system' },
      { type: 'fixed', description: 'Bell icon now always visible for logged-in users' },
      { type: 'fixed', description: 'Force-fetch notifications on bell click for fresh data' },
      { type: 'fixed', description: 'Duplicate prevention for realtime notifications' },
    ],
  },
  {
    version: '0.18.4',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Deployment Strategy Documentation with go-live plan and invite-only beta system' },
      { type: 'added', description: 'Complete Documentation Index: All 12 docs accessible from /docs page' },
    ],
  },
  {
    version: '0.18.3',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Playlist Collaborator User Search with autocomplete dropdown' },
      { type: 'added', description: 'Collaborator Notifications when added to playlists' },
      { type: 'added', description: 'Searchable Genre Picker on artist settings page' },
      { type: 'changed', description: 'Admin Tab Lazy Loading for faster initial page loads' },
    ],
  },
  {
    version: '0.18.2',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Play Buttons on Discover Page for albums, playlists, and artists' },
      { type: 'added', description: 'ArtistCard and PlaylistCard reusable components' },
      { type: 'added', description: 'Artist Tracks API endpoint' },
      { type: 'changed', description: 'Discover Page section order prioritizes discovery over personalization' },
      { type: 'changed', description: 'Cover URL caching optimization reduces redundant API calls' },
      { type: 'fixed', description: 'Admin Artist Verification error with verified_at column' },
    ],
  },
  {
    version: '0.18.1',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Featured Playlists System with admin management' },
      { type: 'added', description: 'Featured playlists displayed on Discover page' },
    ],
  },
  {
    version: '0.18.0',
    date: '2026-01-19',
    changes: [
      { type: 'added', description: 'Genre Pages: Browse all genres at /genres with artist counts' },
      { type: 'added', description: 'Genre Detail Pages: View all artists in a specific genre at /genres/[genre]' },
      { type: 'added', description: 'Charts Page: Top tracks, albums, and artists with time period filters (7d, 30d, all time)' },
      { type: 'added', description: 'Navigation: Added Charts and Genres links to main navigation' },
    ],
  },
  {
    version: '0.17.1',
    date: '2026-01-19',
    changes: [
      { type: 'fixed', description: 'Mobile: Dashboard now shows artist streams and earnings on small screens' },
      { type: 'fixed', description: 'Mobile: Audio player buttons increased to 40px for better touch targets' },
      { type: 'fixed', description: 'DMCA form submission error due to RLS policy referencing auth.users table' },
    ],
  },
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
