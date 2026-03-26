-- Reset artist balances due to calculation bug that was doubling amounts
-- This clears all balances so they can be recalculated correctly
-- Wrapped in DO block for safety on fresh databases

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_balances') THEN
    UPDATE artist_balances SET balance_cents = 0, lifetime_earnings_cents = 0;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artist_earnings') THEN
    DELETE FROM artist_earnings;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'revenue_periods') THEN
    UPDATE revenue_periods SET status = 'pending' WHERE status IN ('calculated', 'calculating');
  END IF;
END $$;
