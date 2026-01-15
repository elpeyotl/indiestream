export const APP_VERSION = '0.15.0'

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
    version: '0.15.0',
    date: '2026-01-15',
    changes: [
      { type: 'added', description: 'Data caching for discover, artist, and album pages - instant back navigation' },
      { type: 'added', description: 'User profile caching with 10-minute TTL' },
      { type: 'fixed', description: 'Avatar flickering on artist page when navigating between artists' },
      { type: 'fixed', description: 'Hydration mismatch errors by migrating composables to useState' },
      { type: 'fixed', description: 'Landing page flash for logged-in users on mobile' },
      { type: 'changed', description: 'Composables now use SSR-safe useState for shared reactive state' },
      { type: 'removed', description: 'Pinia dependency (replaced with simpler composable pattern)' },
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
    version: '0.5.1',
    date: '2026-01-12',
    changes: [
      { type: 'fixed', description: 'Stream recording race condition causing multiple counts per play' },
      { type: 'fixed', description: 'Listening stats now correctly filtered by user (no cross-user leakage)' },
      { type: 'added', description: 'Upgrade prompts in dashboard and listening page for free tier users' },
      { type: 'changed', description: 'Free plays excluded from dashboard stats and listening history' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-01-14',
    changes: [
      { type: 'added', description: 'Artist payout system with Stripe Connect Express' },
      { type: 'added', description: 'Revenue dashboard for artists (balance, earnings, payout history)' },
      { type: 'added', description: 'Admin payout processing' },
      { type: 'added', description: 'Free tier with 5 full-track plays per month for registered users' },
      { type: 'added', description: 'Free plays tracking in dashboard with monthly reset' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-01-13',
    changes: [
      { type: 'added', description: 'Stripe subscription integration with checkout flow' },
      { type: 'added', description: 'Subscription management in dashboard with portal access' },
      { type: 'added', description: '7-day free trial for new Listener subscriptions' },
      { type: 'added', description: 'Google OAuth login and signup' },
    ],
  },
  {
    version: '0.3.1',
    date: '2026-01-12',
    changes: [
      { type: 'added', description: 'Contact form backend with Resend email integration' },
      { type: 'fixed', description: 'Homepage album covers now fall back to cover_url when cover_key is missing' },
      { type: 'changed', description: 'Removed public email addresses from contact page to prevent spam' },
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
    version: '0.2.2',
    date: '2026-01-12',
    changes: [
      { type: 'added', description: 'Follow button on artist pages to track favorite artists' },
      { type: 'added', description: 'Follower count displayed on artist profiles' },
      { type: 'added', description: 'Toast notifications for follow/unfollow actions' },
    ],
  },
  {
    version: '0.2.1',
    date: '2026-01-12',
    changes: [
      { type: 'added', description: 'Listener location tracking for PRO reporting and analytics' },
      { type: 'added', description: 'Country analytics in artist dashboard with flags and stream counts' },
      { type: 'added', description: 'Play All button on artist pages' },
      { type: 'added', description: 'Spotify-style queue panel in audio player' },
      { type: 'fixed', description: 'Bokeh background disabled on mobile devices for performance' },
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
