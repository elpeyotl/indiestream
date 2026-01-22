# Changelog

## [0.20.0] - 2026-01-22

### Changed
- **Pinia Store Migration**: Migrated all composables to Pinia stores with SWR pattern
  - Deleted 12 composables: useAlbum, usePlayer, usePlaylist, useLibrary, useBand, useUserProfile, useSubscription, useNotifications, useAdminCounts, useStripeConnect, useRecentActivity, useBackgroundEffect
  - New stores in `stores/` directory with `useState` for SSR-safe shared state
  - Stale-while-revalidate caching with background revalidation
  - Proper `storeToRefs` usage for reactive state extraction

### Added
- **@nuxt/image Integration**: Optimized image loading across the app
  - IPX provider with WebP format conversion
  - Presets for album covers (320x320) and avatars (96x96)
  - Applied to: UserAvatar, PlaylistCover, ArtistCard, AudioPlayer, artist/album pages, discover, genres, charts

### Fixed
- **SSR Audit**: Corrected `server: false` settings across all pages
  - Removed incorrect `server: false` from public pages (discover, genres, playlist)
  - Added `server: false` to auth-required dashboard pages
  - Converted client-only fetches to `useLazyAsyncData` where appropriate
- **storeToRefs Patterns**: Fixed reactivity issues from incorrect store destructuring
  - AudioPlayer: `freePlaysRemaining`, `isSubscribed` now use `storeToRefs`
  - Library page: `recentlyPlayed` now uses `storeToRefs`
- **Readonly Warnings**: Removed `readonly()` wrappers from store returns that conflicted with Pinia hydration
  - Fixed in: notifications, adminCounts, recentActivity stores
- **Genres Page 500 Error**: Fixed `loadAvatars` function hoisting issue causing SSR crash
- **Subscription Loading**: Fixed race condition where subscription data wasn't loaded on login
  - Added `immediate: true` watch to auto-fetch on user login
  - Player now awaits subscription fetch before checking play allowance

## [0.19.0] - 2026-01-20

### Added
- **Bulk Upload Feature**: Upload multiple albums and tracks at once via CSV + ZIP file
  - CSV template for metadata (artist, album, tracks with cover art and audio paths)
  - ZIP file containing all audio files and cover art
  - Support for up to 2GB ZIP files via streaming upload to R2
  - Validation step to catch errors before processing
  - Progress tracking during upload
  - Results page showing created artists, albums, and tracks
- **Lossless Audio Requirement**: All audio uploads must be lossless format (WAV, FLAC, AIFF)
  - Ensures highest quality source files for future hi-res streaming tier
  - Rejects lossy formats (MP3, AAC, OGG) at upload time
  - Maximum file size: 300MB per track
  - Clear error messages explaining the requirement
- **Audio Transcoding Infrastructure**: Background transcoding to AAC 256kbps for streaming
  - Dual-format storage: original lossless preserved, AAC version for playback
  - Transcoding queue with automatic job creation on track upload
  - Player automatically uses transcoded version when available
  - Falls back to original if transcoding not yet complete
- **Fly.io Transcoding Worker**: Dedicated worker for audio processing
  - FFmpeg-based transcoding to AAC 256kbps with optimal streaming settings
  - Continuous polling with configurable batch size and interval
  - Stats tracking and graceful shutdown handling
  - Docker deployment with minimal resources (~$2-5/month)

### Technical
- New database columns on tracks table:
  - `original_audio_key`: Stores the lossless source file
  - `original_format`: Format of the original file (wav/flac/aiff)
  - `streaming_audio_key`: Transcoded AAC file for playback
  - `transcoding_status`: Queue status (pending/processing/complete/failed)
- New `transcoding_queue` table with automatic trigger on track insert
- API endpoints:
  - `POST /api/bulk-upload/validate`: Validate CSV + ZIP before processing
  - `POST /api/bulk-upload/presign-zip`: Get presigned URL for large ZIP upload
  - `POST /api/bulk-upload/process`: Process ZIP from R2
  - `GET /api/transcoding/queue`: Fetch pending jobs (worker)
  - `POST /api/transcoding/presign`: Get download/upload URLs (worker)
  - `POST /api/transcoding/complete`: Mark job complete (worker)
- New composable `useBulkUpload` for managing bulk upload state
- Updated `useAlbum` and `usePlayer` to handle dual-format audio

### Fixed
- Bulk upload results page now displays actual cover art and artist avatars

## [0.18.5] - 2026-01-20

