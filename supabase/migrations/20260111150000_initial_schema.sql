-- ============================================
-- INDIESTREAM - COMPLETE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Types and Profiles
-- ============================================

-- Custom Types
CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE release_type AS ENUM ('album', 'ep', 'single', 'compilation');
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'revision_requested');
CREATE TYPE user_role AS ENUM ('user', 'band', 'admin');

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES (NEW.id, 'free', 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================
-- PART 2: Bands and Content
-- ============================================

CREATE TABLE public.bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    bio TEXT,
    location TEXT,
    website TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    theme_color TEXT DEFAULT '#8B5CF6',
    genres TEXT[] DEFAULT '{}',
    stripe_account_id TEXT,
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    total_streams BIGINT DEFAULT 0,
    total_earnings_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bands_owner ON public.bands(owner_id);
CREATE INDEX idx_bands_slug ON public.bands(slug);

ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bands are viewable by everyone" ON public.bands
    FOR SELECT USING (true);

CREATE POLICY "Band owners can update their band" ON public.bands
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create bands" ON public.bands
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ============================================
-- ALBUMS
-- ============================================

CREATE TABLE public.albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    release_type release_type NOT NULL DEFAULT 'album',
    cover_url TEXT,
    release_date DATE,
    is_published BOOLEAN DEFAULT FALSE,
    total_tracks INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(band_id, slug)
);

CREATE INDEX idx_albums_band ON public.albums(band_id);
CREATE INDEX idx_albums_published ON public.albums(is_published) WHERE is_published = true;

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published albums are viewable by everyone" ON public.albums
    FOR SELECT USING (is_published = true OR EXISTS (
        SELECT 1 FROM public.bands WHERE id = albums.band_id AND owner_id = auth.uid()
    ));

CREATE POLICY "Band owners can manage their albums" ON public.albums
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.bands WHERE id = albums.band_id AND owner_id = auth.uid()
    ));

-- ============================================
-- TRACKS
-- ============================================

CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    track_number INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    audio_url TEXT,
    audio_url_preview TEXT,
    waveform_data JSONB,
    lyrics TEXT,
    credits TEXT,
    is_explicit BOOLEAN DEFAULT FALSE,
    moderation_status moderation_status NOT NULL DEFAULT 'pending',
    moderation_notes TEXT,
    moderated_at TIMESTAMPTZ,
    moderated_by UUID REFERENCES public.profiles(id),
    total_streams BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracks_album ON public.tracks(album_id);
CREATE INDEX idx_tracks_band ON public.tracks(band_id);
CREATE INDEX idx_tracks_moderation ON public.tracks(moderation_status);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved tracks in published albums are viewable" ON public.tracks
    FOR SELECT USING (
        moderation_status = 'approved' AND EXISTS (
            SELECT 1 FROM public.albums WHERE id = tracks.album_id AND is_published = true
        )
        OR EXISTS (
            SELECT 1 FROM public.bands WHERE id = tracks.band_id AND owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Band owners can manage their tracks" ON public.tracks
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.bands WHERE id = tracks.band_id AND owner_id = auth.uid()
    ));

-- ============================================
-- PART 3: Streaming and Revenue
-- ============================================

CREATE TABLE public.stream_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    is_full_stream BOOLEAN DEFAULT FALSE,
    subscription_tier subscription_tier NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stream_events_user ON public.stream_events(user_id);
CREATE INDEX idx_stream_events_track ON public.stream_events(track_id);
CREATE INDEX idx_stream_events_band ON public.stream_events(band_id);
CREATE INDEX idx_stream_events_created ON public.stream_events(created_at);
CREATE INDEX idx_stream_events_user_month ON public.stream_events(user_id, created_at);

ALTER TABLE public.stream_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stream events" ON public.stream_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert stream events" ON public.stream_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REVENUE DISTRIBUTION (monthly calculations)
-- ============================================

CREATE TABLE public.revenue_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    listening_seconds BIGINT NOT NULL DEFAULT 0,
    percentage_of_user DECIMAL(5,4) NOT NULL DEFAULT 0,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, band_id, period_start)
);

CREATE INDEX idx_revenue_dist_user ON public.revenue_distributions(user_id);
CREATE INDEX idx_revenue_dist_band ON public.revenue_distributions(band_id);
CREATE INDEX idx_revenue_dist_period ON public.revenue_distributions(period_start);

ALTER TABLE public.revenue_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revenue distribution" ON public.revenue_distributions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Bands can view revenue from their listeners" ON public.revenue_distributions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.bands WHERE id = revenue_distributions.band_id AND owner_id = auth.uid()
    ));

-- ============================================
-- PAYOUTS (to artists)
-- ============================================

CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_transfer_id TEXT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_band ON public.payouts(band_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bands can view own payouts" ON public.payouts
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.bands WHERE id = payouts.band_id AND owner_id = auth.uid()
    ));

-- ============================================
-- USER FAVORITES
-- ============================================

CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    band_id UUID REFERENCES public.bands(id) ON DELETE CASCADE,
    album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT favorites_one_type CHECK (
        (band_id IS NOT NULL)::int +
        (album_id IS NOT NULL)::int +
        (track_id IS NOT NULL)::int = 1
    )
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE UNIQUE INDEX idx_favorites_user_band ON public.favorites(user_id, band_id) WHERE band_id IS NOT NULL;
CREATE UNIQUE INDEX idx_favorites_user_album ON public.favorites(user_id, album_id) WHERE album_id IS NOT NULL;
CREATE UNIQUE INDEX idx_favorites_user_track ON public.favorites(user_id, track_id) WHERE track_id IS NOT NULL;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- PART 4: Moderation Queue
-- ============================================

CREATE TABLE public.moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id),
    priority TEXT DEFAULT 'normal',
    status moderation_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderation_status ON public.moderation_queue(status);
CREATE INDEX idx_moderation_priority ON public.moderation_queue(priority, created_at);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation queue" ON public.moderation_queue
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update moderation queue" ON public.moderation_queue
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Band owners can view own submissions" ON public.moderation_queue
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.bands WHERE id = moderation_queue.band_id AND owner_id = auth.uid()
    ));

CREATE POLICY "Band owners can insert to queue" ON public.moderation_queue
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to approve a track
CREATE OR REPLACE FUNCTION public.approve_track(
    p_track_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles WHERE id = auth.uid();

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only admins can approve tracks';
    END IF;

    UPDATE public.tracks
    SET moderation_status = 'approved',
        moderation_notes = p_notes,
        moderated_at = NOW(),
        moderated_by = auth.uid()
    WHERE id = p_track_id;

    UPDATE public.moderation_queue
    SET status = 'approved',
        notes = p_notes,
        reviewed_by = auth.uid(),
        reviewed_at = NOW()
    WHERE track_id = p_track_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a track
CREATE OR REPLACE FUNCTION public.reject_track(
    p_track_id UUID,
    p_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT role = 'admin' INTO v_is_admin
    FROM public.profiles WHERE id = auth.uid();

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only admins can reject tracks';
    END IF;

    UPDATE public.tracks
    SET moderation_status = 'rejected',
        moderation_notes = p_notes,
        moderated_at = NOW(),
        moderated_by = auth.uid()
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

-- Function to get user's listening distribution for a period
CREATE OR REPLACE FUNCTION public.get_listening_distribution(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    band_id UUID,
    band_name TEXT,
    listening_seconds BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH user_streams AS (
        SELECT
            se.band_id,
            SUM(se.duration_seconds) as total_seconds
        FROM public.stream_events se
        WHERE se.user_id = p_user_id
        AND se.created_at >= p_start_date
        AND se.created_at < p_end_date
        AND se.is_full_stream = true
        GROUP BY se.band_id
    ),
    total AS (
        SELECT COALESCE(SUM(total_seconds), 0) as grand_total FROM user_streams
    )
    SELECT
        us.band_id,
        b.name as band_name,
        us.total_seconds as listening_seconds,
        CASE
            WHEN t.grand_total > 0
            THEN ROUND((us.total_seconds::DECIMAL / t.grand_total) * 100, 2)
            ELSE 0
        END as percentage
    FROM user_streams us
    JOIN public.bands b ON b.id = us.band_id
    CROSS JOIN total t
    ORDER BY us.total_seconds DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update album stats
CREATE OR REPLACE FUNCTION public.update_album_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.albums
    SET total_tracks = (
        SELECT COUNT(*) FROM public.tracks
        WHERE album_id = COALESCE(NEW.album_id, OLD.album_id)
    ),
    total_duration_seconds = (
        SELECT COALESCE(SUM(duration_seconds), 0) FROM public.tracks
        WHERE album_id = COALESCE(NEW.album_id, OLD.album_id)
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.album_id, OLD.album_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_track_change
    AFTER INSERT OR UPDATE OR DELETE ON public.tracks
    FOR EACH ROW EXECUTE FUNCTION public.update_album_stats();

-- Function to record stream
CREATE OR REPLACE FUNCTION public.record_stream(
    p_track_id UUID,
    p_duration_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_track RECORD;
    v_subscription subscription_tier;
    v_is_full_stream BOOLEAN;
BEGIN
    SELECT t.*, b.id as band_id INTO v_track
    FROM public.tracks t
    JOIN public.bands b ON t.band_id = b.id
    WHERE t.id = p_track_id;

    IF v_track IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT tier INTO v_subscription
    FROM public.subscriptions
    WHERE user_id = auth.uid();

    v_is_full_stream := p_duration_seconds >= LEAST(30, v_track.duration_seconds);

    INSERT INTO public.stream_events (
        user_id, track_id, band_id, duration_seconds,
        is_full_stream, subscription_tier
    )
    VALUES (
        auth.uid(), p_track_id, v_track.band_id, p_duration_seconds,
        v_is_full_stream, COALESCE(v_subscription, 'free')
    );

    UPDATE public.tracks
    SET total_streams = total_streams + 1
    WHERE id = p_track_id;

    UPDATE public.bands
    SET total_streams = total_streams + 1
    WHERE id = v_track.band_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SCHEMA COMPLETE!
-- ============================================
