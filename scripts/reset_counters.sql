-- ============================================
-- RESET ALL COUNTERS AND STREAMING DATA
-- Run this in Supabase SQL Editor for testing
-- ============================================

-- Reset track stream counts
UPDATE public.tracks SET total_streams = 0;

-- Reset band stream counts and earnings
UPDATE public.bands
SET total_streams = 0,
    total_earnings_cents = 0;

-- Reset free tier counters for all users
UPDATE public.profiles
SET monthly_full_plays = 0,
    play_allowance_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month';

-- Delete all stream events
DELETE FROM public.stream_events;

-- Delete all listening history
DELETE FROM public.listening_history;

-- Delete all revenue distributions
DELETE FROM public.revenue_distributions;

-- Delete all payouts
DELETE FROM public.payouts;

-- Confirmation
SELECT
    'Counters reset successfully' as status,
    (SELECT COUNT(*) FROM tracks WHERE total_streams > 0) as tracks_with_streams,
    (SELECT COUNT(*) FROM bands WHERE total_streams > 0) as bands_with_streams,
    (SELECT COUNT(*) FROM stream_events) as stream_events,
    (SELECT COUNT(*) FROM listening_history) as listening_history,
    (SELECT COUNT(*) FROM profiles WHERE monthly_full_plays > 0) as profiles_with_plays;
