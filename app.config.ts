export default defineAppConfig({
  // Nuxt UI Configuration
  ui: {
    primary: 'violet',
    gray: 'zinc',
  },

  // Brand Identity
  brand: {
    name: 'Fairstream',
    tagline: 'Stream Fair. Support Direct.',
    domain: 'fairstream.fm',
    url: 'https://fairstream.fm',
  },

  // Color System - Electric Purple Theme
  colors: {
    // Background colors
    bg: {
      primary: '#09090B',   // Deep black with slight blue
      surface: '#18181B',   // Card backgrounds
      elevated: '#27272A',  // Hover states
    },

    // Accent colors
    accent: {
      primary: '#8B5CF6',   // Violet - Primary CTAs
      secondary: '#A78BFA', // Light violet - Hover states
      teal: '#2DD4BF',      // Teal - Artist earnings, success
      pink: '#EC4899',      // Pink - Special highlights
      blue: '#3B82F6',      // Blue - Interactive elements
    },

    // Text colors
    text: {
      primary: '#FAFAFA',   // Headlines
      secondary: '#A1A1AA', // Body text
      muted: '#71717A',     // Captions
    },

    // Semantic colors
    semantic: {
      success: '#2DD4BF',   // Teal
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
  },

  // Layout
  layout: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    spacing: {
      xs: '0.25rem',  // 4px
      sm: '0.5rem',   // 8px
      md: '1rem',     // 16px
      lg: '1.5rem',   // 24px
      xl: '2rem',     // 32px
      '2xl': '3rem',  // 48px
    },
  },

  // Platform Configuration
  platform: {
    // Revenue distribution
    platformFeePercentage: 15, // 15% platform fee
    artistSharePercentage: 85, // 85% to artists
    minimumPayoutCents: 1000,  // $10 minimum payout threshold

    // Subscription tiers (prices in cents)
    subscriptionTiers: {
      free: {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        features: {
          snippetOnly: true,
          snippetDuration: 30, // seconds
        },
      },
      standard: {
        name: 'Standard',
        priceMonthly: 999,   // $9.99
        priceYearly: 9990,   // $99.90
        features: {
          fullStreaming: true,
          downloads: true,
          downloadQuality: 'mp3_320',
        },
      },
      premium: {
        name: 'Premium',
        priceMonthly: 1499,  // $14.99
        priceYearly: 14990,  // $149.90
        features: {
          fullStreaming: true,
          downloads: true,
          downloadQuality: 'flac',
          offlineMode: true,
        },
      },
    },

    // Audio configuration
    audio: {
      snippetDuration: 30, // seconds
      formats: {
        stream: 'aac_256',
        downloadMp3: 'mp3_320',
        downloadFlac: 'flac',
      },
    },

    // Moderation
    moderation: {
      autoApprove: false, // Require admin approval
      priorityLevels: ['low', 'normal', 'high', 'urgent'],
    },
  },
})
