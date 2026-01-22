# Domain Migration to fairtune.fm

## Summary
Migrate from `fairtune.vercel.app` to `fairtune.fm` as production domain, with `dev.fairtune.fm` as the development/staging environment.

---

## Architecture Overview

```
Production:  fairtune.fm          → Vercel (main branch)
Development: dev.fairtune.fm      → Vercel (main branch, preview)
Legacy:      fairtune.vercel.app → Can keep as alias (optional)
```

**Yes, you can keep fairtune.vercel.app** - Vercel allows multiple domains pointing to the same deployment. It will continue working as an alias.

---

## Phase 1: Vercel Domain Setup

### 1.1 Add Custom Domains in Vercel Dashboard
1. Go to Project Settings → Domains
2. Add `fairtune.fm` as production domain
3. Add `dev.fairtune.fm` as preview/development domain
4. Keep `fairtune.vercel.app` (automatic, can't remove)

### 1.2 DNS Configuration (at your domain registrar)
```
Type    Name    Value                           TTL
A       @       76.76.21.21                     3600
CNAME   www     cname.vercel-dns.com            3600
CNAME   dev     cname.vercel-dns.com            3600
```

### 1.3 Vercel Environment Variables
Set per-environment `APP_URL`:
- **Production**: `APP_URL=https://fairtune.fm`
- **Preview**: `APP_URL=https://dev.fairtune.fm`

---

## Phase 2: Code Updates

### 2.1 Update Fallback URLs
| File | Line | Change |
|------|------|--------|
| `nuxt.config.ts` | 159 | `'https://fairtune.vercel.app'` → `'https://fairtune.fm'` |
| `server/emails/base.ts` | 8, 10 | `'https://fairtune.vercel.app'` → `'https://fairtune.fm'` |
| `server/api/playlists/[id]/share.post.ts` | 29 | `'https://fairtune.art'` → `'https://fairtune.fm'` |
| `server/api/musicbrainz/search-work.get.ts` | 44 | User-Agent: `'https://fairtune.app'` → `'https://fairtune.fm'` |
| `app.config.ts` | 12-13 | `domain: 'fairtune.fm'`, `url: 'https://fairtune.fm'` |

### 2.2 Email Contact References (Keep Gmail for now)
These will continue using `hello@fairtune.fm` until you set up @fairtune.fm email:
- `server/emails/PayoutFailedEmail.ts:60`
- `server/emails/PaymentFailedEmail.ts:63`
- `nuxt.config.ts:152` (contactEmail fallback)

**No code changes needed now** - update these when you configure fairtune.fm email.

### 2.3 Update Storage Key (optional, for clean migration)
| File | Line | Change |
|------|------|--------|
| `composables/useBackgroundEffect.ts` | 29 | `'fairtune-background-effect'` → `'fairtune-background-effect'` |

### 2.4 Update Package Name (optional)
| File | Change |
|------|--------|
| `package.json` | `"name": "fairtune"` → `"name": "fairtune"` |

### 2.5 Dashboard URLs Already Correct
These files already show `fairtune.fm/`:
- `pages/dashboard/index.vue:185`
- `pages/dashboard/artist/new.vue:78`
- `pages/dashboard/artist/[id].vue:77, 81`

---

## Phase 3: External Service Updates

### 3.1 Supabase Auth Redirects
In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `https://fairtune.fm`
- **Redirect URLs**: Add:
  - `https://fairtune.fm/**`
  - `https://dev.fairtune.fm/**`
  - `https://fairtune.vercel.app/**` (keep for backwards compat)
  - `http://localhost:3000/**`

### 3.2 Stripe Webhook Endpoints
In Stripe Dashboard → Developers → Webhooks:
- Add new endpoint: `https://fairtune.fm/api/stripe/webhook`
- Add new endpoint: `https://fairtune.fm/api/stripe/connect/webhook`
- Keep old endpoints during transition, remove later

### 3.3 Email Setup with fairtune.fm Domain (Future)

**Current:** Keep using `hello@fairtune.fm` for now.

**To set up @fairtune.fm email later:**

#### Option A: Resend for Transactional Email Only
1. **Add domain in Resend Dashboard** (resend.com/domains)
   - Click "Add Domain" → Enter `fairtune.fm`

2. **Add DNS records at your registrar:**
   ```
   Type    Name                        Value                                   TTL
   TXT     @                           v=spf1 include:amazonses.com ~all       3600
   TXT     resend._domainkey           [Resend provides this DKIM value]       3600
   CNAME   email-bounce                feedback-smtp.us-east-1.amazonses.com   3600
   ```

3. **Update Vercel environment variable:**
   ```
   RESEND_FROM_EMAIL=hello@fairtune.fm
   ```

4. **Update nuxt.config.ts fallback:**
   ```typescript
   resendFromEmail: process.env.RESEND_FROM_EMAIL || 'hello@fairtune.fm',
   ```

#### Option B: Full Email with Google Workspace or Zoho
If you want to **receive** email at hello@fairtune.fm:

**Google Workspace ($6/user/month):**
1. Sign up at workspace.google.com
2. Add MX records:
   ```
   Type    Priority    Name    Value
   MX      1           @       ASPMX.L.GOOGLE.COM
   MX      5           @       ALT1.ASPMX.L.GOOGLE.COM
   MX      5           @       ALT2.ASPMX.L.GOOGLE.COM
   MX      10          @       ALT3.ASPMX.L.GOOGLE.COM
   MX      10          @       ALT4.ASPMX.L.GOOGLE.COM
   ```

**Zoho Mail (Free for 1 user):**
1. Sign up at zoho.com/mail
2. Add MX records:
   ```
   Type    Priority    Name    Value
   MX      10          @       mx.zoho.com
   MX      20          @       mx2.zoho.com
   ```

**Note:** You can use Zoho/Google for receiving and Resend for sending transactional emails - they work together.

---

## Phase 4: Documentation Updates

Update these doc files to reflect new domain:
- `README.md` - Domain reference
- `docs/BRAND.md` - Primary domain, social handles
- `docs/NATIVE_APP_UX.md` - All fairtune.art references
- `docs/NOTES.md` - Production URL
- `docs/SUPABASE_SETUP.md` - Project name mention

---

## Files to Modify

**Critical (code) - 7 files:**
- `nuxt.config.ts` - appUrl fallback
- `app.config.ts` - brand domain/url
- `server/emails/base.ts` - email URL fallbacks
- `server/api/playlists/[id]/share.post.ts` - share URL fallback
- `server/api/musicbrainz/search-work.get.ts` - User-Agent URL
- `composables/useBackgroundEffect.ts` - localStorage key
- `package.json` - package name

**Documentation - 5 files:**
- `README.md`
- `docs/BRAND.md`
- `docs/NATIVE_APP_UX.md`
- `docs/NOTES.md`
- `docs/SUPABASE_SETUP.md`

**NOT changing now** (email addresses - keep Gmail until @fairtune.fm is set up):
- `server/emails/PayoutFailedEmail.ts`
- `server/emails/PaymentFailedEmail.ts`
- `nuxt.config.ts` (contactEmail)

---

## Verification

1. **Local testing**: Set `APP_URL=https://fairtune.fm` in `.env`, verify links in emails
2. **Deploy to Vercel**: Push changes, verify domain routing
3. **Test auth flow**: Login/register with new domain
4. **Test Stripe checkout**: Complete test purchase, verify redirect URLs
5. **Test emails**: Send test emails, verify all links point to fairtune.fm
6. **Test playlist sharing**: Share a playlist, verify URL format

---

## Migration Checklist

- [ ] DNS records configured at registrar
- [ ] Domains added in Vercel
- [ ] Environment variables set in Vercel (APP_URL per environment)
- [ ] Code changes deployed
- [ ] Supabase redirect URLs updated
- [ ] Stripe webhooks added for new domain
- [ ] (Optional) Resend email domain configured
- [ ] Test all flows on production
