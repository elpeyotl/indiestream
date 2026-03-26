# Go-Live Checklist

## Environment & Secrets

- [ ] Configure `.env.production` with fairtune-prd Supabase keys (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`)
- [ ] Set up Stripe **live** keys (`pk_live_`, `sk_live_`) and create live products/prices
- [ ] Set up Stripe live webhook secrets (`STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`)
- [ ] Create live Stripe boost prices and update `STRIPE_BOOST_PRICE_5/10/20`
- [ ] Decide: shared vs separate R2 bucket for prod (recommend separate `fairtune-audio-prod`)

## Deployment

- [ ] Deploy app to Vercel — connect repo with dev (develop branch) and prod (main branch) environments
- [ ] Set all environment variables in Vercel for both environments
- [ ] Configure custom domain (fairtune.fm) on Vercel
- [ ] Deploy transcoding worker to Fly.io (consider separate dev/prod apps before launch)
- [ ] Set Fly.io secrets (`TRANSCODING_SECRET`, `R2_*` credentials, `SUPABASE_SERVICE_KEY`)

## External Services

- [ ] Configure Stripe webhooks pointing to production URL (`https://fairtune.fm/api/webhooks/stripe`)
- [ ] Configure Stripe Connect webhooks (`https://fairtune.fm/api/webhooks/stripe-connect`)
- [ ] Verify fairtune.fm domain in Resend for transactional emails
- [ ] Add production domain to Supabase Auth redirect URLs (Dashboard > Auth > URL Configuration)
- [ ] Verify Supabase email templates use correct production URLs

## Pre-Launch

- [ ] Create admin user in production database
- [ ] Set `COMING_SOON_MODE=true` in prod until ready for public launch
- [ ] Seed platform settings (featured genres, etc.) in prod DB
- [ ] Review RLS policies are correctly applied in prod (`supabase migration list`)

## Smoke Test

Run through the full user journey on the production URL:

- [ ] Sign up as a new listener
- [ ] Sign up as a new artist, create a band
- [ ] Upload an album with tracks (verify transcoding completes)
- [ ] Play a track as a listener (verify streaming works)
- [ ] Subscribe to a paid plan via Stripe
- [ ] Test artist payout onboarding (Stripe Connect)
- [ ] Verify emails are delivered (welcome, notifications)
- [ ] Test on mobile (PWA install, touch interactions)

## Go Live

- [ ] Flip `COMING_SOON_MODE=false`
- [ ] Verify coming-soon page is no longer shown
- [ ] Monitor error logs (Vercel, Fly.io, Supabase) for the first 24h
