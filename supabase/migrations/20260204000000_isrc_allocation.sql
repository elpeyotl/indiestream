-- Platform ISRC Code Allocation System
-- Allows the platform to assign ISRC codes from our allocated ranges to artists who don't have their own.
-- Codes are recycled when tracks are rejected or deleted.

-- ISRC Code Ranges:
-- 2026: CH4812650000 – CH4812699999 (prefix: CH481265)
-- 2027: CH4812750000 – CH4812799999 (prefix: CH481275)
-- 2028: CH4812850000 – CH4812899999 (prefix: CH481285)

-- Add platform_assigned flag to tracks table
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS isrc_platform_assigned BOOLEAN DEFAULT FALSE;

-- Table to track next available sequence number per year
CREATE TABLE IF NOT EXISTS public.platform_isrc_counters (
  year INTEGER PRIMARY KEY,
  next_sequence INTEGER NOT NULL DEFAULT 0,
  max_sequence INTEGER NOT NULL DEFAULT 49999,
  range_prefix VARCHAR(8) NOT NULL
);

-- Seed the counter data for our allocated ranges
INSERT INTO public.platform_isrc_counters (year, next_sequence, max_sequence, range_prefix)
VALUES
  (2026, 0, 49999, 'CH481265'),
  (2027, 0, 49999, 'CH481275'),
  (2028, 0, 49999, 'CH481285')
ON CONFLICT (year) DO NOTHING;

-- Table to track all platform-assigned ISRCs
CREATE TABLE IF NOT EXISTS public.platform_isrc_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isrc VARCHAR(12) NOT NULL UNIQUE,
  allocation_year INTEGER NOT NULL REFERENCES public.platform_isrc_counters(year),
  sequence_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('available', 'assigned')),
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  assigned_to_band_id UUID REFERENCES public.bands(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  UNIQUE(allocation_year, sequence_number)
);

-- Index for finding available ISRCs quickly
CREATE INDEX IF NOT EXISTS idx_platform_isrc_allocations_available
  ON public.platform_isrc_allocations(status, allocation_year)
  WHERE status = 'available';

-- Index for finding allocations by track
CREATE INDEX IF NOT EXISTS idx_platform_isrc_allocations_track
  ON public.platform_isrc_allocations(track_id)
  WHERE track_id IS NOT NULL;

