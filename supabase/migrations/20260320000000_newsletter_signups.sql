-- Newsletter signups for pre-launch email collection

CREATE TABLE IF NOT EXISTS public.newsletter_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(email)
);

-- Index for admin queries (export signups sorted by date)
CREATE INDEX IF NOT EXISTS idx_newsletter_signups_created_at ON public.newsletter_signups(created_at DESC);

-- Enable RLS - no policies means only service_role can access
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.newsletter_signups IS 'Email signups for newsletter and launch notifications';
