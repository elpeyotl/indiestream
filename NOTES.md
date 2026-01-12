# Indiestream - Development Notes

## Project Overview
Indiestream is a Bandcamp-clone music streaming platform focused on fair artist compensation. Artists keep 85% of streaming revenue, distributed based on actual listener engagement rather than a pooled model.

## Tech Stack
- **Frontend**: Nuxt 3, Vue 3 (Composition API), TypeScript
- **UI**: Nuxt UI, Tailwind CSS (dark theme with violet/fuchsia accents)
- **Backend**: Nuxt server routes (API)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **File Storage**: Cloudflare R2 (audio files, album covers, avatars)
- **Auth**: Supabase Auth (email/password, magic links)
- **Hosting**: Vercel
- **Payments**: Stripe (planned)

## Live URLs
- **Production**: https://indiestream.vercel.app/
- **GitHub**: https://github.com/elpeyotl/indiestream.git

## Key Architecture Decisions

### File Storage (R2)
- All files (audio, covers, avatars) stored in Cloudflare R2
- Database stores R2 keys (e.g., `covers/album-id/cover.jpg`), not URLs
- Presigned URLs generated on-demand via `/api/stream/[key]` endpoint
- Presigned URLs expire after 1 hour - never store them in database

### Preview Mode
- Non-logged-in users can stream 30 seconds of any track
- Enforced client-side in `usePlayer.ts` composable
- Shows preview badge, progress marker, and sign-up prompt

### Stream Tracking
- Streams recorded after 30 seconds of playback
- `record_stream` database function handles stream counting
- Listening history tracked for logged-in users

### Revenue Model
- $9.99/month subscription for listeners
- 85% goes to artists, 15% platform fee
- Revenue split based on individual listener's time spent per artist

## Database Schema Highlights

### Main Tables
- `profiles` - User accounts (extends Supabase auth)
- `subscriptions` - User subscription status
- `bands` - Artist profiles
- `albums` - Album/EP/Single releases
- `tracks` - Individual songs
- `stream_events` - Streaming history
- `revenue_distributions` - Monthly payout calculations
- `listening_history` - User's recent plays

### Key Columns
- `bands.avatar_key` / `banner_key` - R2 storage keys for images
- `bands.avatar_url` / `banner_url` - Direct URLs (fallback for external images)
- `albums.cover_key` - R2 key for album artwork
- `albums.cover_url` - Direct URL (fallback for external images)
- `tracks.audio_key` - R2 key for audio file

### Image URL Resolution
Pages support both R2 storage keys and direct URLs:
1. If `avatar_key`/`cover_key` exists: Generate presigned R2 URL
2. Otherwise: Use `avatar_url`/`cover_url` directly from database
This allows seeded data with external image URLs to work alongside uploaded files.

## Composables

### usePlayer
Global audio player state management:
- Queue management
- Playback controls
- Preview mode enforcement
- Stream tracking

### useBand
Band/artist CRUD operations

### useAlbum
Album and track management, including R2 URL generation

## Important Files
- `server/api/stream/[key].get.ts` - Generates presigned R2 URLs
- `server/api/upload/presign.post.ts` - Generates upload URLs
- `server/api/dev/seed.post.ts` - Development seed endpoint for sample data
- `composables/usePlayer.ts` - Audio player logic
- `components/AudioPlayer.vue` - Player UI component
- `components/GlobalSearch.vue` - Command palette search (Cmd+K)
- `pages/dashboard/artist/[id].vue` - Artist dashboard (releases, analytics, settings)
- `utils/version.ts` - App version and changelog data
- `pages/changelog.vue` - Public changelog page

## Supabase Configuration
- Site URL must include both localhost and production URL
- Add redirect URLs for auth callbacks
- RLS policies control data access

## Cost Calculation

### Revenue Model
- **Subscription Price**: $9.99/month
- **Artist Share**: 85% ($8.49)
- **Platform Share**: 15% ($1.50)

