-- Artist Payout System Migration
-- Adds tables for Stripe Connect integration, revenue tracking, and payouts

-- Update bands table for Stripe Connect status
ALTER TABLE bands ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected';
-- Status: not_connected, pending, active, restricted

-- Monthly revenue periods
CREATE TABLE IF NOT EXISTS revenue_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_subscription_revenue_cents BIGINT NOT NULL DEFAULT 0,
  total_streams BIGINT NOT NULL DEFAULT 0,
  artist_pool_cents BIGINT NOT NULL DEFAULT 0,
  platform_fee_cents BIGINT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'calculating',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_start, period_end)
);

-- Per-artist earnings per period
CREATE TABLE IF NOT EXISTS artist_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_period_id UUID REFERENCES revenue_periods(id) ON DELETE CASCADE,
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  stream_count BIGINT NOT NULL DEFAULT 0,
  listening_seconds BIGINT NOT NULL DEFAULT 0,
  gross_earnings_cents BIGINT NOT NULL DEFAULT 0,
  net_earnings_cents BIGINT NOT NULL DEFAULT 0,
  payout_status TEXT DEFAULT 'pending',
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Running balance for artists below threshold
CREATE TABLE IF NOT EXISTS artist_balances (
  band_id UUID PRIMARY KEY REFERENCES bands(id) ON DELETE CASCADE,
  balance_cents BIGINT DEFAULT 0,
  lifetime_earnings_cents BIGINT DEFAULT 0,
  last_payout_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout history
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID REFERENCES bands(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_earnings_band ON artist_earnings(band_id);
CREATE INDEX IF NOT EXISTS idx_artist_earnings_period ON artist_earnings(revenue_period_id);
CREATE INDEX IF NOT EXISTS idx_payouts_band ON payouts(band_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_revenue_periods_dates ON revenue_periods(period_start, period_end);

-- RLS Policies
ALTER TABLE revenue_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage revenue periods" ON revenue_periods;
DROP POLICY IF EXISTS "Artists can view revenue periods" ON revenue_periods;
DROP POLICY IF EXISTS "Artists can view own earnings" ON artist_earnings;
DROP POLICY IF EXISTS "Admins can manage artist earnings" ON artist_earnings;
DROP POLICY IF EXISTS "Artists can view own balance" ON artist_balances;
DROP POLICY IF EXISTS "Admins can manage artist balances" ON artist_balances;
DROP POLICY IF EXISTS "Artists can view own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage payouts" ON payouts;

-- Revenue periods: admins can read/write, artists can read
CREATE POLICY "Admins can manage revenue periods"
  ON revenue_periods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Artists can view revenue periods"
  ON revenue_periods FOR SELECT
  USING (true);

-- Artist earnings: artists can view their own
CREATE POLICY "Artists can view own earnings"
  ON artist_earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = artist_earnings.band_id
      AND bands.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage artist earnings"
  ON artist_earnings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Artist balances: artists can view their own
CREATE POLICY "Artists can view own balance"
  ON artist_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = artist_balances.band_id
      AND bands.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage artist balances"
  ON artist_balances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Payouts: artists can view their own
CREATE POLICY "Artists can view own payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bands
      WHERE bands.id = payouts.band_id
      AND bands.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payouts"
  ON payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update artist balance timestamp
CREATE OR REPLACE FUNCTION update_artist_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artist_balances_updated_at ON artist_balances;
CREATE TRIGGER artist_balances_updated_at
  BEFORE UPDATE ON artist_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_balance_timestamp();
