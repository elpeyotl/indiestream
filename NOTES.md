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
- `albums.cover_key` - R2 key for album artwork
- `tracks.audio_key` - R2 key for audio file

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
- `composables/usePlayer.ts` - Audio player logic
- `components/AudioPlayer.vue` - Player UI component
- `components/GlobalSearch.vue` - Command palette search (Cmd+K)

## Supabase Configuration
- Site URL must include both localhost and production URL
- Add redirect URLs for auth callbacks
- RLS policies control data access
