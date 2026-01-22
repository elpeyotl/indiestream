// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vite-pwa/nuxt',
    '@nuxt/image',
  ],

  // Image optimization configuration
  image: {
    // Use IPX for local image optimization
    provider: 'ipx',
    // Quality defaults
    quality: 80,
    // Format preferences (webp first, then original)
    format: ['webp', 'jpeg', 'png'],
    // Screen sizes for responsive images
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
    // Presets for common image types
    presets: {
      albumCover: {
        modifiers: {
          format: 'webp',
          width: 320,
          height: 320,
          fit: 'cover',
        },
      },
      albumCoverLarge: {
        modifiers: {
          format: 'webp',
          width: 640,
          height: 640,
          fit: 'cover',
        },
      },
      avatar: {
        modifiers: {
          format: 'webp',
          width: 96,
          height: 96,
          fit: 'cover',
        },
      },
      avatarLarge: {
        modifiers: {
          format: 'webp',
          width: 192,
          height: 192,
          fit: 'cover',
        },
      },
    },
  },

  // PWA configuration
  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    manifest: {
      name: 'Fairstream',
      short_name: 'Fairstream',
      description: 'Stream Fair. Support Direct.',
      theme_color: '#8b5cf6',
      background_color: '#09090b',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/discover',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60,
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  // Supabase configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/register'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  // Color mode (dark theme default)
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },

  // App configuration
  app: {
    head: {
      title: 'Fairstream - Stream Fair. Support Direct.',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        {
          name: 'description',
          content: 'The streaming platform where your subscription directly supports the artists you listen to.'
        },
        { name: 'theme-color', content: '#8b5cf6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Fairstream' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
        },
      ],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    },
    layoutTransition: {
      name: 'fade',
      mode: 'out-in'
    },
  },

  // TypeScript configuration
  typescript: {
    strict: false,  // Disable strict mode for now
    typeCheck: false,  // Disable type checking for dev speed
  },

  // CSS configuration
  css: ['~/assets/css/transitions.css'],

  // Nitro config for server
  nitro: {
    // Increase body size limit for bulk uploads (2GB)
    routeRules: {
      '/api/bulk-upload/**': {
        // Allow large body for bulk upload endpoints
      },
    },
  },

  // Runtime config
  runtimeConfig: {
    // Private keys (server-side only)
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeConnectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    contactEmail: process.env.CONTACT_EMAIL || 'hello.indiestream@gmail.com',
    transcodingSecret: process.env.TRANSCODING_SECRET,

    // Public keys (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      appUrl: process.env.APP_URL || 'https://fairstream.fm',
      comingSoonMode: process.env.COMING_SOON_MODE === 'true',
    },
  },

  // Vite config for jszip
  vite: {
    optimizeDeps: {
      include: ['jszip'],
    },
    build: {
      rollupOptions: {
        // Ensure jszip is bundled, not externalized
        external: [],
      },
    },
  },

  // Ensure jszip is transpiled
  build: {
    transpile: ['jszip'],
  },
})
