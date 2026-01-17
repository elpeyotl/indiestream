# Indiestream Platform Architecture

**Document Version:** 1.1
**Date:** January 2026 (Updated: HiFi Analysis Added)
**Prepared for:** Shareholders & Technical Stakeholders

---

## Executive Summary

Indiestream is built on a modern, serverless architecture optimized for cost efficiency and global scalability. The platform leverages best-in-class cloud services while maintaining significantly lower operational costs than traditional AWS or Google Cloud deployments.

**Key Metrics:**
- **Estimated monthly cost at 10,000 MAU:** ~$150-300/month
- **Estimated monthly cost at 100,000 MAU:** ~$800-1,500/month
- **Time to global deployment:** Minutes (automatic via Vercel)
- **Database scaling:** Automatic (Supabase managed PostgreSQL)

---

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Web Browser (PWA)  │  iOS App (Capacitor)  │  Android App (Capacitor)│
└──────────┬──────────┴───────────┬───────────┴───────────┬───────────┘
           │                      │                       │
           ▼                      ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EDGE / CDN LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                    Vercel Edge Network                               │
│              (Automatic SSL, DDoS protection, 90+ PoPs)              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   APPLICATION   │  │    DATABASE     │  │  FILE STORAGE   │
│    (Vercel)     │  │   (Supabase)    │  │ (Cloudflare R2) │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Nuxt 3 SSR      │  │ PostgreSQL 15   │  │ S3-compatible   │
│ API Routes      │  │ Row Level Sec.  │  │ 90+ edge PoPs   │
│ Serverless Fn   │  │ Realtime        │  │ Presigned URLs  │
│ Edge Functions  │  │ Auth (JWT)      │  │ Direct streaming│
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PAYMENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                         Stripe                                       │
│   Subscriptions │ Customer Portal │ Connect (Artist Payouts)         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Nuxt 3 + Vue 3 | Universal rendering (SSR + SPA) |
| **UI Components** | Nuxt UI + Tailwind | Consistent design system |
| **Mobile Apps** | Capacitor | Native iOS/Android wrappers |
| **Backend** | Nuxt Server Routes | API endpoints (93+ routes) |
| **Database** | Supabase (PostgreSQL) | Data, auth, realtime |
| **File Storage** | Cloudflare R2 | Audio files, images |
| **Payments** | Stripe | Subscriptions, artist payouts |
| **Deployment** | Vercel | Serverless, global CDN |
| **Email** | Resend | Transactional emails |

---

## CDN & Content Delivery Analysis

### Current Setup: Cloudflare R2 + Vercel Edge

```
Audio Streaming Flow:

User (Sydney) ──► Vercel Edge (Sydney) ──► API Route ──► Presigned URL
                                                              │
                                                              ▼
User (Sydney) ◄─────────────────────── Cloudflare R2 Edge (Sydney)
                     Direct audio stream
```

**How it works:**
1. User requests a track
2. Vercel Edge (closest PoP) generates presigned R2 URL
3. User streams audio directly from Cloudflare R2's edge
4. R2 serves from nearest of 90+ global edge locations

### CDN Performance Characteristics

| Metric | Current (R2 + Vercel) | AWS CloudFront | Google Cloud CDN |
|--------|----------------------|----------------|------------------|
| **Edge Locations** | 90+ (Cloudflare) + 90+ (Vercel) | 450+ | 140+ |
| **Latency (avg)** | 20-50ms | 15-40ms | 20-50ms |
| **Egress Cost** | **$0.00** (R2 free egress) | $0.085/GB | $0.08/GB |
| **Cache Hit Ratio** | ~85% | ~90% | ~85% |

### What's Working Well

