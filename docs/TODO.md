# Fairtune - TODO

## Completed Features

### Core Functionality
- [x] User authentication (email/password, email confirmation)
- [x] Artist profile creation and management
- [x] Album/EP/Single upload with cover art
- [x] Track upload with audio files to R2
- [x] Audio player with queue management
- [x] Player controls: shuffle, repeat (off/all/one), heart/favorite
- [x] Media Session API (lock screen controls on mobile)
- [x] Stream tracking (counts after 30 seconds)
- [x] Listening history for logged-in users

### Discovery & Navigation
- [x] Home page with featured artists and new releases
- [x] Discover page with artist grid
- [x] Artists page with search and genre filters
- [x] Global search (Cmd+K) for artists, albums, tracks
- [x] Artist public profile pages
- [x] Album detail pages with track listing

### Preview System
- [x] 30-second preview for non-logged-in users
- [x] Preview UI (badge, progress marker, sign-up prompt)
- [x] Public access to album covers and artist avatars

### Static Pages
- [x] Pricing page (Free, Listener $9.99/mo, Artist tiers)
- [x] About page
- [x] How It Works page
- [x] For Artists landing page
- [x] Terms of Service
- [x] Privacy Policy
- [x] Contact page (UI only, no backend)

### Infrastructure
- [x] Vercel deployment
- [x] Supabase database with RLS
- [x] Cloudflare R2 file storage
- [x] Presigned URL generation for files

---

## Pending Features

### High Priority

#### Payments & Subscriptions
- [x] Stripe integration for subscriptions
- [x] Subscription management (upgrade/downgrade/cancel via Stripe portal)
- [x] Free tier with 5 full-track plays per month
- [x] Payment history page
- [x] Artist payout system (Stripe Connect Express)
- [x] Revenue dashboard for artists (Earnings tab with balance, history)

#### Contact Form
- [x] Backend for contact form (Resend)
- [x] Email notifications (new releases, etc.)

### Medium Priority

#### Social Features
- [x] Follow artists
- [x] User playlists (create, edit, share, collaborative)
- [x] Like/favorite tracks and albums
- [x] Library page (Artists, Albums, Playlists, Liked Songs)
- [x] Share functionality (playlist share links)
- [x] Artist followers tab (discover other fans)

#### Artist Features
- [x] Detailed analytics dashboard (streams, listeners, top tracks, time period filters)
- [ ] Download/purchase option for albums
- [x] Artist banner image upload
- [x] Album/track editing and deletion
- [ ] Release scheduling (set future release date)
- [ ] Pre-save functionality
- [x] ISRC/ISWC metadata for tracks (with Deezer/MusicBrainz lookup)
- [x] Composer credits with splits (name, role, IPI number, percentage)
- [x] Cover song flagging
- [x] Rights confirmation on publish
- [x] Lyrics language field (ISO 639-1 codes + Instrumental option, with Author credit validation)

#### User Features
- [x] User profile page (public profiles with followed artists, settings page with avatar upload)
- [x] Listening stats/wrapped (comprehensive stats dashboard with This Year/Last Month/All Time views)
- [x] "Where your money went" monthly breakdown (My Impact page with This Month/Last Month/All Time views)
- [x] Social sharing of impact stats (shareable URLs with customizable visibility, colorful share cards)
- [x] Public impact stats on user profiles (opt-in privacy toggle in settings)

### Lower Priority

#### Admin Dashboard
- [x] Admin middleware and route protection
- [x] Platform stats overview (users, artists, tracks, streams)
- [x] User management (list, search, pagination)
- [x] Delete users (cascades to all their data)
- [x] Change user roles (user/artist/admin)
- [x] PRO export for SUISA/GEMA reporting (CSV with ISRC, composers, territories)
- [x] Artist/band management (list, delete, feature/unfeature, full edit, verify, suspend)
- [x] Content moderation queue (review flagged/new uploads)
- [x] Track approval workflow (pending → approved/rejected, re-review on edits)
- [x] Artist verification system (admin can verify artists with badge)
- [x] Revenue dashboard (subscriptions, payouts, charts)
- [x] Growth metrics over time (subscriber growth, artist growth charts)
- [x] Audit logging system (track all admin actions with timestamp, user, old/new values)

#### Platform
- [ ] Mobile responsive improvements
- [ ] PWA support (full offline mode)
- [ ] Offline playback (for subscribers)
- [x] Social login (Google OAuth)
- [x] Email notifications (new releases from followed artists)

#### Native App UX (Phase 1 - See docs/NATIVE_APP_UX.md)
- [x] Smart landing page redirect (logged-in users → /discover)
- [x] Mobile bottom navigation bar (5 icons: Discover, Search, Library, Profile, Now Playing)
- [x] Clean up navigation for logged-in users (remove marketing links)
- [x] PWA manifest and meta tags (installable app)

#### Native App UX (Phase 2 - See docs/NATIVE_APP_UX.md)
- [x] Pull-to-refresh on discover, library, and artist profile pages
- [x] Smooth transitions and animations (global CSS variables and classes)
- [x] Haptic feedback composable (useHaptics)
- [ ] Swipe gestures on track rows
- [ ] Long-press context menus