### Fixed
- **Notification Bell Bug**: In-app notifications no longer conflict with Nuxt UI toast system
  - Fixed useState key conflict that caused notifications to appear as toasts
  - Notifications now persist correctly and don't disappear when toasts auto-dismiss
- **Notification UX Improvements**: Bell icon now always visible for logged-in users
  - Force-fetch on bell click to ensure fresh notification data
  - Added duplicate prevention for realtime notifications
  - Fixed reactivity issue with "Mark all as read" function

## [0.18.4] - 2026-01-19

### Added
- **Deployment Strategy Documentation**: Comprehensive go-live plan with environment setup, invite-only beta system, and launch checklist
  - Available at `/docs/deployment-strategy` and as PDF
  - Covers Dev + Prod environment setup, database migration, Stripe/R2 configuration
  - Invite-only access feature design for controlled beta launch
- **Complete Documentation Index**: All 12 docs now accessible from `/docs` page
  - Added: Architecture, Business Case, Domain Migration, Native App UX, Content Protection Policy

## [0.18.3] - 2026-01-19

### Added
- **Playlist Collaborator User Search**: Replace email input with searchable user picker
  - Search users by display name with autocomplete dropdown
  - Privacy-focused: only shows partial email hints (e.g., `chr...@gmail.com`)
  - New `/api/users/search` endpoint for authenticated user search
- **Collaborator Notifications**: Users receive in-app notifications when added to a playlist
  - Notification includes playlist name, inviter name, and role (editor/viewer)
  - Links directly to the collaborative playlist
- **Searchable Genre Picker**: Artist settings page now has genre autocomplete (matching admin panel)
  - Case-insensitive matching to prevent duplicate genres
  - Shows existing genres as suggestions while typing

### Changed
- **Admin Tab Lazy Loading**: Tabs now load on-demand instead of all at once
  - Uses `v-if` with `KeepAlive` for lazy mounting
  - Only the active tab fetches data; cached when switching back
  - Significantly reduces initial page load API calls

## [0.18.2] - 2026-01-19

### Added
- **Play Buttons on Discover Page**: Albums, playlists, and artists now have play button overlays
  - Clicking play on an album/playlist queues all tracks and starts playback
  - Clicking play on an artist plays their top tracks shuffled
  - Play buttons appear on hover (desktop) or always visible (mobile)
- **Reusable Card Components**:
  - `ArtistCard.vue`: Artist display with avatar, name, and play button overlay
  - `PlaylistCard.vue`: Playlist display with two styles (overlay for library, simple for discover)
- **Artist Tracks API**: New endpoint `/api/artists/[id]/tracks` to fetch all tracks for an artist

### Changed
- **Discover Page Section Order**: Reordered to prioritize discovery over personalization
  - New order: New Releases → Featured Playlists → Featured Artists → Recently Played → All Artists
  - Recently Played moved lower to emphasize new content discovery
- **Cover URL Caching Optimization**: All pages now use `getCachedCoverUrl` for image loading
  - Reduces redundant R2 presigned URL API calls
  - 10-minute client-side cache for cover URLs
  - Applied to: Discover, Artists, Charts, Library pages
  - Applied to composables: `useDiscover`, `useRecentActivity`

