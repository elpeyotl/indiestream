# Fairtune Brand Guidelines

## Platform Identity

**Name:** Fairtune
**Tagline:** "70% to artists. No pool. No mystery."
**Mission:** A streaming platform where your money goes to the artists you actually listen to. No pool. No mystery math. You see every cent.

## Target Audience

- **Artists:** Independent musicians and bands seeking fair, transparent revenue
- **Listeners:** Music fans who want to directly support indie artists
- **Values:** Transparency, fairness, direct artist-fan connection

---

## Visual Identity

### Direction: Electric Purple
Modern, bold, creative. A premium dark theme with vibrant purple gradients that feels like the future of music streaming. Professional yet artistic.

### Color Palette

```css
/* Background Colors - Deep Zinc */
--color-bg-primary: #09090B;      /* Deep black with blue undertone */
--color-bg-surface: #18181B;      /* Card backgrounds */
--color-bg-elevated: #27272A;     /* Hover states, elevated surfaces */

/* Primary Accent - Violet Spectrum */
--color-accent-primary: #8B5CF6;   /* Violet - Primary CTAs, buttons */
--color-accent-secondary: #A78BFA; /* Light violet - Hover states */
--color-accent-fuchsia: #D946EF;   /* Fuchsia - Gradients, highlights */
--color-accent-pink: #EC4899;      /* Pink - Special highlights */

/* Secondary Accent - Complementary */
--color-accent-teal: #2DD4BF;      /* Teal - Artist earnings, success states */
--color-accent-blue: #3B82F6;      /* Blue - Interactive elements, links */

/* Text Colors */
--color-text-primary: #FAFAFA;     /* Headlines, primary text */
--color-text-secondary: #A1A1AA;   /* Body text, descriptions */
--color-text-muted: #71717A;       /* Captions, metadata */

/* Semantic Colors */
--color-success: #2DD4BF;          /* Teal - positive actions */
--color-warning: #F59E0B;          /* Amber - warnings */
--color-error: #EF4444;            /* Red - errors */
```

### Gradient Usage

```css
/* Primary Brand Gradient - Headlines, Hero sections */
background: linear-gradient(to right, #8B5CF6, #D946EF, #EC4899);

/* Logo Gradient */
background: linear-gradient(to bottom-right, #8B5CF6, #D946EF);

/* CTA Gradient - Buttons, Cards */
background: linear-gradient(to bottom-right, #7C3AED, #DB2777);

/* Success/Earnings Gradient */
background: linear-gradient(to bottom-right, #2DD4BF, #10B981);

/* Timeline/Flow Gradient */
background: linear-gradient(to bottom, #8B5CF6, #D946EF, #2DD4BF);
```

### Typography

**Primary Font:** Space Grotesk
**Fallback:** -apple-system, BlinkMacSystemFont, sans-serif
**Monospace:** JetBrains Mono (for code, data, stats)

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

**Font Sizes:**
```css
--text-xs: 0.75rem;    /* 12px - Captions */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-base: 1rem;     /* 16px - Body */
--text-lg: 1.125rem;   /* 18px - Large body */
--text-xl: 1.25rem;    /* 20px - Section headers */
--text-2xl: 1.5rem;    /* 24px - Card titles */
--text-3xl: 1.875rem;  /* 30px - Page headers */
--text-4xl: 2.25rem;   /* 36px - Hero subheaders */
--text-5xl: 3rem;      /* 48px - Hero headers */
--text-6xl: 3.75rem;   /* 60px - Hero headers (desktop) */
--text-7xl: 4.5rem;    /* 72px - Hero headers (large screens) */
```

### Spacing & Layout

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */

--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

---

## Brand Voice & Tone

### Overall Tone
Direct, honest, anti-corporate. For people who actually give a shit about music. No startup speak. No hyperbole.

**Balance:**
- Honest over polished
- Direct over diplomatic
- Show don't tell
- Specifics over vague claims

### Voice Examples

**Do Say:**
- "70% to artists. 15% to royalties. 15% keeps us running."
- "$6.99 of your $9.99 goes to the artists you listen to."
- "No pool. No mystery math. You see every cent."
- "Like Bandcamp, but you can stream."
- "No investors. No VC money. Just costs."
- "Listen to one band all month? They get your money. Not Drake."

