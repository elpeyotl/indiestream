-- ============================================
-- FAIRTUNE - SEED DATA FOR DEVELOPMENT
-- ============================================
-- Run with: supabase db reset (applies migrations + seed)
-- Creates test users, bands, albums, tracks, and sample data
--
-- Test Users:
--   Listener:  test@test.test / test123test123
--   Artist:    artist@test.test / test123test123
--   Admin:     admin@test.test / test123test123

-- ============================================
-- 1. AUTH USERS
-- ============================================
-- Using fixed UUIDs for predictable foreign key references

-- Listener user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'test@test.test',
  crypt('test123test123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Test Listener"}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW()
);

-- Artist user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'artist@test.test',
  crypt('test123test123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Test Artist"}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW()
);

-- Second artist user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'artist2@test.test',
  crypt('test123test123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Second Artist"}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW()
);

-- Admin user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.test',
  crypt('test123test123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Admin User"}'::jsonb,
  'authenticated', 'authenticated', NOW(), NOW()
);

-- ============================================
-- 2. PROFILES (auto-created by trigger, but we update roles)
-- ============================================
-- Triggers auto-create profiles + free subscriptions from auth.users inserts above

-- Set artist roles
UPDATE public.profiles SET role = 'band' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET role = 'band' WHERE id = '33333333-3333-3333-3333-333333333333';

-- Set admin role
UPDATE public.profiles SET role = 'admin' WHERE id = '44444444-4444-4444-4444-444444444444';

-- Add some profile details
UPDATE public.profiles SET
  bio = 'Just a music lover testing things out.',
  location = 'Zurich, Switzerland'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET
  bio = 'Post-metal / shoegaze from the Swiss Alps.',
  location = 'Bern, Switzerland'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET
  bio = 'Electronic artist exploring ambient soundscapes.',
  location = 'Basel, Switzerland'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- ============================================
-- 3. SUBSCRIPTIONS (upgrade listener to active subscriber)
-- ============================================

UPDATE public.subscriptions SET
  tier = 'listener',
  status = 'active',
  stripe_customer_id = 'cus_test_listener',
  stripe_subscription_id = 'sub_test_listener',
  current_period_start = NOW() - INTERVAL '15 days',
  current_period_end = NOW() + INTERVAL '15 days'
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- ============================================
-- 4. BANDS
-- ============================================

INSERT INTO public.bands (id, owner_id, name, slug, bio, location, genres, status, theme_color) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Iron Veil',
  'iron-veil',
  'Heavy post-metal from the Swiss Alps. Crushing riffs meet atmospheric soundscapes.',
  'Bern, Switzerland',
  ARRAY['post-metal', 'shoegaze', 'doom'],
  'active',
  '#7C3AED'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '33333333-3333-3333-3333-333333333333',
  'Nebula Echo',
  'nebula-echo',
  'Ambient electronic explorations from Basel. Synthesizers, field recordings, and reverb.',
  'Basel, Switzerland',
  ARRAY['ambient', 'electronic', 'experimental'],
  'active',
  '#06B6D4'
);

-- ============================================
-- 5. ALBUMS
-- ============================================

INSERT INTO public.albums (id, band_id, title, slug, description, release_type, is_published, release_date, purchasable, price_cents, pay_what_you_want, minimum_price_cents) VALUES
(
  'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Echoes of Stone',
  'echoes-of-stone',
  'Our debut full-length. Six tracks of crushing post-metal inspired by the Swiss mountains.',
  'album',
  TRUE,
  '2026-01-15',
  TRUE,
  1500,
  TRUE,
  800
),
(
  'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Summit',
  'summit',
  'A three-track EP exploring heavier territory.',
  'ep',
  TRUE,
  '2026-03-01',
  FALSE,
  NULL,
  NULL,
  NULL
),
(
  'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Signal Drift',
  'signal-drift',
  'Four ambient tracks recorded during late-night sessions in an empty warehouse.',
  'album',
  TRUE,
  '2026-02-10',
  TRUE,
  1200,
  FALSE,
  NULL
),
(
  'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Unreleased Sketches',
  'unreleased-sketches',
  'Work in progress — not published yet.',
  'album',
  FALSE,
  NULL,
  FALSE,
  NULL,
  NULL,
  NULL
);