### Per-Stream Value (Example)
If a subscriber listens 100 hours/month:
- Total listening: 6,000 minutes
- If Artist A gets 60% of listening time (3,600 min): $5.09
- If Artist B gets 30% (1,800 min): $2.55
- If Artist C gets 10% (600 min): $0.85

### Comparison to Traditional Streaming
| Platform | Per-Stream Rate | Streams for $1 |
|----------|-----------------|----------------|
| Spotify  | ~$0.003         | ~333 streams   |
| Apple    | ~$0.007         | ~143 streams   |
| **Indiestream** | ~$0.007+ | Direct split   |

### Infrastructure Costs (Estimated Monthly)

#### Supabase (Free tier covers early stage)
- Free: 500MB database, 1GB file storage, 50K auth users
- Pro ($25/mo): 8GB database, 100GB storage, unlimited auth

#### Cloudflare R2
- Storage: $0.015/GB/month
- Class A ops (writes): $4.50/million
- Class B ops (reads): $0.36/million
- Egress: FREE (this is the big advantage)
- Example: 1TB storage + 10M reads = ~$18.60/month

#### Vercel (Free tier covers early stage)
- Free: 100GB bandwidth, serverless functions
- Pro ($20/mo): 1TB bandwidth, more compute

#### Stripe Fees
- 2.9% + $0.30 per transaction
- On $9.99 subscription: ~$0.59 fee
- Net per subscriber: ~$9.40

### Break-even Analysis
Monthly fixed costs (Pro tiers): ~$65/month
- Need ~7 paying subscribers to cover infrastructure
- Each additional subscriber = ~$1.50 platform revenue (after Stripe)

### Payout Calculation (Monthly)
```
For each artist:
1. Sum all listening_seconds from their streams this month
2. For each subscriber who listened to them:
   - subscriber_share = (artist_seconds / subscriber_total_seconds)
   - artist_amount += subscriber_share * $8.49
3. Total payout = sum of all subscriber contributions
```

## Image Processing

### Server-Side Image Processing (Sharp)
All uploaded images are processed server-side before storage to ensure consistent dimensions:
- **Avatars**: Resized/cropped to 400x400 (square)
- **Album Covers**: Resized/cropped to 600x600 (square)
- **Banners**: Resized/cropped to 1500x500

### Implementation
- `server/api/upload/process-image.post.ts` - Sharp-based image processing endpoint
- Accepts multipart form data with `file`, `type` (avatar/cover/banner), and optional `key`
- Processes images with center-crop to ensure proper aspect ratios
- Uploads directly to R2 after processing
- Returns the R2 key for database storage

### Usage
Image uploads in the dashboard use the `/api/upload/process-image` endpoint instead of direct presigned URL uploads:
- Artist avatar upload (`pages/dashboard/artist/[id].vue`)
- Artist banner upload (`pages/dashboard/artist/[id].vue`)
- Album cover upload - initial (`pages/dashboard/artist/upload.vue`)
- Album cover change - edit modal (`pages/dashboard/artist/[id].vue`)

## Royalties & Licensing Considerations

### Types of Music Royalties

#### 1. Mechanical Royalties
- Paid for reproduction/distribution of music
- Traditionally for physical copies, now applies to streaming
- In US: Handled by Harry Fox Agency, rate set by Copyright Royalty Board
- In EU: Collected by national CMOs (GEMA, SACEM, etc.)
- **For Indiestream**: Required when streaming copyrighted compositions

#### 2. Performance Royalties
- Paid when music is publicly performed or broadcast
- Collected by PROs (Performing Rights Organizations)
- **Major PROs**:
  - US: ASCAP, BMI, SESAC
  - Switzerland: SUISA
  - Germany: GEMA
  - UK: PRS for Music
  - France: SACEM
- **For Indiestream**: Streaming counts as public performance = PRO license required

#### 3. Master Recording Royalties
- Paid to owner of the recording (usually label or artist)
- Separate from composition royalties
- For indie artists who own their masters: They receive this directly
- For signed artists: Label controls this

### The Label/Distributor Question

