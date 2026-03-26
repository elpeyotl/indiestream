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

## Phase 1: Dev Testing with Friends

Test the full platform on the dev environment with real users (friends/test bands) using Stripe test cards before touching production.

- [ ] Invite friends to sign up on the dev deployment
- [ ] Have test bands create artist accounts and upload real music
- [ ] Test subscriptions and purchases with [Stripe test cards](https://docs.stripe.com/testing#cards)
- [ ] Test artist Stripe Connect onboarding (test mode)
- [ ] Test full moderation flow: upload → review → approve/reject
- [ ] Verify transcoding pipeline works end-to-end
- [ ] Verify emails are delivered (welcome, approval, notifications)
- [ ] Test on mobile (PWA install, touch interactions, offline mode)
- [ ] Collect feedback and fix issues

## Phase 2: Soft Launch on Production

Deploy to production with `COMING_SOON_MODE=true` and an invite system so early artists can onboard before public launch. This ensures all content (Stripe accounts, audio files, user data) is created directly on production — no migration needed.

- [ ] Create admin user in production database
- [ ] Set `COMING_SOON_MODE=true` in prod
- [ ] Implement invite link bypass (e.g. `?invite=SECRET` sets a cookie that skips coming-soon page)
- [ ] Seed platform settings (featured genres, etc.) in prod DB
- [ ] Review RLS policies are correctly applied in prod (`supabase migration list`)
- [ ] Send invite links to initial artists
- [ ] Artists sign up, onboard Stripe Connect (live), and upload music on prod
- [ ] Moderate and approve initial catalog

## Phase 3: Go Live

- [ ] Verify there is enough content for a good first impression
- [ ] Flip `COMING_SOON_MODE=false`
- [ ] Remove or expire invite bypass
- [ ] Verify coming-soon page is no longer shown
- [ ] Monitor error logs (Vercel, Fly.io, Supabase) for the first 24h
