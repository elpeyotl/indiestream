# Artist Payout & Royalty System

This document outlines the requirements and implementation plan for paying artists and handling royalty obligations on Indiestream.

## Overview

When a subscriber streams a track, the artist should receive a share of that subscription revenue. Additionally, the platform has obligations to pay performance royalties to PROs (Performing Rights Organizations) and mechanical royalties for certain uses.

---

## 1. Stripe Connect Integration

### Requirements
- **Account Type**: Express accounts (simplest onboarding, Stripe handles tax forms)
- **Onboarding Flow**: Artist clicks "Set up payouts" → redirected to Stripe → returns to dashboard
- **Verification**: Stripe handles identity verification, tax info (W-9/W-8BEN), bank details

### Database Changes
```sql
ALTER TABLE bands ADD COLUMN stripe_account_id TEXT;
ALTER TABLE bands ADD COLUMN stripe_account_status TEXT DEFAULT 'not_connected';
-- Status: not_connected, pending, active, restricted
```

### Implementation
1. `/api/stripe/connect/create` - Creates Express account, returns onboarding URL
2. `/api/stripe/connect/webhook` - Handles `account.updated` events
3. Dashboard UI showing payout status and "Connect with Stripe" button

---

## 2. Revenue Calculation Models

### Option A: Pro-Rata (Industry Standard)
All subscription revenue goes into one pool, divided by total streams.

```
Artist Share = (Artist's Streams / Total Platform Streams) × Revenue Pool
```

**Pros**: Simple, industry standard (Spotify, Apple Music)
**Cons**: Popular artists get disproportionate share; one user's $10 could go entirely to artists they never listened to

### Option B: User-Centric (Recommended)
Each subscriber's payment is divided only among artists they listened to.

```
Artist Share from User = (Streams to Artist / User's Total Streams) × User's Subscription Fee × Artist Rate
```

**Pros**: Fair to niche artists, aligns with user intent, better for indie platform
**Cons**: More complex calculation, less industry precedent

### Revenue Split Recommendation
- **70% to artists** (industry standard)
- **30% platform fee** (covers costs, PRO fees, operations)

---

## 3. PRO/CMO Royalty Obligations

### What Are PROs?
Performing Rights Organizations collect royalties on behalf of songwriters and publishers for public performances (including streaming).

### Major PROs by Region
| Region | PRO | Notes |
|--------|-----|-------|
| USA | ASCAP, BMI, SESAC | Must license from all three |
| Switzerland | SUISA | Covers CH, may have reciprocal agreements |
| UK | PRS for Music | |
| Germany | GEMA | |
| France | SACEM | |
| Canada | SOCAN | |
| Australia | APRA AMCOS | |

### Licensing Requirements
1. **Blanket License**: Pay a percentage of revenue (typically 5-15%) for right to stream any song in their catalog
2. **Reporting**: Submit usage reports (what was streamed, how many times)
3. **Per-Stream Minimums**: Some PROs have minimum per-stream rates

### Mechanical Royalties
For interactive streaming (user chooses song), mechanical royalties are owed to publishers:
- **USA**: Harry Fox Agency (HFA) or direct licensing
- **Rate**: Statutory rate set by Copyright Royalty Board

### Platform Options
1. **Direct Licensing**: Negotiate with each PRO individually (complex, requires legal)
2. **Aggregator/Distributor**: Use a service that handles licensing (e.g., DistroKid, CD Baby)
3. **MLC (Mechanical Licensing Collective)**: For USA mechanical royalties

---

## 4. Track Metadata Requirements

### ISRC (International Standard Recording Code)
- **What**: Unique 12-character code identifying a specific recording
- **Format**: `CC-XXX-YY-NNNNN` (Country-Registrant-Year-Designation)
- **Who Assigns**: Record labels, distributors, or artists can register
- **Required For**: PRO reporting, royalty tracking, chart eligibility

### ISWC (International Standard Musical Work Code)
- **What**: Identifies the underlying composition (not the recording)
- **Format**: `T-123456789-0`
- **Who Assigns**: PROs assign when work is registered
- **Required For**: Publishing royalties, sync licensing

### IPI/CAE Numbers
- **What**: Identifies songwriters, composers, publishers
- **Who Has One**: Anyone registered with a PRO
- **Required For**: Accurate royalty distribution to creators

### Required Database Schema Updates

```sql
-- Track metadata for royalties
ALTER TABLE tracks ADD COLUMN isrc VARCHAR(12);
ALTER TABLE tracks ADD COLUMN iswc VARCHAR(15);

-- Composer/writer credits (many-to-many)
CREATE TABLE track_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'composer', 'lyricist', 'performer', 'producer'
  name VARCHAR(255) NOT NULL,
  ipi_number VARCHAR(20), -- Optional, for PRO-registered creators
  share_percentage DECIMAL(5,2), -- Their share of composition (for publishing)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Album-level metadata
ALTER TABLE albums ADD COLUMN upc VARCHAR(12); -- Universal Product Code
ALTER TABLE albums ADD COLUMN label_name VARCHAR(255);
ALTER TABLE albums ADD COLUMN p_line VARCHAR(255); -- ℗ 2026 Label Name
ALTER TABLE albums ADD COLUMN c_line VARCHAR(255); -- © 2026 Publisher Name
```