#### Independent Artists (Own Masters + Publishing)
- Artist owns both recording AND composition
- Can license directly to Indiestream
- No intermediary needed
- Artist agreement covers all rights
- **Simplest case for the platform**

#### Artists with Labels
- Label owns master recording rights
- Need label permission to stream
- Revenue may need to flow through label
- More complex contractual requirements

#### Artists with Publishers
- Publisher controls composition rights
- May still owe PRO royalties even if artist agrees
- Need to verify publishing status

### Licensing Requirements for Indiestream

#### Option A: Indies-Only Platform
- Only accept artists who own all rights
- Require confirmation of rights ownership in artist agreement
- No PRO licensing needed for original compositions
- **Pros**: Simpler, lower cost, cleaner model
- **Cons**: Limits catalog, may exclude some artists

#### Option B: PRO Blanket Licenses
- Obtain blanket licenses from major PROs
- Covers any song in their repertoire
- **Costs** (rough estimates):
  - ASCAP/BMI: Based on revenue, typically 2-5% of streaming revenue
  - SUISA/GEMA: Similar percentage-based fees
  - Need license in each territory you operate
- **Pros**: Can accept any artist
- **Cons**: Significant cost, complex multi-territory compliance

#### Option C: Distributor Partnership
- Partner with aggregator (DistroKid, TuneCore, etc.)
- They handle licensing complexity
- Pass-through model for royalties
- **Pros**: Leverage existing infrastructure
- **Cons**: Reduces margin, less direct artist relationship

### Recommended Approach for MVP

1. **Start with Indies-Only**: Require artists to confirm ownership of all rights
2. **Clear Terms of Service**: Artists represent they own or control all necessary rights
3. **No PRO Covers**: Initially don't allow cover songs (requires mechanical license)
4. **Geographic Focus**: Start in one territory before expanding
5. **Future Expansion**: Add PRO licensing as platform scales

### Key Legal Documents Needed

1. **Artist Agreement**: Must include:
   - Grant of streaming rights
   - Representation of ownership
   - Indemnification clause
   - Revenue share terms

2. **Terms of Service**: For listeners covering:
   - Personal use only
   - No redistribution
   - Subscription terms

3. **Privacy Policy**: GDPR/CCPA compliance for user data

### Cost Impact on Business Model

If PRO licensing is added:
- Current artist share: 85%
- After PRO fees (est. 4%): ~81%
- After payment processing (6%): ~75%
- Platform margin becomes tighter

### Next Steps (Legal/Business)

1. Consult entertainment lawyer for artist agreement template
2. Research PRO licensing costs in target markets
3. Decide on indies-only vs. full catalog strategy
4. Implement rights verification in upload flow
5. Consider sync licensing implications (if adding video)

## Listener Location Tracking

### Purpose
- **PRO Reporting**: Track which territories streams occurred in for royalty reporting
- **Artist Analytics**: Show artists where their listeners are located
- **Tax Compliance**: Help with VAT/sales tax calculations by territory

### Implementation

#### Database
- `listening_history.country_code` - ISO 3166-1 alpha-2 country code (e.g., "US", "DE", "CH")
- Indexed for efficient country-based queries
- Migration: `20260112100000_add_country_tracking.sql`

#### Country Detection
Country is captured automatically from request headers:
1. **Cloudflare**: `CF-IPCountry` header (if using CF proxy)
2. **Vercel**: `X-Vercel-IP-Country` header (automatic on Vercel)
3. Falls back to `null` if neither header present

#### API Endpoints
- `POST /api/streams/record` - Now includes country in stream recording
- `GET /api/analytics/countries` - Returns stream counts by country for a band

#### Database Functions
- `record_stream(track_id, duration, country_code)` - Updated to accept country
- `get_band_streams_by_country(band_id, days)` - Returns aggregated country data

### Artist Dashboard
The Analytics tab now includes a "Listener Locations" card showing:
- Country flags and names
- Stream counts per country
- Visual bar chart comparison
- Respects the selected time period filter (7d, 30d, 90d, All Time)
