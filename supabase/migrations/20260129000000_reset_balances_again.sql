-- Reset artist balances again after fixing the recalculation bug
-- This clears all balances so they can be recalculated correctly

-- Delete all balance records to start fresh
DELETE FROM artist_balances;

-- Clear the artist_earnings table
DELETE FROM artist_earnings;

-- Reset revenue periods to allow recalculation
UPDATE revenue_periods SET status = 'pending' WHERE status IN ('calculated', 'calculating');