**Don't Say:**
- "85% to artists" (incorrect - it's 70% artists + 15% royalties)
- "We're disrupting the music industry!" (startup speak)
- "Revolutionary streaming platform" (hyperbole)
- "AI-powered" or "AI-curated" (we use humans)
- "The future of music" (vague)
- "Support creators, fam!" (cringe)

---

## Core Brand Values

1. **70% to artists** - No pool. Split by listening time. Your fans' money goes to you.
2. **No secrets** - Artists see where revenue comes from. Fans see where money goes. Every cent.
3. **Independent only** - No major labels. No algorithm-bait. Artists who own their music.
4. **Human curation** - Real people review releases. No gaming the algorithm.
5. **No exit strategy** - No VC money. No investors to please. Aiming for non-profit/NGO status.

---

## Key Stats (Use in Marketing)

- **70%** - Direct to artists (from your listening)
- **15%** - To royalties (PROs - ASCAP, BMI, GEMA, SUISA)
- **15%** - Platform costs (servers, bandwidth, team)
- **$6.99** - Artist share from your $9.99/month
- **$1.50** - Royalty share
- **$1.50** - Platform share

**NEVER say "85% to artists"** - that's incorrect. The split is 70/15/15.

---

## Positioning

**For vinyl collectors, show-goers, and people who give a shit about music.**

Fairtune is like Bandcamp, but you can stream. 70% goes to the artists you actually listen to. No pool. No mystery. You see every cent.

### vs. Competitors

| Platform | Their Model | Our Difference |
|----------|-------------|----------------|
| **Spotify** | Pool payouts, Drake gets your money | Your money goes to who you listen to |
| **Bandcamp** | Purchase-based, no streaming | Same spirit, but you can stream |
| **Apple Music** | Opaque, pool model | Transparent, per-listener model |
| **Tidal** | Hi-fi focus, pool model | Independent only, you see the math |

---

## Logo Guidelines

### Logo Mark
- **Icon:** Rounded square with gradient (violet → fuchsia), containing "FT" initials
- **Wordmark:** "Fair" in gradient text + "tune" in white
- **Full Logo:** Icon + Wordmark combination

### Color Usage
- **Primary:** Gradient text (violet-400 → fuchsia-400) on dark backgrounds
- **Icon:** Gradient background (violet-500 → fuchsia-500) with white text
- **Monochrome:** White (#FAFAFA) for single-color applications

### Clear Space
- Minimum clear space: Height of the icon on all sides
- Never place logo on busy backgrounds without sufficient contrast

### Don'ts
- Don't use on light backgrounds without adapting colors
- Don't stretch or distort
- Don't use orange/coral colors (legacy - deprecated)
- Don't add effects (shadows, glows, outlines)

---

## Domain & Social

**Primary Domain:** fairtune.fm ✅
**Why .fm:** The .fm TLD is the music industry standard (last.fm, indie.fm). Instantly communicates "this is about music" and is memorable and professional.

**Social Handles:** @fairtune (check: Twitter/X, Instagram, TikTok, Threads)

---

## UI Component Styling

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(to bottom-right, #7C3AED, #8B5CF6);
  color: white;
  border-radius: 8px;
}

/* Primary Button (Nuxt UI) */
<UButton color="violet">Primary Action</UButton>

/* Secondary Button */
<UButton color="gray" variant="ghost">Secondary Action</UButton>

/* Solid Secondary Button */
<UButton color="gray">Tertiary Action</UButton>
```

### Cards
```css
/* Standard Card */
.card {
  background: rgba(24, 24, 27, 0.5);  /* zinc-900/50 */
  border: 1px solid #27272A;          /* zinc-800 */
  border-radius: 16px;
}

/* Card Hover State */
.card:hover {
  border-color: rgba(139, 92, 246, 0.5);  /* violet-500/50 */
}
```

### Feature Icons
```css
/* Icon Container - Gradient backgrounds */
/* Teal for money/earnings */
background: linear-gradient(to bottom-right, #2DD4BF, #10B981);

/* Violet for transparency/visibility */
background: linear-gradient(to bottom-right, #8B5CF6, #7C3AED);

/* Fuchsia/Pink for music/creative */
background: linear-gradient(to bottom-right, #D946EF, #EC4899);
```

---

## Implementation Notes

### Dark Theme
- Dark theme is the **only** theme (no light mode for MVP)
- Background: zinc-950 (#09090B)
- All surfaces use zinc color scale
- Text primarily white/zinc for readability

### Accent Usage
- **Violet (#8B5CF6):** Primary CTAs, active states, primary buttons
- **Fuchsia (#D946EF):** Gradients, hero sections, special highlights
- **Teal (#2DD4BF):** Money/earnings displays, success states, positive feedback
- **Pink (#EC4899):** Secondary highlights, hover accents

### Gradients
- Use gradients for:
  - Hero headlines
  - Logo/branding
  - CTA sections
  - Feature icons
- Keep gradients subtle on interactive elements
- Avoid full-gradient backgrounds on large areas (use overlays instead)

### Animations
- Subtle transitions on hover (150-300ms)
- Pulse animation for live indicators (teal dot)
- No aggressive animations - keep it professional

---

## Nuxt UI Configuration

```typescript
// app.config.ts
export default defineAppConfig({
  ui: {
    primary: 'violet',
    gray: 'zinc',
  },
})
```

---

**Last Updated:** 2026-01-11
**Version:** 2.0 - Electric Purple Theme