| Aspect | Status | Notes |
|--------|--------|-------|
| **Global Audio Delivery** | ✅ Excellent | R2 edge caching, zero egress costs |
| **Image Delivery** | ✅ Excellent | Presigned URLs, proper caching headers |
| **API Response Times** | ✅ Good | Vercel Edge Functions, ~50-150ms globally |
| **SSL/TLS** | ✅ Automatic | Managed by Vercel |
| **DDoS Protection** | ✅ Included | Cloudflare + Vercel automatic protection |
| **HTTP/2 & HTTP/3** | ✅ Enabled | Modern protocols for faster loading |

### Potential Performance Improvements

| Issue | Impact | Solution | Priority |
|-------|--------|----------|----------|
| **No CDN for API responses** | Medium | Implement stale-while-revalidate caching | Low |
| **Album art not edge-cached** | Low | Add Cache-Control headers to presigned URLs | Low |
| **Large album pages** | Low | Implement pagination/infinite scroll | Done ✅ |
| **No audio preloading** | Low | Preload next track in queue | Future |

---

## Scaling Analysis

### Current Capacity (No Changes Needed)

| Metric | Current Limit | Bottleneck |
|--------|---------------|------------|
| **Concurrent Users** | ~50,000 | Supabase connection pooling |
| **API Requests/sec** | ~10,000 | Vercel serverless concurrency |
| **Audio Streams** | Unlimited | R2 has no request limits |
| **Database Size** | 8GB (free) / 500GB (Pro) | Supabase plan |
| **File Storage** | Unlimited | R2 pay-per-GB stored |

### Scaling Triggers & Actions

| User Count | Actions Required | Estimated Cost |
|------------|------------------|----------------|
| **0-10,000 MAU** | None - current setup handles this | ~$150-300/mo |
| **10,000-50,000 MAU** | Upgrade Supabase to Pro | ~$500-800/mo |
| **50,000-100,000 MAU** | Add read replicas, connection pooling | ~$800-1,500/mo |
| **100,000-500,000 MAU** | Multi-region database, dedicated compute | ~$2,000-5,000/mo |
| **500,000+ MAU** | Custom infrastructure evaluation | TBD |

---

## Cost Comparison: Current vs AWS vs Google Cloud

### Scenario: 50,000 Monthly Active Users
**Assumptions:** 100 streams/user/month, 5MB avg audio file, 500GB stored

| Cost Category | Current Stack | AWS Equivalent | Google Cloud |
|---------------|---------------|----------------|--------------|
| **Compute** | $20 (Vercel Pro) | $150 (Lambda + API Gateway) | $120 (Cloud Run) |
| **Database** | $25 (Supabase Pro) | $100 (RDS PostgreSQL) | $80 (Cloud SQL) |
| **File Storage** | $8 (R2, 500GB) | $12 (S3) | $10 (Cloud Storage) |
| **CDN/Egress** | **$0** (R2 free egress) | **$425** (CloudFront 5TB) | **$400** (Cloud CDN) |
| **Auth** | $0 (Supabase included) | $50 (Cognito) | $0 (Firebase Auth) |
| **Total/month** | **~$53** | **~$737** | **~$610** |

### Why Our Stack is 10-14x Cheaper

1. **Zero Egress Fees (R2)** - This is the biggest win. Audio streaming egress at scale is extremely expensive on AWS/GCP.
2. **Serverless by Default** - No idle compute costs
3. **Managed Services** - No DevOps overhead for database, auth, etc.
4. **Vercel's Generous Limits** - Pro plan includes significant bandwidth

---

## Architecture Strengths

### 1. Cost Efficiency
- **Zero egress fees** on audio streaming (R2)
- **Serverless compute** - pay only for actual usage
- **No infrastructure management** - reduced DevOps costs

### 2. Global Performance
- **90+ edge locations** via Cloudflare
- **Automatic geo-routing** - users served from nearest PoP
- **Sub-100ms TTFB** for most regions

### 3. Developer Velocity
- **Single codebase** for web, iOS, Android
- **Type-safe** end-to-end (TypeScript)
- **Instant deployments** via Git push
- **Preview deployments** for every PR

