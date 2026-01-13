-- Remove share_percentage from track_credits
-- This field is no longer needed - PRO reporting doesn't require individual share splits

ALTER TABLE track_credits DROP COLUMN IF EXISTS share_percentage;
