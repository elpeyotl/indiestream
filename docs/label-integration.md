# Implementation Plan: Labels as First-Class Entities

## Overview

Add Labels as first-class entities to Fairtune, enabling label pages, searchable profiles, and proper revenue routing. Labels will have their own Stripe Connect accounts, and revenue from label releases will flow to the label (who then pays artists externally per their contracts).

## Key Design Decisions

- **Labels are entities** with profiles, pages, and Stripe Connect accounts
- **Revenue routing**: Album with label → label gets paid. Self-released → band gets paid
- **Standardized selection**: Autocomplete prevents duplicates ("YellingLight" vs "Yelling Light")
- **Keep flexibility**: Any user can still create multiple artist profiles

---

## Phase 1: Database Schema

### Create `labels` table

```sql
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  location TEXT,
  website TEXT,

  -- Branding
  logo_key TEXT,
  logo_url TEXT,
  banner_key TEXT,
  banner_url TEXT,
  theme_color TEXT DEFAULT '#8B5CF6',

  -- Stripe Connect for payouts
  stripe_account_id TEXT,

  -- Stats (denormalized)
  album_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  total_streams INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labels_owner_id ON labels(owner_id);
CREATE INDEX idx_labels_slug ON labels(slug);
CREATE INDEX idx_labels_name_search ON labels USING gin (name gin_trgm_ops);
```

### Create `label_balances` table (mirrors artist_balances)

```sql
CREATE TABLE label_balances (
  label_id UUID PRIMARY KEY REFERENCES labels(id) ON DELETE CASCADE,
  balance_cents INTEGER DEFAULT 0,
  lifetime_earnings_cents INTEGER DEFAULT 0,
  last_payout_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create `label_earnings` table (mirrors artist_earnings)

```sql
CREATE TABLE label_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID REFERENCES labels(id),
  revenue_period_id UUID REFERENCES revenue_periods(id),
  stream_count INTEGER DEFAULT 0,
  listening_seconds INTEGER DEFAULT 0,
  gross_earnings_cents INTEGER DEFAULT 0,
  net_earnings_cents INTEGER DEFAULT 0,
  payout_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modify `albums` table

```sql
ALTER TABLE albums ADD COLUMN label_id UUID REFERENCES labels(id) ON DELETE SET NULL;
CREATE INDEX idx_albums_label_id ON albums(label_id);
-- Keep label_name for display/fallback
```

### RLS Policies

- Labels: Public read (active only), owner can create/update/delete
- Label balances/earnings: Owner read only

---

## Phase 2: TypeScript Types

### Files to modify

- `types/database.ts` - Add after Supabase regeneration:
  - `Label`, `LabelInsert`, `LabelUpdate`
  - `LabelBalance`, `LabelEarnings`

---

## Phase 3: Label Store

### Create new store

- **File**: `stores/label.ts`
- **Pattern**: Follow `stores/band.ts` SWR caching pattern

**Functions needed**:
- `getUserLabels()` - Get labels owned by current user
- `getLabelBySlug()` / `getLabelById()` - Fetch single label
- `searchLabels(query)` - Autocomplete search
- `createLabel()` / `updateLabel()` / `deleteLabel()` - CRUD
- `isSlugAvailable()` / `generateSlug()` - Slug helpers

---

## Phase 4: API Endpoints

### Label CRUD endpoints

Create in `server/api/labels/`:

| File | Method | Purpose |
|------|--------|---------|
| `index.get.ts` | GET | List all active labels |
| `index.post.ts` | POST | Create new label |
| `[slug].get.ts` | GET | Get label by slug (public) |
| `[id].patch.ts` | PATCH | Update label (owner) |
| `[id].delete.ts` | DELETE | Delete label (owner) |
| `search.get.ts` | GET | Autocomplete search |
| `[slug]/albums.get.ts` | GET | Albums under label |

### Modify revenue endpoints

**`server/api/admin/calculate-payouts.post.ts`**:
- After calculating band earnings from listening data, check each track's album
- If album has `label_id`: credit `label_earnings` and `label_balances`
- If no `label_id`: credit `artist_earnings` and `artist_balances` (current)

**`server/api/albums/[id]/purchase.post.ts`**:
- Check if album has `label_id`
- If yes: transfer 85% to label's Stripe account
- If no: transfer to band's Stripe account (current)

---

## Phase 5: Upload Wizard Integration

### Modify composable

**`composables/useUploadWizard.ts`**:

Add to `AlbumForm` interface:
```typescript
label_id: string | null  // null = self-released
label_name: string       // keep for display
```

Update `defaultAlbumForm()`:
```typescript
label_id: null,
label_name: '',
```

### Create Label Selector component

**File**: `components/upload/LabelSelector.vue`

Features:
- Autocomplete search for existing labels
- "Create new label" option when no match
- "Self-released" option (sets label_id to null)
- Show label logo in dropdown

### Update Album Details Step

**`components/upload/AlbumDetailsStep.vue`**:
- Replace plain text input with `LabelSelector` component
- When label selected: set both `label_id` and `label_name`
- When self-released: set `label_id = null`, `label_name = bandName`

---

## Phase 6: Label Pages

### Public label page

**File**: `pages/label/[slug].vue`

Structure (follow `pages/[artist]/index.vue` pattern):
- Hero banner with logo
- Label bio, location, website
- Grid of albums under this label
- Stats (album count, total streams)

### Dashboard pages

| File | Purpose |
|------|---------|
| `pages/dashboard/labels/index.vue` | List user's labels |
| `pages/dashboard/labels/new.vue` | Create new label |
| `pages/dashboard/labels/[id].vue` | Edit label details |

### Components

- `components/LabelCard.vue` - Card for search results/lists

---

## Phase 7: Search Integration

### Modify global search

**`components/GlobalSearch.vue`**:
- Add "Labels" section to results
- Query labels table

**`pages/search.vue`**:
- Display label results using `LabelCard`

---

## Phase 8: Album Display

### Show label on album page

**`pages/[artist]/[album].vue`**:
- If album has `label_id`: show clickable label name
- Link to `/label/[slug]`

---

## Phase 9: Data Migration

For existing albums with `label_name`:

```sql
-- Create labels from unique label_name values
INSERT INTO labels (owner_id, name, slug, created_at)
SELECT DISTINCT
  b.owner_id,
  a.label_name,
  lower(regexp_replace(a.label_name, '[^a-zA-Z0-9]+', '-', 'g')),
  NOW()
FROM albums a
JOIN bands b ON a.band_id = b.id
WHERE a.label_name IS NOT NULL
  AND a.label_name != ''
  AND a.label_name != b.name;

-- Link albums to labels
UPDATE albums a
SET label_id = l.id
FROM labels l
WHERE a.label_name = l.name;
```

---

## Implementation Order

1. Database migration (tables, indexes, RLS)
2. TypeScript types
3. Label store
4. Label API endpoints (CRUD + search)
5. Label Selector component
6. Update upload wizard
7. Label public page
8. Revenue calculation changes
9. Purchase flow changes
10. Dashboard pages
11. Search integration
12. Data migration

---

## Verification

1. **Create label**: Dashboard → Labels → New → Fill form → Verify label page loads at `/label/[slug]`
2. **Upload with label**: Upload album → Select label from autocomplete → Verify album shows label link
3. **Self-released**: Upload album → Select "Self-released" → Verify no label link shown
4. **Search**: Global search → Type label name → Verify label appears in results
5. **Revenue (manual test)**: Create test purchase → Verify Stripe transfer goes to correct account (label vs band)
6. **Run tests**: `npm run test` and `npm run test:e2e`
