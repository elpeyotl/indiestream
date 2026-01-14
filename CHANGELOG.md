# Changelog

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
