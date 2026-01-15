# Native App UX Strategy

## Overview

Transform Indiestream from a traditional web app into a native-feeling mobile-first experience that removes clutter and feels like an installed app, even on desktop.

## Philosophy

- **Mobile-First**: Design for mobile, enhance for desktop
- **No Clutter**: Remove all marketing content for logged-in users
- **Native Feel**: Gestures, animations, and patterns that feel like a native app
- **Focused Experience**: 100% music discovery and playback, zero distractions

---

## Implementation Phases

### Phase 1: Quick Wins (Priority)

**Goal**: Remove clutter and redirect logged-in users away from marketing

#### 1.1 Smart Landing Page Redirect (15 min)
- Redirect authenticated users from `/` to `/discover` immediately
- Only show marketing content to logged-out users
- No unnecessary page loads for returning users

**Files to modify**:
- `pages/index.vue` - Add redirect logic

**Implementation**:
```vue
<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

onMounted(() => {
  if (user.value) {
    router.replace('/discover')
  }
})
</script>

<template>
  <!-- Only render marketing for logged-out users -->
  <div v-if="!user">
    <!-- Existing landing page content -->
  </div>
</template>
```

#### 1.2 Mobile Bottom Navigation (1-2 hours)
- Add persistent bottom navigation bar (mobile only)
- 5 core actions with icons (no labels for space)
- Sticky positioning with backdrop blur
- Hide on scroll down, show on scroll up
- Active state highlighting

**Navigation Items**:
1. **Discover** (home icon) - `/discover`
2. **Search** (search icon) - Opens search modal/page
3. **Library** (library icon) - `/library`
4. **Profile** (user icon) - `/user/[id]` (own profile)
5. **Now Playing** (music note icon) - Opens player (only visible when playing)

**Files to create**:
- `components/MobileBottomNav.vue` - Bottom navigation component

**Files to modify**:
- `layouts/default.vue` - Add bottom nav component
- `app.vue` - Add global styles for bottom nav spacing

**Design Specs**:
```
┌─────────────────────────────────────┐
│                                     │
│         Content Area                │
│         (scrollable)                │
│                                     │
│                                     │
├─────────────────────────────────────┤
│       Mini Player (if playing)      │ ← Sticky above nav
├─────────────────────────────────────┤
│  [🏠]  [🔍]  [📚]  [👤]  [🎵]     │ ← Bottom Nav
└─────────────────────────────────────┘
   ↑      ↑      ↑      ↑      ↑
  Home  Search Library Profile Playing
```

**CSS Requirements**:
- Height: 64px (16px padding + 32px icons + 16px padding)
- Backdrop blur: `backdrop-filter: blur(10px)`
- Background: `bg-zinc-950/80`
- Border top: `border-t border-zinc-800`
- z-index: 40 (below modals, above content)
- Only visible on screens < 768px (md breakpoint)
- Safe area insets for iPhone notch: `padding-bottom: env(safe-area-inset-bottom)`

#### 1.3 Clean Up Navigation for Logged-In Users (30 min)
- Hide marketing nav items when authenticated
- Simplify top nav to: Logo, Search, Profile Avatar
- Remove "Sign In", "Sign Up", "Pricing", "For Artists" links
- Keep only functional navigation

**Files to modify**:
- `layouts/default.vue` - Conditional nav rendering

**Desktop Nav (Logged In)**:
```
┌─────────────────────────────────────┐
│ [Logo]              [🔍]  [Avatar] │
└─────────────────────────────────────┘
```

**Desktop Nav (Logged Out)**:
```
┌───────────────────────────────────────────────────┐
│ [Logo]  Pricing  About  For Artists  [Sign In]  │
└───────────────────────────────────────────────────┘
```

#### 1.4 PWA Manifest & Meta Tags (30 min)
- Make app installable on mobile devices
- Add proper icons and splash screens
- Configure viewport for no-zoom
- Hide browser chrome when "installed"

**Files to create**:
- `public/manifest.json` - PWA manifest
- `public/icons/` - App icons (multiple sizes)

**Files to modify**:
- `nuxt.config.ts` - Add PWA meta tags and manifest link

