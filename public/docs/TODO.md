# Indiestream - TODO

## Completed Features

### Core Functionality
- [x] User authentication (email/password, email confirmation)
- [x] Artist profile creation and management
- [x] Album/EP/Single upload with cover art
- [x] Track upload with audio files to R2
- [x] Audio player with queue management
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
- [ ] Payment history page
- [ ] Artist payout system (Stripe Connect)
- [ ] Revenue dashboard for artists

#### Contact Form
- [x] Backend for contact form (Resend)
- [ ] Email notifications (new releases, etc.)

### Medium Priority

#### Social Features
- [x] Follow artists
- [ ] User playlists (create, edit, share)
- [x] Like/favorite tracks and albums
- [x] Library page (Artists, Albums, Liked Songs)
- [ ] Share functionality

#### Artist Features
- [x] Detailed analytics dashboard (streams, listeners, top tracks, time period filters)
- [ ] Download/purchase option for albums
- [x] Artist banner image upload
- [x] Album/track editing and deletion
- [ ] Release scheduling (set future release date)
- [ ] Pre-save functionality

#### User Features
- [ ] User profile page
- [ ] Listening stats/wrapped
- [ ] "Where your money went" monthly breakdown

### Lower Priority

#### Admin
- [ ] Admin panel for content moderation
- [ ] Artist verification system
- [ ] Track approval workflow

#### Platform
- [ ] Mobile responsive improvements
- [ ] PWA support
- [ ] Offline playback (for subscribers)
- [x] Social login (Google OAuth)
- [ ] Apple login
- [ ] Email notifications (new releases from followed artists)

#### Discovery
- [ ] Genre pages
- [ ] Curated playlists
- [ ] "Similar artists" recommendations
- [ ] Charts/trending

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
1. `20260111150000_initial_schema.sql` - Core tables
2. `20260111160000_add_storage_keys.sql` - R2 storage columns
3. `20260111170000_listening_history.sql` - Listening history table
4. `20260111180000_add_avatar_banner_keys.sql` - Avatar/banner keys for bands
5. `20260112100000_add_country_tracking.sql` - Listener location tracking
6. `20260112110000_add_follows.sql` - Artist follows table
7. `20260112120000_add_library.sql` - Saved albums and liked tracks
8. `20260112130000_add_subscriptions.sql` - Stripe subscription fields
9. `20260112140000_add_free_tier_tracking.sql` - Free tier with 5 plays/month

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