### Fixed
- **Admin Artist Verification**: Fixed error when verifying artists (`verified_at` column doesn't exist)
  - Removed references to non-existent `verified_at` and `verified_by` columns from PATCH endpoint

## [0.18.1] - 2026-01-19

### Added
- **Featured Playlists System**:
  - Admin Playlists tab to manage, feature, and mark playlists as curated
  - Featured playlists displayed on Discover page with cover art support
  - API endpoints for featured playlists (`/api/playlists/featured`) and admin management
  - Database migration adding `is_featured`, `is_curated`, `featured_at`, `featured_by`, `cover_key` columns to playlists table
  - RLS policies for admin playlist management

## [0.18.0] - 2026-01-19

### Added
- **Genre Pages**: Browse all genres at `/genres` with artist counts per genre
- **Genre Detail Pages**: View all artists in a specific genre at `/genres/[genre]` with colorful gradient headers
- **Charts Page**: Top tracks, albums, and artists with time period filters (This Week, This Month, All Time)
- **Navigation**: Added Charts and Genres links to main navigation for both logged-in and logged-out users

## [0.17.1] - 2026-01-19

### Fixed
- **Mobile Dashboard**: Artist streams and earnings now visible on small screens (previously hidden)
- **Audio Player Touch Targets**: Increased button sizes from 32px to 40px for better mobile usability
- **DMCA Form**: Fixed submission error caused by RLS policy referencing auth.users table

## [0.15.0] - 2026-01-19

### Added
- **Content Protection System**:
  - Track reporting: Users can report tracks for copyright violation, AI-generated content, inappropriate content
  - `ReportTrackModal` component with reason selection and optional details/evidence URL
  - Admin Content Reports tab with clickable stat cards for filtering (pending, investigating, resolved, dismissed)
  - Report detail modal showing full reporter info, evidence, and track details
  - Actions: Start Investigation, Mark Resolved, Dismiss, Remove Track
- **Track Removal with Notifications**:
  - Admin can remove reported tracks directly from report modal
  - Deletes audio file from R2 storage
  - Sends email notification to artist explaining removal reason
  - `TrackRemovedEmail` template with appeal instructions
- **DMCA Compliance**:
  - `/dmca` page with DMCA agent info and takedown request form
  - DMCA request API endpoint storing claims in database
  - Counter-notification process documented
- **Upload Safeguards**:
  - AI declaration checkbox: "This music was created by me/my collaborators (not AI-generated)"
  - Copyright warning checkbox with false information consequences
  - ISRC duplicate validation endpoint
- **Database Migration**: New `content_reports` and `dmca_requests` tables, content flags on tracks/albums
- **Content Protection Documentation**: `/docs/content-protection-policy.md` with full DMCA Safe Harbor compliance details

### Changed
- **Admin UI Improvements**:
  - Clickable stat cards on Track Moderation, Artist Approvals, and Content Reports tabs
  - Cards act as filters with colored ring highlight on selection
  - Dropdown filters always visible alongside stat cards
  - Mobile: simplified stats with dropdown filter
- Terms of Service updated with AI-Generated Content Policy section
- Artist Approvals API now returns stats for all statuses (pending, active, rejected)

### Fixed
- Report submission now correctly sends reason value instead of full option object
- Toast notifications work after adding `<UNotifications />` to layout
- Admin reports API uses correct role check (`profile.role === 'admin'`)
- Supabase relationship disambiguation for reporter/resolver foreign keys

## [0.14.3] - 2026-01-16

### Added
- **Admin Payout System Improvements**:
  - Selective artist payouts: Choose which artists to pay instead of paying all at once
  - Payout history view showing all completed, pending, and failed payouts
  - Individual loading states for "Pay Selected" and "Pay All" buttons
- **My Profile link** in user menu (avatar dropdown)
- **Payment History button** on dashboard subscription card

### Changed
- Subscription card UI simplified - removed redundant navigation buttons
- Settings page: Save button moved to bottom after all settings for clarity
- Payout calculations now correctly handle recalculation without doubling balances

### Fixed
- **Impact stats not showing on public profile**: API now correctly saves and reads `show_impact_publicly` setting
- Stripe payout currency changed from USD to CHF to match account configuration
- Payouts table now allows null period columns for combined user payouts

## [0.14.2] - 2026-01-16

### Added
- **Bug Report Page**: New `/bugs` page with embedded Tally form for user feedback
  - Auto-captures technical context (user ID, browser, screen size, timezone, timestamp)
  - Hidden field pre-fills device info for easier debugging
  - Dark theme styling to match IndieStream
- **Admin Album Management**: Full CRUD for albums in admin panel
  - New "Albums" tab with search, filters (published/draft), and pagination
  - Edit all album fields including track moderation status
  - Shared `AlbumEditModal` component for DRY code reuse
  - Delete albums with cascading track/credit removal

### Changed
- Contact page now includes "Report a Bug" card linking to `/bugs`

## [0.14.1] - 2026-01-16

### Added
- **Media Session API**: Lock screen playback controls for mobile devices
  - Track info (title, artist, album, artwork) displayed on lock screen
  - Play/pause, next/previous track controls
  - Seek forward/backward controls
  - Progress bar with position state

### Changed
- **Audio Player UI Improvements**:
  - Play/pause button icons now properly centered in both mini and expanded player
  - Expanded player cover art adapts to viewport height (`40vh`) for better fit on small screens
  - Expanded player layout scrollable with reduced margins for laptop screens
- **User Menu**: Now uses slideover panel instead of dropdown menu

### Fixed
- Mobile player no longer overlaps bottom navigation (accounts for safe area insets)
- Stream counts hidden from public artist pages (visible only to artist owners)
- Album page layout shift on mobile - now uses skeleton loading with smooth image fade-in

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
