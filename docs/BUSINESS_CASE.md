# Indiestream Business Case

**Document Version:** 1.0
**Date:** January 2026
**Prepared for:** Investors, Shareholders & Stakeholders

---

## Executive Summary

Indiestream is a **fair-pay music streaming platform** for independent artists. Unlike traditional streaming services where revenue pools benefit major labels, Indiestream uses a **user-centric payment model** where each subscriber's fee goes directly to the artists they listen to.

**Tagline:** *Stream Fair. Support Direct.*

---

## The Problem We Solve

### Traditional Streaming Is Broken for Indie Artists

| Issue | Traditional Platforms | Indiestream Solution |
|-------|----------------------|----------------------|
| **Revenue Pool** | All subscriptions go into one pool | Your $9.99 goes to artists YOU listen to |
| **Major Label Dominance** | ~70% of streams go to major labels | Independent artists only |
| **Artist Share** | ~$0.003 per stream (~30% to artist) | ~$0.007+ per stream (70% to artist) |
| **Transparency** | Opaque payout calculations | Real-time earnings dashboard |
| **Free Tier Loophole** | Unlimited free plays = no royalties | 30-second previews only; all full plays generate revenue |

### Market Opportunity

- **Global music streaming market:** $30+ billion (2025)
- **Independent artist segment:** Growing 3x faster than major label content
- **Underserved niche:** Audiophiles and ethically-minded music fans who want to support artists directly
- **Competitive advantage:** First-mover in PRO-compliant, transparent user-centric streaming

---

## Business Model

### Revenue Split: 70/15/15

```
┌─────────────────────────────────────────────────────────────────┐
│                    $9.99 Listener Subscription                   │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │   70%    │        │   15%    │        │   15%    │
   │  $6.99   │        │  $1.50   │        │  $1.50   │
   │ Artists  │        │ PRO/MRO  │        │ Platform │
   └──────────┘        └──────────┘        └──────────┘
   Direct payout       SUISA, GEMA,        Operations,
   to creators         ASCAP, BMI          development
```

### Key Differentiator: 85% to Music Rights

**Indiestream allocates 85% of subscription revenue to music rights** - the highest in the streaming industry:
- **70%** directly to the artist
- **15%** to Performance Rights Organizations (SUISA, GEMA, ASCAP, BMI, etc.)

*Competitors typically allocate only ~70% to rights, with most going through labels.*

---

## Pricing Tiers

### For Listeners

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/month | 30-second previews, browse artists, create account |
| **Listener** | $9.99/month | Unlimited streaming, high-quality audio, listening history, direct artist support, no ads |

### For Artists

| Tier | Price | Features |
|------|-------|----------|
| **Artist** | Free | Unlimited uploads, 70% revenue share, detailed analytics, artist profile, monthly payouts, verification available |

**No upload fees. No hidden costs. Artists keep their rights.**

---

## Key Selling Points

### For Listeners

| Benefit | Description |
|---------|-------------|
| **Direct Impact** | Your money goes to artists you actually listen to, not a pool |
| **Transparency** | See exactly where your subscription went each month ("My Impact" dashboard) |
| **No Ads** | Clean, uninterrupted listening experience |
| **Ethical Choice** | Support independent artists and fair pay practices |
| **Quality Audio** | 320kbps streaming (HiFi lossless planned) |
| **Share Your Impact** | Public impact stats you can share on social media |

### For Artists

| Benefit | Description |
|---------|-------------|
| **70% Revenue** | Industry-leading artist share |
| **Direct Fan Support** | Your listeners' subscriptions go directly to you |
| **No Gatekeepers** | Upload and publish instantly |
| **Keep Your Rights** | You own your music, always |
| **Real-Time Analytics** | See who's listening, where they're from, what's trending |
| **PRO Compliance** | ISRC/ISWC support, composer credits, ready for SUISA/GEMA reporting |
| **Monthly Payouts** | Paid on the 15th via Stripe Connect |
| **Verification** | Get verified to build trust with your audience |

---

## Competitive Analysis

