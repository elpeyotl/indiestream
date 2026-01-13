-- Move Stripe Connect from per-band to per-user level
-- This allows labels/users with multiple bands to use a single Stripe account

-- Add Stripe fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Migrate existing band Stripe accounts to their owners
-- Takes the first connected Stripe account found among user's bands
UPDATE profiles p
SET
  stripe_account_id = b.stripe_account_id,
  stripe_account_status = b.stripe_account_status,
  stripe_onboarding_complete = b.stripe_onboarding_complete
FROM bands b
WHERE b.owner_id = p.id
  AND b.stripe_account_id IS NOT NULL
  AND p.stripe_account_id IS NULL;

-- Note: Keep band Stripe columns for backwards compatibility
-- They can be removed in a future migration after verifying everything works

-- Function to increment band earnings (used by payout processing)
CREATE OR REPLACE FUNCTION increment_band_earnings(p_band_id UUID, p_amount BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE bands
  SET total_earnings_cents = COALESCE(total_earnings_cents, 0) + p_amount
  WHERE id = p_band_id;
END;
$$ LANGUAGE plpgsql;