### Upload Form Updates
Add fields for:
- [ ] ISRC (optional - we could generate if not provided)
- [ ] Composer/Songwriter credits
- [ ] Publisher information
- [ ] "I own/control all rights" checkbox
- [ ] Content ID opt-in (for future YouTube, etc.)

---

## 5. Payout Calculation & Distribution

### Monthly Payout Cycle
1. **Day 1-28**: Collect streaming data
2. **End of Month**: Calculate revenue distribution
3. **Day 1-5 Next Month**: Generate payout reports
4. **Day 5-10**: Process Stripe transfers
5. **Day 10-15**: Artists receive funds

### Minimum Payout Threshold
- **$10 minimum** (industry standard)
- Balances roll over until threshold met
- Option to request payout below threshold (with fee)

### Database Schema for Payouts

```sql
-- Monthly revenue calculations
CREATE TABLE revenue_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_subscription_revenue_cents BIGINT NOT NULL,
  total_streams BIGINT NOT NULL,
  artist_pool_cents BIGINT NOT NULL, -- 70% of revenue
  platform_fee_cents BIGINT NOT NULL, -- 30%
  pro_reserve_cents BIGINT NOT NULL, -- Set aside for PRO payments
  status VARCHAR(20) DEFAULT 'calculating', -- calculating, finalized, paid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-artist earnings per period
CREATE TABLE artist_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_period_id UUID REFERENCES revenue_periods(id),
  band_id UUID REFERENCES bands(id),
  stream_count BIGINT NOT NULL,
  gross_earnings_cents BIGINT NOT NULL,
  platform_fee_cents BIGINT NOT NULL,
  net_earnings_cents BIGINT NOT NULL,
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, paid, failed
  stripe_transfer_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Running balance for artists below threshold
CREATE TABLE artist_balances (
  band_id UUID PRIMARY KEY REFERENCES bands(id),
  balance_cents BIGINT DEFAULT 0,
  last_payout_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Reporting & Compliance

### Artist Dashboard Requirements
- Total earnings (all time, this month)
- Pending balance
- Payout history
- Per-track breakdown
- Geographic breakdown (for PRO reporting)

### PRO Reporting Format
Most PROs accept:
- **DDEX**: Industry standard XML format
- **CSV**: Custom format per PRO
- **CWR (Common Works Registration)**: For registering new works

### Tax Compliance
- **1099-K** (USA): Required if artist earns >$600/year
- **Stripe handles**: Tax form collection, 1099 generation for Express accounts
- **International**: W-8BEN for non-US artists

---

## 7. Implementation Phases

### Phase 1: Stripe Connect (MVP)
- [ ] Add `stripe_account_id` to bands table
- [ ] Create Connect onboarding flow
- [ ] Build "Earnings" tab in artist dashboard
- [ ] Manual monthly payouts via Stripe dashboard

### Phase 2: Automated Payouts
- [ ] Revenue period calculation job (monthly cron)
- [ ] Automated Stripe transfers
- [ ] Payout history and reporting
- [ ] Email notifications for payouts

### Phase 3: Enhanced Metadata
- [ ] ISRC field on track upload
- [ ] Composer/credit management
- [ ] Rights verification workflow
- [ ] Content ID integration prep

### Phase 4: PRO Compliance
- [ ] Research and apply for blanket licenses
- [ ] Build DDEX export for usage reporting
- [ ] PRO fee reserve and payment tracking
- [ ] Mechanical royalty handling (USA)

### Phase 5: Advanced Features
- [ ] Real-time earnings dashboard
- [ ] User-centric payout model
- [ ] Advance payments for established artists
- [ ] Split payments (multiple rights holders)

---

## 8. Key Business Decisions Needed

Before implementation, decide:

1. **Revenue Model**: Pro-rata or user-centric?
2. **Artist Split**: 70/30? 80/20?
3. **Minimum Payout**: $10? $25?
4. **PRO Strategy**: Direct licensing or through aggregator?
5. **ISRC Generation**: Generate for artists or require them to provide?
6. **Geographic Scope**: Which countries to support initially?
7. **Content Moderation**: Rights verification before payout eligibility?

---

## 9. Legal Considerations

### Required Before Launch
- [ ] Terms of Service update (payout terms, rights warranties)
- [ ] Artist agreement/contract
- [ ] Privacy policy update (tax info handling)
- [ ] PRO license agreements
- [ ] Legal review of payout calculations

### Ongoing Compliance
- Tax form collection and filing
- PRO quarterly/annual reporting
- DMCA/takedown procedures
- Audit trail for all payments

---

## 10. Third-Party Services to Evaluate

| Service | Purpose | Cost |
|---------|---------|------|
| Stripe Connect | Artist payouts | 0.25% + $0.25 per payout |
| Stripe Tax | Tax calculation | 0.5% of transaction |
| MLC | US mechanical royalties | Free to register |
| SoundExchange | US digital performance | Free to register |
| DDEX | Reporting format | Membership fee |

---

## Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [MLC Portal](https://www.themlc.com/)
- [DDEX Standards](https://ddex.net/)
- [ISRC Registration](https://usisrc.org/)
- [Copyright Royalty Board Rates](https://www.crb.gov/)

---

*Last updated: January 2026*