-- Function to allocate a platform ISRC to a track
CREATE OR REPLACE FUNCTION public.allocate_platform_isrc(
  p_band_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_isrc TEXT;
  v_allocation_id UUID;
  v_year INTEGER;
  v_sequence INTEGER;
  v_prefix VARCHAR(8);
BEGIN
  -- Get current year
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  -- First, try to reuse a recycled ISRC from the current year
  SELECT id, isrc INTO v_allocation_id, v_isrc
  FROM public.platform_isrc_allocations
  WHERE status = 'available' AND allocation_year = v_year
  ORDER BY released_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_allocation_id IS NOT NULL THEN
    -- Reuse the recycled ISRC
    UPDATE public.platform_isrc_allocations
    SET status = 'assigned',
        assigned_to_band_id = p_band_id,
        assigned_at = NOW(),
        released_at = NULL
    WHERE id = v_allocation_id;

    RETURN v_isrc;
  END IF;

  -- No recycled ISRC available, allocate a new one
  -- Lock the counter row to prevent race conditions
  SELECT next_sequence, range_prefix INTO v_sequence, v_prefix
  FROM public.platform_isrc_counters
  WHERE year = v_year
  FOR UPDATE;

  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'No ISRC range configured for year %', v_year;
  END IF;

  -- Check if we've exhausted the range
  IF v_sequence > 49999 THEN
    RAISE EXCEPTION 'ISRC codes exhausted for year %. Please contact support.', v_year;
  END IF;

  -- Build the ISRC code: prefix (8 chars) + 4-digit sequence
  v_isrc := v_prefix || LPAD(v_sequence::TEXT, 4, '0');

  -- Increment the counter
  UPDATE public.platform_isrc_counters
  SET next_sequence = next_sequence + 1
  WHERE year = v_year;

  -- Record the allocation
  INSERT INTO public.platform_isrc_allocations (
    isrc,
    allocation_year,
    sequence_number,
    status,
    assigned_to_band_id,
    assigned_at
  ) VALUES (
    v_isrc,
    v_year,
    v_sequence,
    'assigned',
    p_band_id,
    NOW()
  );

  RETURN v_isrc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release a platform ISRC (makes it available for reuse)
CREATE OR REPLACE FUNCTION public.release_platform_isrc(
  p_track_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_allocation_id UUID;
BEGIN
  -- Find the allocation for this track
  SELECT id INTO v_allocation_id
  FROM public.platform_isrc_allocations
  WHERE track_id = p_track_id AND status = 'assigned'
  FOR UPDATE;

  IF v_allocation_id IS NULL THEN
    -- No platform allocation found for this track
    RETURN FALSE;
  END IF;

  -- Release the ISRC
  UPDATE public.platform_isrc_allocations
  SET status = 'available',
      track_id = NULL,
      released_at = NOW()
  WHERE id = v_allocation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign a generated ISRC to a track
CREATE OR REPLACE FUNCTION public.assign_platform_isrc_to_track(
  p_track_id UUID,
  p_isrc TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the allocation record with the track ID
  UPDATE public.platform_isrc_allocations
  SET track_id = p_track_id
  WHERE isrc = p_isrc AND status = 'assigned';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update the track with the ISRC
  UPDATE public.tracks
  SET isrc = p_isrc,
      isrc_platform_assigned = TRUE
  WHERE id = p_track_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the reject_track function to release platform ISRCs
CREATE OR REPLACE FUNCTION public.reject_track(
  p_track_id UUID,
  p_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_is_platform_assigned BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM public.profiles WHERE id = auth.uid();

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can reject tracks';
  END IF;

  -- Check if track has platform-assigned ISRC
  SELECT isrc_platform_assigned INTO v_is_platform_assigned
  FROM public.tracks WHERE id = p_track_id;

  -- Release the platform ISRC if applicable
  IF v_is_platform_assigned THEN
    PERFORM public.release_platform_isrc(p_track_id);
  END IF;

  -- Update the track (clear ISRC if platform-assigned)
  UPDATE public.tracks
  SET moderation_status = 'rejected',
      moderation_notes = p_notes,
      moderated_at = NOW(),
      moderated_by = auth.uid(),
      isrc = CASE WHEN v_is_platform_assigned THEN NULL ELSE isrc END,
      isrc_platform_assigned = FALSE
  WHERE id = p_track_id;

  UPDATE public.moderation_queue
  SET status = 'rejected',
      notes = p_notes,
      reviewed_by = auth.uid(),
      reviewed_at = NOW()
  WHERE track_id = p_track_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to release ISRC when a track is deleted
CREATE OR REPLACE FUNCTION public.on_track_delete_release_isrc()
RETURNS TRIGGER AS $$
BEGIN
  -- Only release if it was a platform-assigned ISRC
  IF OLD.isrc_platform_assigned THEN
    PERFORM public.release_platform_isrc(OLD.id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_release_isrc_on_track_delete ON public.tracks;
CREATE TRIGGER trigger_release_isrc_on_track_delete
  BEFORE DELETE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.on_track_delete_release_isrc();

-- RLS Policies for platform_isrc_allocations
ALTER TABLE public.platform_isrc_allocations ENABLE ROW LEVEL SECURITY;

-- Admins can view all allocations
CREATE POLICY "Admins can view all ISRC allocations"
  ON public.platform_isrc_allocations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Artists can view their own allocations
CREATE POLICY "Artists can view their own ISRC allocations"
  ON public.platform_isrc_allocations
  FOR SELECT
  TO authenticated
  USING (
    assigned_to_band_id IN (
      SELECT id FROM public.bands WHERE owner_id = auth.uid()
    )
  );

-- RLS for platform_isrc_counters (admin read-only)
ALTER TABLE public.platform_isrc_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ISRC counters"
  ON public.platform_isrc_counters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.allocate_platform_isrc(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_platform_isrc(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_platform_isrc_to_track(UUID, TEXT) TO authenticated;