### 4. Security
- **Row Level Security** - database-level access control
- **Presigned URLs** - time-limited file access
- **Managed SSL** - automatic certificate renewal
- **PCI Compliance** - Stripe handles all payment data

### 5. Reliability
- **99.99% uptime** SLA (Vercel Enterprise)
- **Automatic failover** - serverless functions are stateless
- **Database backups** - daily automatic backups (Supabase)

---

## Architecture Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Vendor Lock-in (Vercel)** | Medium | Nuxt is portable; can deploy to any Node.js host |
| **Supabase Outage** | Medium | Supabase has 99.9% SLA; can migrate to self-hosted PostgreSQL |
| **R2 Unavailability** | Low | Cloudflare's global network is highly resilient |
| **Stripe Dependency** | Low | Industry standard; alternative payment processors available |
| **Single Region Database** | Medium | Supabase Pro includes read replicas; can add as needed |

---

## Comparison: Serverless vs Traditional Architecture

### If We Built on AWS EC2/Traditional Infrastructure

```
Traditional Architecture (NOT our approach):

┌────────────┐     ┌─────────────┐     ┌────────────┐
│ Load       │ ──► │ EC2 Cluster │ ──► │ RDS        │
│ Balancer   │     │ (3x t3.large)│    │ PostgreSQL │
└────────────┘     └─────────────┘     └────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ ElastiCache │
                   │ (Redis)     │
                   └─────────────┘

Monthly Cost at 50K MAU: ~$800-1,200 (compute alone)
+ DevOps engineer needed: ~$8,000-12,000/month
```

### Our Serverless Approach

```
Current Architecture:

┌────────────────────────────────────────┐
│           Vercel (Auto-scales)          │
│  ┌──────────────────────────────────┐  │
│  │    Serverless Functions (0-∞)    │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘

Monthly Cost at 50K MAU: ~$50-100
DevOps needed: None (fully managed)
```

---

## Future Architecture Considerations

### Phase 1: Current → 100K Users (No changes needed)
- Current architecture handles this scale
- May need Supabase Pro upgrade at ~50K users

### Phase 2: 100K → 500K Users
- Add Supabase read replicas for analytics queries
- Implement query caching (Redis via Upstash)
- Consider moving heavy analytics to separate service

### Phase 3: 500K+ Users
- Evaluate dedicated compute for API routes
- Multi-region database deployment
- Custom CDN rules for audio content

### Optional Future Enhancements
| Enhancement | Benefit | Complexity |
|-------------|---------|------------|
| **Audio Transcoding Service** | Multiple quality options, bandwidth savings | Medium |
| **Recommendation Engine** | Improved discovery, retention | High |
| **Real-time Collaboration** | Live playlist editing | Low (Supabase Realtime) |
| **Offline Sync** | Better mobile experience | Medium |

---

## Feature Analysis: HiFi / Lossless Audio Streaming

### Overview

This section analyzes the feasibility and cost implications of adding high-quality lossless audio streaming (FLAC/ALAC) as a premium feature, similar to Tidal HiFi, Apple Music Lossless, or Amazon Music HD.

### Audio Quality Tiers Comparison

| Quality Tier | Format | Bitrate | File Size (4 min track) | Use Case |
|--------------|--------|---------|-------------------------|----------|
| **Standard** | MP3 320kbps | 320 kbps | ~10 MB | Current default |
| **HiFi** | FLAC 16-bit/44.1kHz | ~1,411 kbps | ~40 MB | CD quality |
| **Hi-Res** | FLAC 24-bit/96kHz | ~4,608 kbps | ~130 MB | Studio quality |

### Storage Impact Analysis

**Scenario: 10,000 tracks in catalog**

| Quality | Avg File Size | Total Storage | R2 Storage Cost/month |
|---------|---------------|---------------|----------------------|
| **MP3 320 only** | 10 MB | 100 GB | $1.50 |
| **MP3 + FLAC HiFi** | 10 + 40 MB | 500 GB | $7.50 |
| **MP3 + FLAC + Hi-Res** | 10 + 40 + 130 MB | 1.8 TB | $27.00 |

