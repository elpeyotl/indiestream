-- ============================================
-- Add avatar_key and banner_key for R2 storage
-- ============================================

-- Add key columns for R2 storage (instead of storing presigned URLs which expire)
ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS avatar_key TEXT;
ALTER TABLE public.bands ADD COLUMN IF NOT EXISTS banner_key TEXT;

-- Migrate existing data: if avatar_url contains 'avatars/', extract the key
-- This handles cases where the key was stored in avatar_url
UPDATE public.bands
SET avatar_key = avatar_url
WHERE avatar_url IS NOT NULL AND avatar_url LIKE 'avatars/%';

UPDATE public.bands
SET banner_key = banner_url
WHERE banner_url IS NOT NULL AND banner_url LIKE 'banners/%';