**Manifest Structure**:
```json
{
  "name": "Indiestream",
  "short_name": "Indiestream",
  "description": "Stream Fair. Support Direct.",
  "start_url": "/discover",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#8b5cf6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Meta Tags (nuxt.config.ts)**:
```typescript
app: {
  head: {
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    meta: [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'Indiestream' },
      { name: 'theme-color', content: '#8b5cf6' }
    ],
    link: [
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'apple-touch-icon', href: '/icons/icon-192.png' }
    ]
  }
}
```

---

### Phase 2: Native Feel Enhancements (Next Sprint)

**Goal**: Add native app interactions and polish

#### 2.1 Pull-to-Refresh (2-3 hours)
- Add pull-to-refresh on:
  - `/discover` - Refresh featured artists and new releases
  - `/library` - Refresh library data
  - `/[artist]/index` - Refresh artist profile
- Visual feedback with loading spinner
- Haptic feedback on trigger (if supported)

**Library**: Consider using `@vueuse/gesture` or custom implementation

**Implementation Pattern**:
```typescript
const { lengthY, isSwiping } = useSwipe(target, {
  onSwipeEnd(e, direction) {
    if (direction === 'down' && lengthY > 100) {
      refreshData()
    }
  }
})
```

#### 2.2 Swipe Gestures (3-4 hours)
- **Swipe left/right on track rows**: Quick actions (like, add to playlist, remove)
- **Swipe left on playlist items**: Delete track from playlist
- **Long-press on tracks**: Open context menu
- **Swipe down on player**: Minimize player to mini view

**Priority gestures**:
1. Swipe on library tracks (like/unlike)
2. Long-press for context menu
3. Player swipe-to-minimize

#### 2.3 Smooth Transitions (1-2 hours)
- Page transitions with slide animations
- Modal slide-up animations (iOS-style)
- Smooth scroll behavior
- Skeleton loading states (no flash of empty content)

**CSS Variables**:
```css
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 2.4 Haptic Feedback (30 min)
- Vibration on key actions (like, follow, add to playlist)
- Subtle feedback for native feel
- Use Vibration API where supported

**Implementation**:
```typescript
// composables/useHaptics.ts
export const useHaptics = () => {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(30),
    success: () => vibrate([10, 50, 10])
  }
}
```

---

### Phase 3: Scale & Optimization (Future)

**Goal**: Separate marketing from app, optimize for scale

#### 3.1 Subdomain Architecture
- Marketing site: `indiestream.art` (static, SEO-optimized)
- Main app: `app.indiestream.art` (dynamic, app-focused)
- Separate deployments and optimization strategies

**Benefits**:
- Clean separation of concerns
- Marketing can be fully static (faster, cheaper)
- App can be optimized for logged-in experience
- Professional appearance
- Independent scaling

**Migration Strategy**:
1. Set up `app.indiestream.art` subdomain
2. Deploy app to subdomain (same codebase, different build)
3. Update authentication to work cross-domain (shared cookies)
4. Redirect authenticated users to app subdomain
5. Keep marketing on root domain
6. Monitor traffic and adjust DNS

**Cookie Configuration**:
```typescript
// For cross-domain auth
{
  domain: '.indiestream.art', // Note the leading dot
  secure: true,
  sameSite: 'lax'
}
```

#### 3.2 Advanced PWA Features
- Offline mode with service worker
- Background sync for queue and playback state
- Push notifications for new releases from followed artists
- App shortcuts (Android)

#### 3.3 Performance Optimization
- Route-based code splitting
- Lazy load images with blur-up placeholders
- Virtualized lists for large collections
- Optimize bundle size (tree-shaking, dynamic imports)

---

## Design System Updates

### Layout Pattern (All Pages)

```
Mobile (< 768px):
┌─────────────────────┐
│  Top Bar (minimal)  │ ← Page title + actions only
├─────────────────────┤
│                     │
│   Content Area      │ ← Full width, no sidebars
│   (scrollable)      │
│                     │
├─────────────────────┤
│   Mini Player       │ ← Sticky (if playing)
├─────────────────────┤
│   Bottom Nav        │ ← Sticky
└─────────────────────┘

Desktop (≥ 768px):
┌─────────────────────────────┐
│  Top Nav (clean)            │ ← Logo + Search + Avatar
├─────────────────────────────┤
│                             │
│   Content Area (max-width)  │ ← Centered, padded
│                             │
│                             │
├─────────────────────────────┤
│   Mini Player (full-width)  │ ← Sticky at bottom
└─────────────────────────────┘
```

### Typography Scale
- **Hero**: 2.5rem (40px) - Page titles on desktop
- **Title**: 1.875rem (30px) - Section headings
- **Heading**: 1.5rem (24px) - Card titles
- **Body**: 1rem (16px) - Default text
- **Small**: 0.875rem (14px) - Metadata
- **Tiny**: 0.75rem (12px) - Captions