**Scenario: 100,000 tracks in catalog**

| Quality | Avg File Size | Total Storage | R2 Storage Cost/month |
|---------|---------------|---------------|----------------------|
| **MP3 320 only** | 10 MB | 1 TB | $15 |
| **MP3 + FLAC HiFi** | 10 + 40 MB | 5 TB | $75 |
| **MP3 + FLAC + Hi-Res** | 10 + 40 + 130 MB | 18 TB | $270 |

> **Note:** R2 storage costs $0.015/GB/month. Egress remains FREE regardless of file size.

### Bandwidth Impact (Still Free!)

One of Indiestream's biggest advantages is **zero egress fees** with Cloudflare R2. This means:

| Quality | Data per Stream | 1M streams/month | Egress Cost |
|---------|-----------------|------------------|-------------|
| **MP3 320** | 10 MB | 10 TB | **$0** (R2) |
| **FLAC HiFi** | 40 MB | 40 TB | **$0** (R2) |
| **FLAC Hi-Res** | 130 MB | 130 TB | **$0** (R2) |

**On AWS/GCP, this same 40TB of HiFi streaming would cost $3,400-$4,000/month in egress fees alone.**

### Architecture Changes Required

```
Current Architecture (MP3 only):
┌──────────────┐     ┌─────────────────┐
│ Artist Upload│ ──► │ R2 Storage      │ ──► User streams MP3
│ (any format) │     │ (single file)   │
└──────────────┘     └─────────────────┘

Proposed Architecture (Multi-quality):
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Artist Upload│ ──► │ Transcoding     │ ──► │ R2 Storage      │
│ (FLAC/WAV)   │     │ Queue           │     │ (multiple files)│
└──────────────┘     └─────────────────┘     └─────────────────┘
                            │                        │
                     ┌──────┴──────┐          ┌──────┴──────┐
                     │ Worker      │          │ track_123/  │
                     │ (FFmpeg)    │          │ ├─ mp3_320  │
                     │             │          │ ├─ flac_16  │
                     └─────────────┘          │ └─ flac_24  │
                                              └─────────────┘
```

### Implementation Components

| Component | Purpose | Options | Est. Cost |
|-----------|---------|---------|-----------|
| **Transcoding Worker** | Convert uploads to multiple formats | Vercel Functions, AWS Lambda, or dedicated service | $20-100/mo |
| **Job Queue** | Manage transcoding jobs | Upstash Redis, AWS SQS | $0-20/mo |
| **Database Changes** | Track available qualities per track | Supabase (existing) | $0 |
| **UI Changes** | Quality selector in player | Frontend only | $0 |
| **Additional Storage** | Store multiple formats | R2 | 4-5x current |

### Cost Comparison: With vs Without HiFi

**At 50,000 MAU, 100 streams/user/month, 50,000 tracks**

| Cost Category | Current (MP3 only) | With HiFi (FLAC) | Difference |
|---------------|--------------------|--------------------|------------|
| **Compute** | $20 | $40-70 | +$20-50 |
| **Database** | $25 | $25 | $0 |
| **Storage** | $8 (500GB) | $38 (2.5TB) | +$30 |
| **CDN/Egress** | $0 | $0 | $0 |
| **Transcoding** | $0 | $20-50 | +$20-50 |
| **Total/month** | **~$53** | **~$123-183** | **+$70-130** |

### HiFi on AWS/GCP (For Comparison)

| Cost Category | AWS with HiFi | Google Cloud with HiFi |
|---------------|---------------|------------------------|
| **Storage** | $58 (S3, 2.5TB) | $50 (Cloud Storage) |
| **CDN/Egress (40TB)** | **$3,400** | **$3,200** |
| **Transcoding** | $100 (MediaConvert) | $80 (Transcoder API) |
| **Total/month** | **~$3,700** | **~$3,450** |

