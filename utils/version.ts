export const APP_VERSION = '0.4.0'

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
    version: '0.4.0',
    date: '2026-01-12',
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
      { type: 'added', description: 'Library system with Artists, Albums, and Liked Songs tabs' },
      { type: 'added', description: 'Save albums to your library from album pages' },
      { type: 'added', description: 'Like tracks with heart icons on track listings' },
      { type: 'added', description: 'Library link in navigation for logged-in users' },
      { type: 'changed', description: 'Follow artist adds them to Library > Artists' },
      { type: 'fixed', description: 'Artist dashboard now displays actual follower count' },
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
    date: '2026-01-12',
    changes: [
      { type: 'added', description: 'Server-side image processing with Sharp for consistent image dimensions' },
      { type: 'added', description: 'Album cover change feature in edit modal' },
      { type: 'added', description: 'Changelog page and version display in footer' },
      { type: 'changed', description: 'Avatar uploads now auto-resize to 400x400' },
      { type: 'changed', description: 'Album covers now auto-resize to 600x600' },
      { type: 'changed', description: 'Banner images now auto-resize to 1500x500' },
    ],
  },
  {
    version: '0.1.9',
    date: '2025-01-11',
    changes: [
      { type: 'added', description: 'Development seed endpoint for sample data' },
      { type: 'added', description: 'Placeholder images for seeded artists and albums' },
      { type: 'fixed', description: 'Avatar URL fallbacks on discover and artists pages' },
    ],
  },
  {
    version: '0.1.8',
    date: '2025-01-10',
    changes: [
      { type: 'added', description: 'Artist analytics dashboard with stream statistics' },
      { type: 'added', description: 'Album and track editing functionality' },
      { type: 'added', description: 'Toast notifications for API feedback' },
    ],
  },
  {
    version: '0.1.7',
    date: '2025-01-09',
    changes: [
      { type: 'added', description: 'Artist banner image support' },
      { type: 'added', description: 'Bokeh background effect' },
      { type: 'fixed', description: 'Cover image loading on listening history page' },
    ],
  },
  {
    version: '0.1.6',
    date: '2025-01-08',
    changes: [
      { type: 'added', description: 'Global search with Cmd+K shortcut' },
      { type: 'added', description: 'Preview mode for non-subscribers (30 second samples)' },
      { type: 'added', description: 'Stream tracking and listening history' },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-01-01',
    changes: [
      { type: 'added', description: 'Initial release' },
      { type: 'added', description: 'Artist profiles and album uploads' },
      { type: 'added', description: 'Audio streaming with queue management' },
      { type: 'added', description: 'User authentication with Supabase' },
      { type: 'added', description: 'Cloudflare R2 file storage integration' },
    ],
  },
]
