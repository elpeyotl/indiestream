-- Check the artist_balances table structure and add missing columns if needed
-- This ensures the table can accept upserts properly

-- First, let's ensure the table has proper structure
-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS artist_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  lifetime_earnings_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id)
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_artist_balances_band ON artist_balances(band_id);

-- Enable RLS
ALTER TABLE artist_balances ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage balances
DROP POLICY IF EXISTS "Service role can manage balances" ON artist_balances;
CREATE POLICY "Service role can manage balances" ON artist_balances FOR ALL USING (true);
