# Free Tier Business Logic

## Overview

Fairtune offers a free tier with limited full-track access to encourage user sign-ups while protecting artist revenue. This document describes the implementation and business rules.

## User Tiers

| Tier | Description | Full Track Access | Artist Stream Count | Artist Payout |
|------|-------------|-------------------|---------------------|---------------|
| **Anonymous** | Not logged in | 30-second preview only | No | No |
| **Free** | Logged in, no subscription | 5 full tracks/month + 30s previews | No | No |
| **Subscriber** | Active subscription (including trial) | Unlimited | Yes | Yes |

## Key Business Rules

### 1. Free Plays Don't Count for Artists

When a free user plays a full track:
- The play is recorded in `listening_history` with `is_free_play = true`
- **NO increment** to `tracks.stream_count`
- **NO increment** to `bands.total_streams`
- **NOT included** in artist analytics/dashboard
- **NOT included** in payout calculations

This ensures artists only see and get paid for streams that generate revenue.

### 2. Monthly Allowance

- Free users get **5 full-track plays per month**
- Counter resets on the **1st of each month at 00:00 UTC**
- After exhausting free plays, users get 30-second previews (same as anonymous)

### 3. Subscription Check Priority

When a user plays a track, the system checks in order:
1. **Not logged in?** → 30-second preview
2. **Has active subscription?** → Full access (counts for artist)
3. **Has free plays remaining?** → Full access (does NOT count for artist)
4. **No free plays left?** → 30-second preview + upgrade prompt

## Database Schema

### Profiles Table (extended)

```sql
ALTER TABLE public.profiles
ADD COLUMN monthly_full_plays INTEGER DEFAULT 0,
ADD COLUMN play_allowance_reset_at TIMESTAMPTZ DEFAULT NOW();
```

### Listening History Table (extended)

```sql
ALTER TABLE public.listening_history
ADD COLUMN is_free_play BOOLEAN DEFAULT FALSE;
```

## Database Functions

### `check_free_play_allowance()`

Returns one of:
- `'subscribed'` - User has active subscription
- `'allowed'` - User can use a free play
- `'limit_reached'` - User has exhausted free plays
- `'unauthenticated'` - No user logged in

### `use_free_play()`

Increments `monthly_full_plays` counter. Called when recording a free stream.

### `get_free_tier_status()`

Returns:
- `plays_used` - Number of free plays used this month
- `plays_remaining` - Number of free plays left (max 5)
- `resets_at` - When the counter resets (1st of next month)
- `is_subscribed` - Whether user has active subscription

### `record_stream(p_track_id, p_duration_seconds, p_country_code, p_is_free_play)`

Updated to accept `p_is_free_play` parameter. When `true`:
- Records to `listening_history` with `is_free_play = true`
- **Skips** incrementing stream counts

## API Endpoints

### `GET /api/free-tier/status`

Returns current user's free tier status:
```json
{
  "playsUsed": 2,
  "playsRemaining": 3,
  "resetsAt": "2026-02-01T00:00:00.000Z",
  "isSubscribed": false,
  "isAuthenticated": true
}
```

### `POST /api/free-tier/check`

Checks if user can play a full track:
```json
{
  "canPlay": true,
  "reason": "allowed",
  "isSubscribed": false,
  "isFree": true
}
```

### `POST /api/streams/record`

Updated to accept `isFreePlay` in body:
```json
{
  "trackId": "uuid",
  "durationSeconds": 180,
  "isFreePlay": true
}
```

## Frontend Implementation

### useSubscription Composable

New exports:
- `freeTierStatus` - Reactive object with plays used/remaining/reset date
- `canPlayFullTracks` - Computed: true if subscribed OR has free plays
- `freePlaysRemaining` - Computed: number of plays left (Infinity if subscribed)
- `useFreePlays()` - Decrements local counter when using a free play

### usePlayer Composable

New state:
- `isFreePlay` - Whether current track is being played as a free play
- `showUpgradePrompt` - Whether to show upgrade banner

New logic in `resetStreamTracking()`:
1. Check play allowance type (full/free/preview)
2. Set `isPreviewMode` if no access
3. Set `isFreePlay` if using free tier
4. Show upgrade prompt if logged in but out of plays

### AudioPlayer Component

UI feedback:
- Shows "Free Play (X left)" badge during free plays
- Shows upgrade banner when free plays exhausted
- Different messaging for anonymous vs logged-in users

### Dashboard

- Shows free plays remaining with progress bar
- Shows reset date
- Prominent upgrade CTA

## User Experience Flow

### Anonymous User
1. Clicks play → 30-second preview starts
2. At 30 seconds → Playback stops, "Sign up" prompt shown
3. Signs up → Gets 5 free full-track plays

### Free User (with plays remaining)
1. Clicks play → Full track plays
2. Badge shows "Free Play (X left)"
3. After 30 seconds → Stream recorded as free play (no artist credit)
4. Counter decremented

### Free User (no plays remaining)
1. Clicks play → 30-second preview starts
2. Upgrade banner appears: "You've used your 5 free tracks this month"
3. At 30 seconds → Playback stops, "Subscribe" prompt shown

### Subscriber
1. Clicks play → Full track plays
2. No badges or prompts
3. After 30 seconds → Stream recorded (counts for artist)

## Analytics Exclusion

The `get_band_streams_by_country()` function excludes free plays:

```sql
WHERE lh.is_free_play = false  -- Exclude free plays from artist analytics
```

This ensures artist dashboards only show monetized streams.

## Configuration

Currently hardcoded values (can be moved to config):
- **Free plays per month:** 5
- **Preview duration:** 30 seconds
- **Reset timing:** 1st of each month, 00:00 UTC

## Files Modified/Created

### New Files
- `supabase/migrations/20260112140000_add_free_tier_tracking.sql`
- `server/api/free-tier/status.get.ts`
- `server/api/free-tier/check.post.ts`
- `docs/FREE_TIER_BUSINESS_LOGIC.md`

### Modified Files
- `server/api/streams/record.post.ts` - Added `isFreePlay` handling
- `composables/useSubscription.ts` - Added free tier state
- `composables/usePlayer.ts` - Added free tier playback logic
- `components/AudioPlayer.vue` - Added free tier UI
- `pages/dashboard/index.vue` - Added free plays display

## Dashboard Display Logic

### Current Behavior

Free tier users see:
- **"X/5 free plays remaining"** counter in dashboard
- **Empty stats** (0 hours, 0 streams, 0 artists) - because free plays are excluded
- **Empty listening history** - free plays don't appear in history

Subscribers see:
- Full listening stats
- Complete listening history
- No free play counter

### Upgrade Prompt Opportunity

**TODO:** Add messaging in dashboard/listening pages for free users:

- When stats show 0: *"Subscribe to track your listening and support artists directly"*
- In empty listening history: *"Upgrade to see your full listening history and contribute to artist streams"*

This provides clear value proposition without being intrusive.

## Future Considerations

1. **Configurable limits** - Move 5 plays/month to database or env config
2. **Platform subsidy** - Option to pay artists a small amount for free plays
3. **Ad-supported tier** - Show ads to free users, share ad revenue with artists
4. **Referral bonus** - Give extra free plays for referrals
5. **Artist-specific free plays** - Let artists offer free plays for their music
6. **Upgrade prompts in empty states** - Show contextual upgrade messaging where stats/history would appear
