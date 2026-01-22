# Fairtune Brand Guidelines

## Platform Identity

**Name:** Fairtune
**Tagline:** "Stream Fair. Support Direct."
**Mission:** Create a streaming economy where independent artists are paid fairly and fans know exactly where their money goes.

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
Confident, creative, forward-thinking. We're building the future of fair streaming, and we're proud of it.

**Balance:**
- 65% Professional / 35% Casual
- 75% Accessible / 25% Technical
- 55% Serious / 45% Playful
- 75% Bold / 25% Humble

### Voice Examples

**Do Say:**
- "You listened. They earned. See exactly how."
- "85% to artists. 100% transparent. 0 hidden fees."
- "Your favorite artists earned $4.23 from you this month."
- "Stream fair. Support direct."
- "The future of music streaming is transparent."

**Don't Say:**
- "We're disrupting the music industry!" (too startup-speak)
- "Support creators, fam!" (too casual)
- "Our proprietary revenue algorithm..." (too technical)
- "Other platforms are evil" (don't attack, differentiate)

---

## Core Brand Values

1. **Fair Play** - Artists earn proportionally for every listen (85% revenue share)
2. **Radical Transparency** - Show exactly where subscription money goes
3. **Artist-First** - Decisions prioritize independent creator wellbeing
4. **Quality Over Quantity** - Human-curated, not algorithm-gamed
5. **Direct Connection** - Fans choose which artists to support

---

## Key Stats (Use in Marketing)

- **85%** - Revenue share to artists
- **100%** - Transparency (you see where every cent goes)
- **0** - Hidden fees

---

## Positioning

**For indie music fans** who want their subscription to matter,
**Fairtune** is the streaming platform that **shows you exactly how your money supports the artists you love** —
unlike Spotify where payments are hidden and artists earn fractions of pennies.

### vs. Competitors

| Platform | Their Model | Our Advantage |
|----------|-------------|---------------|
| **Spotify** | Opaque pool payouts (~$0.003/stream) | Transparent per-user distribution, 85% to artists |
| **Bandcamp** | Purchase-based, no streaming | Subscription convenience + Bandcamp-level support |
| **SoundCloud** | Complex monetization | Cleaner UX, simpler artist payments |
| **Tidal** | Hi-fi focus, artist ownership | True indie focus, radical pay transparency |

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

/* Secondary/Outline Button */
<UButton color="gray" variant="outline">Secondary Action</UButton>

/* Ghost Button */
<UButton color="gray" variant="ghost">Tertiary Action</UButton>
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