-- ============================================
-- 6. TRACKS
-- ============================================
-- Note: No actual audio files — audio_key/streaming_audio_key left NULL
-- Moderation status set to 'approved' so tracks are visible

-- Album: Echoes of Stone (Iron Veil)
INSERT INTO public.tracks (id, album_id, band_id, title, track_number, duration_seconds, moderation_status, transcoding_status) VALUES
('aaa10001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Granite Hymn', 1, 387, 'approved', 'complete'),
('aaa10002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Falling Slow', 2, 294, 'approved', 'complete'),
('aaa10003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Through the Fog', 3, 456, 'approved', 'complete'),
('aaa10004-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Iron Lung', 4, 512, 'approved', 'complete'),
('aaa10005-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Collapse', 5, 348, 'approved', 'complete'),
('aaa10006-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Summit Rise', 6, 623, 'approved', 'complete');

-- Album: Summit EP (Iron Veil)
INSERT INTO public.tracks (id, album_id, band_id, title, track_number, duration_seconds, moderation_status, transcoding_status) VALUES
('aaa20001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Peak', 1, 445, 'approved', 'complete'),
('aaa20002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Descent', 2, 389, 'approved', 'complete'),
('aaa20003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Base Camp', 3, 567, 'approved', 'complete');

-- Album: Signal Drift (Nebula Echo)
INSERT INTO public.tracks (id, album_id, band_id, title, track_number, duration_seconds, moderation_status, transcoding_status) VALUES
('bbb10001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Frequency One', 1, 482, 'approved', 'complete'),
('bbb10002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Static Bloom', 2, 356, 'approved', 'complete'),
('bbb10003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Warehouse Floor', 3, 601, 'approved', 'complete'),
('bbb10004-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Last Transmission', 4, 445, 'approved', 'complete');

-- Album: Unreleased Sketches (Nebula Echo) — pending moderation, unpublished
INSERT INTO public.tracks (id, album_id, band_id, title, track_number, duration_seconds, moderation_status, transcoding_status) VALUES
('bbb20001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Draft 1', 1, 210, 'pending', 'pending'),
('bbb20002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Draft 2', 2, 180, 'pending', 'pending');

-- ============================================
-- 7. UPDATE ALBUM STATS
-- ============================================
-- The track insert trigger may handle this, but let's ensure correct values

UPDATE public.albums SET
  total_tracks = 6,
  total_duration_seconds = 387 + 294 + 456 + 512 + 348 + 623
WHERE id = 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.albums SET
  total_tracks = 3,
  total_duration_seconds = 445 + 389 + 567
WHERE id = 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.albums SET
  total_tracks = 4,
  total_duration_seconds = 482 + 356 + 601 + 445
WHERE id = 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE public.albums SET
  total_tracks = 2,
  total_duration_seconds = 210 + 180
WHERE id = 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================
-- 8. FOLLOWS
-- ============================================

