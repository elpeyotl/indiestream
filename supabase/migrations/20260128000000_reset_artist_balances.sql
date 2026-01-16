-- Reset artist balances due to calculation bug that was doubling amounts
-- This clears all balances so they can be recalculated correctly

-- Reset all balances to zero
UPDATE artist_balances SET balance_cents = 0, lifetime_earnings_cents = 0;

-- Also clear the artist_earnings table to allow fresh recalculation
DELETE FROM artist_earnings;

-- Reset revenue periods to allow recalculation
UPDATE revenue_periods SET status = 'pending' WHERE status IN ('calculated', 'calculating');
