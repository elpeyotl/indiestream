-- Fix payouts table to make period columns optional and add error_message
-- The period columns are not needed when we're doing combined user payouts

-- Make period_start and period_end nullable
ALTER TABLE public.payouts ALTER COLUMN period_start DROP NOT NULL;
ALTER TABLE public.payouts ALTER COLUMN period_end DROP NOT NULL;

-- Add error_message column for failed payouts
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add policy for service role to insert/update payouts
DROP POLICY IF EXISTS "Service role can manage payouts" ON public.payouts;
CREATE POLICY "Service role can manage payouts" ON public.payouts FOR ALL USING (true);
