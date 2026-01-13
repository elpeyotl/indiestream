-- Update revenue split to be transparent: 70% artist, 15% CMO (SUISA/GEMA), 15% platform
-- This migration adds CMO fee tracking to revenue_periods

-- Add CMO fee column to revenue_periods
ALTER TABLE public.revenue_periods
ADD COLUMN IF NOT EXISTS cmo_fee_cents INTEGER DEFAULT 0;

-- Add comment explaining the revenue split
COMMENT ON TABLE public.revenue_periods IS
'Revenue periods for calculating artist payouts. Split: 70% direct to artists, 15% to CMOs (SUISA/GEMA/etc), 15% platform fee.';

COMMENT ON COLUMN public.revenue_periods.artist_pool_cents IS '70% of subscription revenue goes directly to artists';
COMMENT ON COLUMN public.revenue_periods.cmo_fee_cents IS '15% of subscription revenue goes to Collective Management Organizations (SUISA, GEMA, PRS, ASCAP/BMI) for performance royalties';
COMMENT ON COLUMN public.revenue_periods.platform_fee_cents IS '15% of subscription revenue goes to platform operations';
