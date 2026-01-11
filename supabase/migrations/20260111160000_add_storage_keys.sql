-- ============================================
-- Add storage keys for R2 integration
-- ============================================

-- Add cover_key to albums (R2 storage key for cover art)
ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS cover_key TEXT;

-- Add total_streams to albums
ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS total_streams BIGINT DEFAULT 0;

-- Modify tracks table for R2 storage
-- audio_key stores the R2 object key
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS audio_key TEXT;

-- Preview start position (in seconds) for non-subscribers
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS preview_start_seconds INTEGER DEFAULT 0;

-- Stream count per track
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS stream_count BIGINT DEFAULT 0;

-- Keep band_id in tracks for now (has dependencies)
-- We can get band_id through album anyway, but keeping it for existing queries

-- Update RLS policies for tracks
DROP POLICY IF EXISTS "Approved tracks in published albums are viewable" ON public.tracks;
DROP POLICY IF EXISTS "Band owners can manage their tracks" ON public.tracks;

CREATE POLICY "Tracks in published albums are viewable" ON public.tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.albums a
            WHERE a.id = tracks.album_id
            AND a.is_published = true
        )
        OR EXISTS (
            SELECT 1 FROM public.bands b
            WHERE b.id = tracks.band_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Band owners can insert tracks" ON public.tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bands b
            WHERE b.id = band_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Band owners can update their tracks" ON public.tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bands b
            WHERE b.id = tracks.band_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Band owners can delete their tracks" ON public.tracks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.bands b
            WHERE b.id = tracks.band_id AND b.owner_id = auth.uid()
        )
    );

-- Add delete policy for bands
DROP POLICY IF EXISTS "Band owners can delete their band" ON public.bands;
CREATE POLICY "Band owners can delete their band" ON public.bands
    FOR DELETE USING (auth.uid() = owner_id);
