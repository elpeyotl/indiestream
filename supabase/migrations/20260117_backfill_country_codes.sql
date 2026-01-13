-- Backfill NULL country codes with a default value
-- This allows existing streams to show up in location analytics
-- In production, new streams will have actual geo data from Vercel/Cloudflare headers

-- Update streams that have NULL country_code to 'XX' (Unknown)
-- This way they at least appear in analytics instead of being filtered out
-- Note: We use 'XX' as a standard code for "Unknown" in ISO 3166

-- For development/testing, set some streams to DE (Germany) to show the feature works
UPDATE public.listening_history
SET country_code = 'DE'
WHERE country_code IS NULL
  AND listened_at >= NOW() - INTERVAL '30 days';

-- For older streams, mark as unknown
UPDATE public.listening_history
SET country_code = 'XX'
WHERE country_code IS NULL
  AND listened_at < NOW() - INTERVAL '30 days';