| Feature | Indiestream | Spotify | Apple Music | Bandcamp |
|---------|-------------|---------|-------------|----------|
| **To Music Rights** | **85%** | ~70% | ~70% | 82% |
| **Direct to Artist** | **70%** | ~30% | ~30% | 82%* |
| **Payment Model** | User-centric | Pro-rata pool | Pro-rata pool | Per-sale |
| **Free Tier** | Preview only | Unlimited (ads) | None | Full (artist choice) |
| **Analytics** | Real-time | Delayed | Limited | Basic |
| **PRO Reporting** | Built-in | Via distributors | Via distributors | None |
| **Artist Upload Fee** | **Free** | Via distributor | Via distributor | Free |

*Bandcamp takes 15% but only on sales, not streaming

### Why We Win

1. **User-Centric Model** - Unlike Spotify/Apple's pro-rata pool, your subscription supports YOUR artists
2. **PRO Compliance** - Built-in royalty society reporting (SUISA, GEMA export)
3. **Transparency** - Both artists and listeners see exactly where money flows
4. **No Free Streaming Loophole** - Every full play generates revenue (no ad-supported free tier)
5. **85% to Music** - Highest allocation to music rights in streaming

---

## Implemented Features

### Core Platform ✅

- [x] User authentication (email/password, Google OAuth)
- [x] Artist profile creation and management
- [x] Album/EP/Single upload with cover art
- [x] Track upload with audio streaming via Cloudflare R2
- [x] Full-featured audio player with queue management
- [x] Shuffle, repeat modes (off/all/one), favorites
- [x] Media Session API (lock screen controls)
- [x] Stream tracking (counts after 30 seconds)
- [x] Listening history

### Discovery & Navigation ✅

- [x] Home page with featured artists and new releases
- [x] Discover page with artist grid
- [x] Artists page with search and genre filters
- [x] Global search (Cmd+K) for artists, albums, tracks
- [x] Artist public profile pages
- [x] Album detail pages with track listing

### Subscription & Payments ✅

- [x] Stripe integration for subscriptions
- [x] 7-day free trial
- [x] Subscription management (Stripe portal)
- [x] Free tier with 30-second previews
- [x] Payment history page
- [x] Artist payout system (Stripe Connect Express)
- [x] Revenue dashboard for artists

### Social Features ✅

- [x] Follow artists
- [x] User playlists (create, edit, share, collaborative)
- [x] Like/favorite tracks and albums
- [x] Library page (Artists, Albums, Playlists, Liked Songs)
- [x] Share functionality
- [x] Artist followers tab

### Artist Tools ✅

- [x] Detailed analytics dashboard
- [x] Artist banner and avatar uploads
- [x] Album/track editing and deletion
- [x] ISRC/ISWC metadata support (Deezer/MusicBrainz lookup)
- [x] Composer credits with roles and IPI numbers
- [x] Cover song flagging
- [x] Rights confirmation workflow

### User Features ✅

- [x] User profile pages (public profiles)
- [x] Listening stats dashboard (This Year/Last Month/All Time)
- [x] "My Impact" - where your money went breakdown
- [x] Social sharing of impact stats
- [x] Privacy controls for public stats

### Admin Dashboard ✅

- [x] Platform stats overview
- [x] User management (CRUD, roles)
- [x] Artist management (feature, verify, suspend)
- [x] Content moderation queue
- [x] Track approval workflow
- [x] PRO export for SUISA/GEMA reporting

### Mobile & PWA ✅

- [x] Mobile-responsive design
- [x] Bottom navigation bar
- [x] PWA installable app
- [x] Pull-to-refresh
- [x] Haptic feedback
- [x] iOS/Android ready via Capacitor

---

## Future Roadmap

### High Priority (Next Quarter)

| Feature | Business Value | Complexity |
|---------|----------------|------------|
| **Email notifications** | Engagement, retention | Low |
| **Release scheduling** | Artist workflow | Medium |
| **Pre-save functionality** | Marketing, anticipation | Medium |
| **Apple login** | Conversion improvement | Low |

### Medium Priority (6 Months)

