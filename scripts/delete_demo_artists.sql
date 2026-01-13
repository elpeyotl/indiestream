-- ============================================
-- DELETE DEMO/SEED ARTISTS AND ALL RELATED DATA
-- Run this in Supabase SQL Editor
-- ============================================

-- This script deletes bands created by the seed endpoint
-- The seed creates bands with these slugs:
-- lunar-echo, the-static-minds, velvet-underground-revival,
-- neon-pulse, acoustic-wanderers

-- Due to CASCADE constraints, deleting bands will also delete:
-- - Albums (and their tracks)
-- - Tracks
-- - Stream events
-- - Listening history
-- - Revenue distributions
-- - Payouts
-- - Favorites referencing those bands/albums/tracks
-- - Moderation queue entries

-- List of demo band slugs (from seed endpoint)
DO $$
DECLARE
    demo_slugs TEXT[] := ARRAY[
        'midnight-echoes',
        'the-static-hearts',
        'luna-bay',
        'concrete-garden',
        'velvet-haze'
    ];
    deleted_count INTEGER;
BEGIN
    -- Delete bands by slug (cascades to albums, tracks, etc.)
    DELETE FROM public.bands
    WHERE slug = ANY(demo_slugs);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'Deleted % demo band(s)', deleted_count;
END $$;

-- Verification: Show remaining bands
SELECT id, name, slug, created_at
FROM public.bands
ORDER BY created_at DESC;
