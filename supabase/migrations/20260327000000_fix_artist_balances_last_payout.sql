-- Add missing last_payout_at column to artist_balances
ALTER TABLE artist_balances ADD COLUMN IF NOT EXISTS last_payout_at TIMESTAMPTZ;
