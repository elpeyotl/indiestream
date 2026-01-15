# Changelog

## [0.14.0] - 2026-01-16

### Added
- **Admin Artist/Band Management**: New comprehensive artist management tools for admins
  - New "Artists" tab in admin dashboard with searchable, filterable list
  - List all artists with owner info, stats (albums, tracks, streams), status, and badges
  - Filter by status (active, suspended, removed), featured status, and verified status
  - **Full edit capabilities**: Admins can edit all artist fields including name, slug, bio, location, website, genres
  - **Feature/unfeature artists**: Control which artists appear on the homepage
  - **Verify artists**: Mark artists as verified with blue checkmark badge
  - **Status management**: Set artist status to active, suspended, or removed with suspension reasons
  - **Delete artists**: Remove artists and all associated data (albums, tracks, analytics, earnings)
  - Pagination support for large artist lists
  - Real-time search with debouncing

### Database
- **Migration 20260116000000_admin_artist_management.sql**: Added artist management fields
  - `is_featured` (boolean): Whether artist is featured on homepage
  - `featured_at` (timestamptz): When artist was featured
  - `featured_by` (uuid): Admin who featured the artist
  - `status` (text): Artist account status (active/suspended/removed)
  - `flag_count` (integer): Number of flags/reports against artist
  - `suspended_at` (timestamptz): When artist was suspended
  - `suspended_by` (uuid): Admin who suspended the artist
  - `suspension_reason` (text): Reason for suspension
  - Created indexes for efficient admin queries
  - Added RLS policies for admin full access

### API
- **GET /api/admin/bands**: List all bands with filters, search, and pagination
- **PATCH /api/admin/bands/[id]**: Update any band field (admin full control)
- **DELETE /api/admin/bands/[id]**: Delete band and cascade all data

## [0.13.1] - 2026-01-15

### Changed
- **Enhanced Impact Share Page Visual Design**: Made the share page more colorful and engaging
  - Added colorful gradient backgrounds with distinct colors for each stat (emerald for earnings, violet for artists, amber for time, fuchsia for streams)
  - Added icon badges for each stat card (dollar, user-group, clock, musical-note)
  - Enhanced artist breakdown with artist avatar thumbnails
  - Added rank badges (1, 2, 3...) for top artists
  - Added hover effects and gradient text for earnings
  - Improved overall color scheme with multi-color gradients (violet → fuchsia → pink)
  - Shows additional artist details (stream count and listening time)

## [0.13.0] - 2026-01-15

### Added
- **"This Month" Tab**: Added "This Month" period to My Impact page alongside "Last Month" and "All Time"
  - Shows real-time impact stats for the current calendar month
  - Dashboard hero card now defaults to showing "This Month" data
  - Encourages daily listening by showing impact grow in real-time
- **Social Impact Sharing**: Users can now share their impact stats publicly
  - Generate shareable links with customizable stats visibility
  - Choose which period to share (This Month, Last Month, All Time)
  - Select which stats to display (total earned, artists supported, listening time, streams, artist breakdown)
  - Public share page at `/impact/share/[token]` with clean design
  - Social media sharing buttons for Twitter and Facebook
  - Copy-to-clipboard functionality for easy sharing
  - View count tracking for shared links
- **User Profile Impact Stats**: Optional public display of impact on user profiles
  - Privacy toggle in settings to show/hide impact stats publicly
  - All-time impact stats displayed on `/user/[id]` pages when opted in
  - Shows total earned by artists, artists supported, listening time, and stream count
  - Helps build community around supporting artists
- ShareImpactModal component for managing share settings
- Database table `impact_shares` for storing share preferences and tokens
- Database column `show_impact_publicly` in profiles for privacy control

### Changed
- Default period on My Impact page changed from "Last Month" to "This Month"
- Dashboard hero card now fetches "This Month" data instead of "All Time"
- My Impact page now shows "Share" button for subscribed users