#### Native Mobile Apps (Phase 3 - Post-Launch)
- [ ] React Native (Expo) app for iOS/Android
- [ ] react-native-track-player for background audio, lock screen controls, CarPlay/Android Auto
- [ ] Shared backend (same Supabase API)
- [ ] Shared design tokens (colors, spacing, typography)
- [ ] Offline playback support
- [ ] Push notifications

#### Discovery
- [x] Genre pages (browse by genre, genre detail pages with artist filtering, featured genres system)
- [x] Curated playlists
- [ ] "Similar artists" recommendations
- [x] Charts/trending (top tracks, albums, artists by period)

#### Merchandise / Store (Nice to Have)
- [ ] Digital downloads (albums, stems, sample packs)
- [ ] Physical merch via Printful/Gelato integration
- [ ] Products table (title, price, images, stock, type)
- [ ] Orders and order_items tables
- [ ] Cart and checkout flow
- [ ] Order history for buyers and sellers
- [ ] Shipping calculation (for physical goods)
- [ ] Tax handling (complex for physical goods)

---

## Known Issues
- None currently tracked

---

## Database Migrations to Run
All migrations should be run in Supabase SQL Editor in order:
1. `20260111150000_initial_schema.sql` - Core tables (includes moderation_queue table)
2. `20260111160000_add_storage_keys.sql` - R2 storage columns
3. `20260111170000_listening_history.sql` - Listening history table
4. `20260111180000_add_avatar_banner_keys.sql` - Avatar/banner keys for bands
5. `20260112100000_add_country_tracking.sql` - Listener location tracking
6. `20260112110000_add_follows.sql` - Artist follows table
7. `20260112120000_add_library.sql` - Saved albums and liked tracks
8. `20260112130000_add_subscriptions.sql` - Stripe subscription fields
9. `20260112140000_add_free_tier_tracking.sql` - Free tier with 5 plays/month
10. `20260113_add_rights_metadata.sql` - ISRC/ISWC, track credits, album rights metadata
11. `20260114000000_add_profile_fields.sql` - User profile fields (avatar_key, bio, location, website)
12. `20260114_artist_payouts.sql` - Stripe Connect, artist balances, payouts tables
13. `20260115120000_playlists.sql` - Collaborative playlists with owner/editor/viewer roles
14. `20260115130000_fix_playlist_rls.sql` - Fix playlist RLS policies
15. `20260115140000_fix_all_playlist_rls.sql` - Fix all playlist RLS policies
16. `20260115150000_impact_sharing.sql` - Impact sharing tokens and public profile visibility
17. `20260115_artist_own_music_exemption.sql` - Artists can listen to own music unlimited
18. `20260116000000_admin_artist_management.sql` - Admin artist management (feature, verify, suspend, flags)
19. `20260116_transparent_revenue_split.sql` - Transparent 70/15/15 revenue split
20. `20260117000000_moderation_queue_trigger.sql` - Auto-populate moderation queue on track upload
21. `20260117_backfill_country_codes.sql` - Backfill country codes
22. `20260118000000_platform_settings.sql` - Platform settings table for admin config
23. `20260118_unique_isrc.sql` - Unique ISRC constraint
24. `20260119_remove_share_percentage.sql` - Remove share percentage from credits
25. `20260120_user_level_stripe.sql` - User-level Stripe Connect
26. `20260121000000_notifications.sql` - Notifications table
27. `20260121000001_notifications_realtime.sql` - Enable realtime for notifications
28. `20260122000000_artist_approval.sql` - Artist approval workflow
29. `20260122000001_fix_bands_status_constraint.sql` - Fix bands status constraint
30. `20260123000000_artist_social_links.sql` - Artist social media links
31. `20260124000000_notifications_delete_policy.sql` - Notifications delete policy
32. `20260125000000_moderation_queue_unique_track.sql` - Unique track constraint on moderation queue
33. `20260125000001_pending_update_status.sql` - Add pending_update status for re-review
34. `20260125000002_pending_update_rls.sql` - RLS for pending_update status
35. `20260202000000_featured_playlists.sql` - Featured playlists system
36. `20260207000000_featured_genres.sql` - Admin-controlled featured genres
37. `20260207000001_lyrics_language.sql` - Lyrics language field for tracks
38. `20260208000000_admin_audit_logs.sql` - Admin audit logging table

---

## Development Tools

### Seed Endpoint
`POST /api/dev/seed` - Development-only endpoint to populate sample data

**Requires:**
- `SUPABASE_SERVICE_KEY` in `.env` (service role key from Supabase dashboard)
- User must be logged in

**Creates:**
- 5 sample bands with avatars, banners, and theme colors
- 8 albums with cover images
- ~35 tracks

**Usage:**
```javascript
fetch('/api/dev/seed', { method: 'POST', credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

Note: Re-running the seed will delete and recreate the sample data.