### Spacing Scale
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **base**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Color Palette (Existing)
- **Background**: zinc-950 (#09090b)
- **Surface**: zinc-900 (#18181b)
- **Border**: zinc-800 (#27272a)
- **Text Primary**: zinc-100 (#f4f4f5)
- **Text Secondary**: zinc-400 (#a1a1aa)
- **Text Muted**: zinc-500 (#71717a)
- **Accent**: violet-500 (#8b5cf6)
- **Success**: green-500 (#22c55e)
- **Error**: red-500 (#ef4444)

---

## Content Strategy for Logged-In Users

### Hide Marketing Elements
- ❌ Pricing CTAs
- ❌ "Sign Up" buttons
- ❌ "For Artists" promotions
- ❌ Feature comparison tables
- ❌ Testimonials
- ❌ Marketing hero sections

### Focus on Core App
- ✅ Music discovery
- ✅ Playback controls
- ✅ Library management
- ✅ Artist profiles
- ✅ Playlist creation
- ✅ Search and browse
- ✅ User profile
- ✅ Settings

---

## Success Metrics

### Phase 1 (Quick Wins)
- [ ] Authenticated users never see landing page (100% redirect)
- [ ] Mobile bottom nav implemented and tested
- [ ] Desktop nav simplified (3 items max when logged in)
- [ ] PWA installable on iOS and Android
- [ ] Manifest and icons added

### Phase 2 (Native Feel)
- [ ] Pull-to-refresh working on 3+ pages
- [ ] Swipe gestures on track rows
- [ ] Page transitions smooth (no jank)
- [ ] Haptic feedback on key actions
- [ ] Skeleton loading states replace spinners

### Phase 3 (Scale)
- [ ] App deployed to `app.indiestream.art`
- [ ] Marketing site remains on root domain
- [ ] Cross-domain auth working
- [ ] Service worker for offline mode
- [ ] Push notifications enabled

---

## Technical Considerations

### Mobile Viewport
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
```

**Breakdown**:
- `width=device-width` - Match screen width
- `initial-scale=1` - No zoom on load
- `maximum-scale=1` - Disable pinch zoom
- `user-scalable=no` - Disable zoom gestures
- `viewport-fit=cover` - Extend to safe areas (notch)

### Safe Area Insets (iPhone X+)
```css
.bottom-nav {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.player {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Scroll Behavior
- Disable overscroll bounce on body
- Enable smooth scrolling
- Use `overflow-y: auto` instead of `scroll` (hides scrollbar on macOS)

```css
html {
  scroll-behavior: smooth;
  overscroll-behavior: none;
}

body {
  overflow-x: hidden;
}
```

### Touch Target Sizes
- Minimum: 44x44px (iOS guideline)
- Recommended: 48x48px (Material Design)
- Spacing between targets: 8px minimum

### Performance Budget
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Lighthouse Score: > 90 (mobile)

---

## Future Enhancements (Backlog)

### Advanced Gestures
- Pinch to zoom on album artwork
- 3D Touch / Force Touch for quick actions
- Swipe between tabs (like Instagram)

### Native-Like Features
- iOS: Live Activities for now playing
- Android: Media notification with controls
- macOS: Touch Bar controls
- Picture-in-Picture for player

### Personalization
- Customizable bottom nav order
- Theme switching (dark/light/auto)
- Font size preferences
- Haptic intensity control

---

## References

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://m3.material.io/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Apple Web Apps Documentation](https://developer.apple.com/documentation/webkit/safari_web_extensions)

---

## Timeline Estimate

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1.1 (Landing Redirect) | 15 min | 🔴 Critical |
| Phase 1.2 (Bottom Nav) | 2 hours | 🔴 Critical |
| Phase 1.3 (Clean Nav) | 30 min | 🔴 Critical |
| Phase 1.4 (PWA Setup) | 30 min | 🔴 Critical |
| **Phase 1 Total** | **~3 hours** | |
| Phase 2.1 (Pull-to-Refresh) | 3 hours | 🟡 High |
| Phase 2.2 (Gestures) | 4 hours | 🟡 High |
| Phase 2.3 (Transitions) | 2 hours | 🟡 High |
| Phase 2.4 (Haptics) | 30 min | 🟡 High |
| **Phase 2 Total** | **~10 hours** | |
| Phase 3 (Subdomain) | TBD | 🟢 Future |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-14 | Start with conditional landing page instead of subdomain split | Faster to implement, simpler infrastructure, can migrate later if needed |
| 2026-01-14 | Prioritize mobile bottom nav over desktop improvements | Mobile-first strategy, most users on mobile |
| 2026-01-14 | Use native browser features over libraries where possible | Smaller bundle size, better performance |
| 2026-01-14 | Make app installable as PWA before building native apps | Test market fit, easier to update, cross-platform |

---

Last Updated: 2026-01-14