### Technical
- API endpoint `/api/listener/money-distribution.get.ts` now supports 'this-month' period
- New API endpoints:
  - `POST /api/impact/share` for creating share tokens
  - `GET /api/impact/share/[token]` for fetching shared impact data
  - `GET /api/user/[id]/impact-stats` for public profile impact stats
- Updated TypeScript types to include 'this-month' period
- Token generation using Node.js crypto (base64url encoding)
- RLS policies for impact_shares table (user can manage own, anyone can view by token)

## [0.12.0] - 2026-01-15

### Added
- **My Impact Prominence**: Enhanced visibility of the My Impact feature for subscribers:
  - **Mobile Bottom Nav**: Added "My Impact" button (heart icon) to mobile bottom navigation for subscribers, replacing Search button (Search remains accessible via top nav)
  - **Dashboard Hero Card**: Prominent gradient card at top of dashboard showing:
    - Total earnings sent to artists (all-time)
    - Number of artists supported
    - This month's impact earnings
    - "View Full Impact Report" CTA button
    - Empty state for new subscribers with encouraging message
  - **Navigation Reordering**: Mobile nav now ordered: Discover → Library → Listening → Impact
  - Reinforces Indiestream's "Stream Fair. Support Direct." value proposition
  - Back button automatically hidden on My Impact page

### Technical
- Integrated global `useSubscription` composable for consistent subscription status
- Added subscription-aware conditional rendering in mobile navigation
- Implemented real-time impact stats calculation from `useMoneyDistribution`
- Added watcher for subscription status changes to fetch impact data dynamically

## [0.11.0] - 2026-01-14

### Added
- **Playlists**: Full playlist system with collaborative features:
  - Create, edit, and delete custom playlists
  - Add/remove tracks from playlists with "Add to Playlist" menu
  - Drag-and-drop track reordering within playlists
  - Collaborative playlists with owner/editor/viewer roles
  - Public playlist sharing with shareable links
  - Private/public playlist visibility settings
  - "Liked Songs" as a special system playlist
  - Playlist tab in Library page alongside Artists and Albums
- **AddToPlaylistMenu Component**: Context menu for adding tracks to any playlist
- **Playlist Detail Page**: Dedicated page at `/playlist/[id]` with:
  - Full track listing with album covers
  - Playlist metadata (title, description, track count, duration)
  - Collaborator management interface
  - Play all tracks functionality
  - Drag-and-drop reordering
- **Shared Playlist View**: Public view at `/playlist/share/[token]` for shared playlists
- Database migrations for playlists, playlist_tracks, and playlist_collaborators tables
- Comprehensive E2E tests for playlist functionality

### Technical
- usePlaylist composable for centralized playlist state management
- Proper RLS policies for playlists with role-based access control
- Track position management with automatic reordering
- Share token generation for public playlist links
- Three separate migrations to ensure correct RLS behavior

## [0.10.0] - 2026-01-14

### Added
- **User Profiles**: Public profile pages at `/user/[id]` featuring:
  - Display name, avatar with initials fallback, bio, location, and website
  - Grid display of followed artists (shows 8, expandable to all)
  - Member since date and profile metadata
  - Responsive design (2-4 column grid based on screen size)
- **Settings Page**: Profile management at `/dashboard/settings` with:
  - Profile editing: display name, bio (280 char limit with counter), location, website
  - Avatar upload to R2 storage (5MB max, JPEG/PNG/WebP/GIF)
  - Form validation (bio length, website URL format)
  - Auto-redirect to public profile after saving
- **Profile Discovery**: Community features for user discovery:
  - "My Profile" button in dashboard for quick access
  - "Followers" tab on artist pages showing all fans
  - Clickable follower count that navigates to Followers tab
  - View any user's profile and discover shared music taste
- **UserAvatar Component**: Reusable avatar component with automatic initials fallback
- Database migration for profile fields (avatar_key, bio, location, website)
- Profile API endpoints with proper authentication and R2 integration

