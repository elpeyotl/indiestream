-- Fix foreign key constraint on platform_isrc_allocations to allow band deletion
-- When a band is deleted, set assigned_to_band_id to NULL instead of blocking

ALTER TABLE public.platform_isrc_allocations
  DROP CONSTRAINT IF EXISTS platform_isrc_allocations_assigned_to_band_id_fkey;

ALTER TABLE public.platform_isrc_allocations
  ADD CONSTRAINT platform_isrc_allocations_assigned_to_band_id_fkey
  FOREIGN KEY (assigned_to_band_id)
  REFERENCES public.bands(id)
  ON DELETE SET NULL;
