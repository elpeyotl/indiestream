-- Add new profile fields for user profiles
ALTER TABLE public.profiles
ADD COLUMN avatar_key TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN location TEXT,
ADD COLUMN website TEXT;

-- Add constraints
ALTER TABLE public.profiles
ADD CONSTRAINT bio_length_check CHECK (char_length(bio) <= 280);

ALTER TABLE public.profiles
ADD CONSTRAINT website_format_check CHECK (website IS NULL OR website ~ '^https?://');

-- Add comments
COMMENT ON COLUMN public.profiles.avatar_key IS 'R2 storage key for user avatar image';
COMMENT ON COLUMN public.profiles.bio IS 'Short bio (max 280 characters)';
COMMENT ON COLUMN public.profiles.location IS 'User location (optional)';
COMMENT ON COLUMN public.profiles.website IS 'User website URL (optional)';