### Technical
- Server-side R2 integration for avatar storage with presigned URLs
- Proper snake_case ↔ camelCase mapping between database and frontend
- Index-based tab selection synced with URL query parameters
- Two-query approach for followers to work around foreign key limitations
- Form validation on both client and server side

## [0.9.0] - 2026-01-14

### Added
- **Listening Stats/Wrapped**: Comprehensive stats dashboard at `/dashboard/stats` showing:
  - Overview metrics: total listening time, streams, unique artists/tracks/albums
  - Listening patterns: most active day/hour, 24-hour listening chart, listening streaks
  - Top 10 artists, tracks, and albums with play counts and percentages
  - Top 5 genres with stream counts
  - Discovery metrics: new artists discovered, diversity score, repeat listener score
  - Fun facts: longest streak, top listening day, total days with listening
  - Period selector: This Year / Last Month / All Time views
- **"My Impact" page**: Transparency feature at `/dashboard/my-impact` showing:
  - Revenue split visualization (70% artists, 15% CMOs, 15% platform)
  - All Time and Last Month views
  - Artist breakdown showing exactly how subscription money is distributed
  - Total paid, artist pool, and per-artist earnings
- Stats promo card on listening history page linking to full stats
- Stats navigation button on main dashboard

## [0.8.0] - 2026-01-14

### Added
- **Player controls**: Heart/favorite button to like currently playing track
- **Shuffle mode**: Randomizes queue playback order while keeping current track playing
- **Repeat modes**: Cycle through off → repeat all → repeat one
- Shuffle and repeat controls visible in both mini player and expanded view
- Heart button syncs with library liked tracks

### Changed
- Player UI now shows shuffle (Lucide icon) and repeat controls alongside play/pause
- Next button disabled logic updated to respect repeat mode

## [0.7.0] - 2026-01-20

### Added
- **User-level Stripe Connect**: Labels and users with multiple artists now connect ONE Stripe account and receive combined payouts for all their bands
- **Combined earnings dashboard** at `/dashboard/earnings` showing total balance, per-band breakdown, and payout history
- **Listener location tracking**: Stream analytics now include country codes for geographic insights
- **Deezer API integration** for ISRC lookup (replaced Spotify)
- **CISAC ISWC lookup link** in upload form for composer metadata

### Changed
- Stripe Connect moved from per-band to per-user (profiles table)
- Payout processing now groups bands by owner and sends single combined transfers
- Artist dashboard earnings tab now links to combined earnings page
- Discover page avatar placeholders now properly square
- Removed `share_percentage` from composer credits (not needed for PRO reporting)

### Fixed
- Artist avatar images loading correctly on upload page
- Square aspect ratio for artist placeholder avatars on discover page

## [0.6.0] - 2026-01-19

### Added
- Artist rights metadata (ISRC, ISWC, composer credits)
- PRO export for SUISA/GEMA reporting
- "85% Music Rights" marketing messaging

### Changed
- Revenue split updated to transparent 70/15/15 model (70% artists, 15% CMOs, 15% platform)
- Artists can listen to their own music unlimited (doesn't count against free tier)

## [0.5.0] - 2026-01-14

### Added
- Artist payout system with Stripe Connect Express
- Revenue dashboard for artists (balance, earnings, payout history)
- Admin payout processing

## [0.4.0] - 2026-01-13

### Added
- Stripe subscription integration
- Free tier with 5 full-track plays per month
- Subscription management via Stripe portal

## [0.3.0] - 2026-01-12

### Added
- Follow artists functionality
- Library page (Artists, Albums, Liked Songs)
- Listening history tracking
- Country tracking for streams

## [0.2.0] - 2026-01-11

### Added
- Audio player with queue management
- Album/track upload with R2 storage
- Artist profile management
- Discover and search functionality

## [0.1.0] - 2026-01-10

### Added
- Initial release
- User authentication
- Basic artist and album pages
- Supabase database setup
