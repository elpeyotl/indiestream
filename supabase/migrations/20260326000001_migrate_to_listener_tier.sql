-- Migration 2/2: Migrate existing data to single 'listener' tier
-- New pricing: CHF 13.00/month, all features included (lossless FLAC, offline, downloads)

-- Migrate existing subscribers from standard/premium to listener
UPDATE public.subscriptions
SET tier = 'listener'
WHERE tier IN ('standard', 'premium');

-- Migrate stream events
UPDATE public.stream_events
SET subscription_tier = 'listener'
WHERE subscription_tier IN ('standard', 'premium');

-- Ensure default is 'free'
ALTER TABLE public.subscriptions
ALTER COLUMN tier SET DEFAULT 'free';
