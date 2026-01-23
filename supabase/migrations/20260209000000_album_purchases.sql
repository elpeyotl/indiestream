-- Album Purchases Migration
-- Allows users to buy and download albums without a subscription
-- Revenue split: 85% to artist, 15% platform fee

-- Add pricing columns to albums table
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS purchasable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 100),
ADD COLUMN IF NOT EXISTS pay_what_you_want BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_price_cents INTEGER CHECK (minimum_price_cents IS NULL OR minimum_price_cents >= 100);

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),
  artist_share_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_transfer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, album_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_album_id ON purchases(album_id);
CREATE INDEX idx_purchases_band_id ON purchases(band_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);

-- Index for finding purchasable albums
CREATE INDEX idx_albums_purchasable ON albums(purchasable) WHERE purchasable = TRUE;

-- RLS policies
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Band owners can view purchases of their albums
CREATE POLICY "Band owners can view album purchases" ON purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bands WHERE bands.id = purchases.band_id AND bands.owner_id = auth.uid())
  );

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Only service role can insert/update purchases (via API)
CREATE POLICY "Service role can manage purchases" ON purchases
  FOR ALL USING (auth.role() = 'service_role');
