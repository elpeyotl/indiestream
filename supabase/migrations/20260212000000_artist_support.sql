-- Artist Support: Boosts (recurring) and Tips (one-time)
-- Fairtune takes $0 - only Stripe's ~3% transaction fee applies

-- Artist Boost subscriptions (for subscribers)
CREATE TABLE IF NOT EXISTS public.artist_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artist_boosts_user_id ON public.artist_boosts(user_id);
CREATE INDEX idx_artist_boosts_status ON public.artist_boosts(status);

ALTER TABLE public.artist_boosts ENABLE ROW LEVEL SECURITY;

-- Users can read their own boost
CREATE POLICY "Users can view own boost" ON public.artist_boosts
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage boosts (from webhooks)
CREATE POLICY "Service role manages boosts" ON public.artist_boosts
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_artist_boosts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artist_boosts_updated_at ON public.artist_boosts;
CREATE TRIGGER artist_boosts_updated_at
  BEFORE UPDATE ON public.artist_boosts
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_boosts_updated_at();


-- Artist Tips (one-time donations)
CREATE TABLE IF NOT EXISTS public.artist_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  tipper_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for guest tips
  tipper_email TEXT, -- For guest tips and receipts
  tipper_name TEXT, -- Optional display name
  amount_cents INTEGER NOT NULL,
  net_amount_cents INTEGER, -- After Stripe fees (calculated on completion)
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  message TEXT, -- Optional message to artist
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artist_tips_band_id ON public.artist_tips(band_id);
CREATE INDEX idx_artist_tips_status ON public.artist_tips(status);
CREATE INDEX idx_artist_tips_created_at ON public.artist_tips(created_at DESC);

ALTER TABLE public.artist_tips ENABLE ROW LEVEL SECURITY;

-- Artists can see their tips (for their bands)
CREATE POLICY "Artists can view their tips" ON public.artist_tips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bands WHERE id = band_id AND owner_id = auth.uid())
  );

-- Users can see their own sent tips
CREATE POLICY "Users can view own sent tips" ON public.artist_tips
  FOR SELECT USING (auth.uid() = tipper_id);

-- Service role can manage tips (from webhooks)
CREATE POLICY "Service role manages tips" ON public.artist_tips
  FOR ALL USING (auth.role() = 'service_role');