**Our stack with HiFi: ~$150/mo vs AWS: ~$3,700/mo = 25x cheaper**

### Business Model Considerations

**Potential Pricing:**
- Current Listener subscription: $9.99/mo
- HiFi tier (new): $14.99-19.99/mo (+$5-10 premium)

**Break-even Analysis:**
- Additional infrastructure cost: ~$100/mo at scale
- HiFi premium per user: $5-10/mo
- Break-even: 10-20 HiFi subscribers

### Recommendation: When to Implement

| Factor | Assessment |
|--------|------------|
| **Technical Complexity** | Medium - requires transcoding pipeline |
| **Storage Cost Impact** | Moderate - 4-5x increase but still cheap |
| **Egress Cost Impact** | None - R2 free egress is the key advantage |
| **Market Differentiation** | High - audiophile market underserved |
| **Revenue Potential** | Good - $5-10 premium is industry standard |

### Implementation Priority Matrix

| Phase | When to Implement | Rationale |
|-------|-------------------|-----------|
| **Now** | ❌ Not recommended | Focus on core features, user acquisition |
| **10K MAU** | ⚠️ Consider | Have user feedback, some paying customers |
| **50K MAU** | ✅ Recommended | Revenue can fund development, clear demand signal |
| **100K+ MAU** | ✅ Definitely | Competitive necessity, revenue diversification |

### Conclusion: HiFi Feature

**Should we implement HiFi streaming now?**

**No, defer to later phase.** Here's why:

1. **Cost is manageable** - Our R2 architecture makes HiFi viable (no egress fees)
2. **But complexity is real** - Transcoding pipeline requires significant development
3. **Focus on growth first** - Better ROI from user acquisition than premium features
4. **Easy to add later** - Architecture doesn't need to change, just add transcoding layer

**When we do implement:**
- Start with FLAC 16-bit/44.1kHz (CD quality) only
- Use Vercel Functions + FFmpeg for transcoding
- Offer as $14.99/mo "HiFi" tier
- Expected additional cost: ~$100-150/mo at scale
- Break-even: ~15-20 HiFi subscribers

---

## Key Metrics to Monitor

| Metric | Current | Warning Threshold | Action |
|--------|---------|-------------------|--------|
| **API P95 Latency** | ~150ms | >500ms | Investigate slow queries |
| **Database Connections** | ~20 | >80% of limit | Upgrade plan |
| **Serverless Invocations** | ~50K/day | >1M/day | Review Vercel plan |
| **R2 Storage** | ~50GB | >500GB | Normal growth |
| **Error Rate** | <0.1% | >1% | Immediate investigation |

---

## Conclusion

Indiestream's architecture is **production-ready, cost-efficient, and globally scalable**. The combination of Vercel, Supabase, and Cloudflare R2 provides:

1. **10-14x lower costs** than equivalent AWS/GCP deployments
2. **Global performance** with zero egress fees
3. **Automatic scaling** with no infrastructure management
4. **Clear upgrade path** as user base grows

The platform can comfortably serve **100,000+ monthly active users** on the current architecture with minor adjustments, and has a clear scaling path beyond that.

---

## Appendix: Service Providers

| Service | Provider | Plan | Monthly Cost |
|---------|----------|------|--------------|
| Hosting/Compute | Vercel | Pro | $20 |
| Database | Supabase | Free → Pro | $0-25 |
| File Storage | Cloudflare R2 | Pay-as-you-go | ~$8 (500GB) |
| Payments | Stripe | Pay-as-you-go | 2.9% + $0.30/txn |
| Email | Resend | Free tier | $0 |
| Domain | Cloudflare | Annual | ~$10/year |

**Current Total:** ~$30-50/month (excluding Stripe transaction fees)

---

*Document prepared by the Indiestream Technical Team*