-- Listener follows both bands
INSERT INTO public.follows (user_id, band_id) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Admin follows Iron Veil
INSERT INTO public.follows (user_id, band_id) VALUES
('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Update follower counts
UPDATE public.bands SET follower_count = 2 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.bands SET follower_count = 1 WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================
-- 9. SAVED ALBUMS & LIKED TRACKS
-- ============================================

-- Listener saved albums
INSERT INTO public.saved_albums (user_id, album_id) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('11111111-1111-1111-1111-111111111111', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Listener liked tracks
INSERT INTO public.liked_tracks (user_id, track_id) VALUES
('11111111-1111-1111-1111-111111111111', 'aaa10001-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('11111111-1111-1111-1111-111111111111', 'aaa10004-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('11111111-1111-1111-1111-111111111111', 'bbb10003-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- ============================================
-- 10. LISTENING HISTORY (sample streams)
-- ============================================

-- Listener streamed several tracks over the past weeks
INSERT INTO public.listening_history (user_id, track_id, band_id, album_id, listened_at, duration_seconds, completed, is_free_play) VALUES
-- Iron Veil streams (paid)
('11111111-1111-1111-1111-111111111111', 'aaa10001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '10 days', 387, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'aaa10002-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '10 days', 294, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'aaa10003-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '9 days', 456, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'aaa10004-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '8 days', 512, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'aaa10001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '5 days', 387, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'aaa20001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '3 days', 445, TRUE, FALSE),
-- Nebula Echo streams (paid)
('11111111-1111-1111-1111-111111111111', 'bbb10001-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '7 days', 482, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'bbb10002-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '7 days', 356, TRUE, FALSE),
('11111111-1111-1111-1111-111111111111', 'bbb10003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '6 days', 601, TRUE, FALSE),
-- A partial stream (not completed)
('11111111-1111-1111-1111-111111111111', 'bbb10004-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '6 days', 15, FALSE, FALSE);

-- Update band stream counts
UPDATE public.bands SET total_streams = 7 WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.bands SET total_streams = 3 WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Update track stream counts
UPDATE public.tracks SET stream_count = 2, total_streams = 2 WHERE id = 'aaa10001-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'aaa10002-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'aaa10003-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'aaa10004-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'aaa20001-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'bbb10001-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'bbb10002-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE public.tracks SET stream_count = 1, total_streams = 1 WHERE id = 'bbb10003-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Update album stream counts
UPDATE public.albums SET total_streams = 7 WHERE id = 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.albums SET total_streams = 1 WHERE id = 'aaaa2222-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.albums SET total_streams = 3 WHERE id = 'bbbb1111-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- ============================================
-- 11. PLAYLISTS
-- ============================================

INSERT INTO public.playlists (id, owner_id, title, description, is_public) VALUES
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'Heavy Favorites',
  'My go-to heavy tracks',
  TRUE
);

INSERT INTO public.playlist_tracks (playlist_id, track_id, position, added_by) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaa10001-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaa10004-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbb10003-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, '11111111-1111-1111-1111-111111111111');

UPDATE public.playlists SET track_count = 3 WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ============================================
-- 12. ARTIST TIPS
-- ============================================

INSERT INTO public.artist_tips (band_id, tipper_id, amount_cents, net_amount_cents, status, message, is_anonymous, stripe_payment_intent_id) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  500,
  455,
  'completed',
  'Love the new EP!',
  FALSE,
  'pi_test_tip_001'
);

-- ============================================
-- 13. FEATURED GENRES
-- ============================================

INSERT INTO public.featured_genres (genre_slug, genre_name, position) VALUES
('post-metal', 'Post-Metal', 1),
('ambient', 'Ambient', 2),
('shoegaze', 'Shoegaze', 3),
('doom', 'Doom', 4),
('electronic', 'Electronic', 5),
('experimental', 'Experimental', 6),
('black-metal', 'Black Metal', 7),
('noise', 'Noise', 8);

-- ============================================
-- 14. NOTIFICATIONS (sample)
-- ============================================

INSERT INTO public.notifications (user_id, type, title, message, link) VALUES
('11111111-1111-1111-1111-111111111111', 'new_release', 'New Release', 'Iron Veil released "Summit"', '/iron-veil/summit'),
('22222222-2222-2222-2222-222222222222', 'new_follower', 'New Follower', 'Test Listener started following Iron Veil', '/dashboard/artist');

-- ============================================
-- DONE
-- ============================================
-- Test accounts:
--   Listener:  test@test.test / test123test123 (subscribed)
--   Artist 1:  artist@test.test / test123test123 (owns Iron Veil)
--   Artist 2:  artist2@test.test / test123test123 (owns Nebula Echo)
--   Admin:     admin@test.test / test123test123