| Feature | Business Value | Complexity |
|---------|----------------|------------|
| **HiFi/Lossless streaming** | Premium upsell ($14.99/mo tier) | Medium |
| **Offline playback** | Subscriber retention | Medium |
| **Genre pages** | Discovery, engagement | Low |
| **Curated playlists** | Editorial voice, retention | Low |
| **Charts/trending** | Discovery, engagement | Low |
| **Similar artists** | Discovery, time on platform | Medium |

### Lower Priority (12+ Months)

| Feature | Business Value | Complexity |
|---------|----------------|------------|
| **Digital downloads** | Additional revenue stream | Medium |
| **Merch store** | Artist revenue diversification | High |
| **Live streaming** | Events, fan engagement | High |
| **Podcast support** | Content expansion | High |

---

## Key Metrics & KPIs

### Growth Metrics

| Metric | Description |
|--------|-------------|
| **MAU** | Monthly Active Users |
| **Paid Subscribers** | Users on $9.99/mo plan |
| **Conversion Rate** | Free → Paid conversion |
| **Artist Signups** | New artist profiles created |
| **Track Uploads** | New tracks added to catalog |

### Engagement Metrics

| Metric | Description |
|--------|-------------|
| **Streams/User** | Average streams per active user |
| **Listening Time** | Average minutes per session |
| **Retention Rate** | Month-over-month user retention |
| **Churn Rate** | Subscription cancellations |

### Financial Metrics

| Metric | Description |
|--------|-------------|
| **MRR** | Monthly Recurring Revenue |
| **ARPU** | Average Revenue Per User |
| **Artist Payouts** | Total paid to artists |
| **LTV** | Customer Lifetime Value |
| **CAC** | Customer Acquisition Cost |

---

## Unit Economics

### At Scale (50,000 Subscribers)

| Metric | Value |
|--------|-------|
| **MRR** | $499,500 |
| **To Artists (70%)** | $349,650 |
| **To PROs (15%)** | $74,925 |
| **Platform Revenue (15%)** | $74,925 |
| **Infrastructure Costs** | ~$150* |
| **Gross Margin** | ~99.8% |

*See [ARCHITECTURE.md](./ARCHITECTURE.md) for infrastructure cost analysis

### Break-Even Analysis

| Expense | Monthly Cost |
|---------|--------------|
| Infrastructure | $50-150 |
| Stripe fees (~3%) | Variable |
| Domain & email | ~$30 |
| **Break-even point** | ~5-10 paid subscribers |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Catalog size** | High | Focus on quality over quantity; curated indie focus |
| **Competition** | Medium | Differentiate on ethics, transparency, user-centric model |
| **Artist acquisition** | Medium | Emphasize 70% share, direct fan support |
| **Listener acquisition** | Medium | Target ethical consumers, indie music fans |
| **Regulatory** | Low | PRO compliance built-in from day one |
| **Technical** | Low | Serverless architecture, managed services |

---

## Summary: Why Indiestream?

### For Investors

1. **Large market** - $30B+ streaming market with underserved indie segment
2. **Sustainable unit economics** - 15% platform fee with minimal infrastructure costs
3. **Strong differentiation** - Only user-centric, PRO-compliant indie streaming platform
4. **Scalable architecture** - Serverless infrastructure that costs ~$150/mo at 50K users
5. **Clear growth path** - Premium tiers (HiFi), downloads, merch as future revenue

### For Artists

1. **70% revenue share** - Highest direct-to-artist payout in streaming
2. **Your fans, your money** - User-centric model means your listeners support YOU
3. **No gatekeepers** - Upload instantly, no distributor required
4. **Keep your rights** - Non-exclusive, you own everything
5. **PRO ready** - ISRC, composer credits, royalty society reporting built-in

### For Listeners

1. **Direct support** - Your $9.99 goes to artists you actually listen to
2. **Transparency** - See exactly where your money went
3. **Ethical streaming** - Support fair pay for musicians
4. **No ads, no compromise** - Clean listening experience
5. **Discover indie** - Curated catalog of independent artists

---

*Document prepared by the Indiestream Team*
