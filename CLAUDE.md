# CLAUDE.md

This file provides guidance to Claude Code when working with the Indiestream codebase.

## Project Overview

Indiestream is a music streaming platform connecting independent artists with listeners. It's a full-stack web application with PWA and native mobile support via Capacitor.

**Business Model:** 85% revenue to artists, 15% platform fee. Human-moderated releases for quality control.

## Tech Stack

- **Framework:** Nuxt 3 (Vue 3) with TypeScript
- **UI:** Nuxt UI + Tailwind CSS
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Storage:** Cloudflare R2 (audio files, images)
- **Payments:** Stripe (subscriptions + Connect for artist payouts)
- **Email:** Resend
- **Deployment:** Vercel (main app), Fly.io (transcoding worker)

## Common Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
```

## Project Structure

```
components/          # Vue components organized by domain
composables/         # Reusable composition functions (useAuth, usePlayer, etc.)
pages/               # Nuxt pages/routes
server/api/          # API endpoints (Nuxt server routes)
server/utils/        # Server-side utilities
middleware/          # Route guards (auth, admin, coming-soon)
types/               # TypeScript definitions
tests/               # E2E tests (Playwright)
transcoding-worker/  # Audio processing worker (separate Fly.io deployment)
```

## Key Files

- `nuxt.config.ts` - Framework and module configuration
- `app.config.ts` - Business logic config (tiers, percentages, colors)
- `types/database.ts` - Supabase-generated TypeScript types
- `.env.example` - Required environment variables

## Development Guidelines

1. **Use composables** for shared state/logic (check `composables/` before creating new state)
2. **Follow existing patterns** - components are organized by domain (audio, band, album, admin, dashboard)
3. **API routes** go in `server/api/` following Nuxt conventions
4. **Type safety** - leverage TypeScript; types are in `types/` directory
5. **Database changes** require Supabase migrations

## Important Conventions

- Mobile-first design with touch-optimized UI
- Use Nuxt UI components from the component library
- Row Level Security (RLS) handles authorization at the database level
- Audio files are transcoded to AAC 256kbps and FLAC 16-bit/44.1kHz

## Documentation

Detailed docs are available in the `docs/` folder:

- `ARCHITECTURE.md` - System design and scaling
- `SUPABASE_SETUP.md` - Database configuration
- `AUDIO_TRANSCODING.md` - Audio processing pipeline
- `ARTIST_PAYOUT_SYSTEM.md` - Revenue distribution
