# Fairtune

> Stream Fair. Support Direct.

The streaming platform where your subscription directly supports the artists you listen to.

## 🎵 About

Fairtune is a music streaming platform built on radical transparency and fair artist compensation. Unlike traditional streaming services:

- **Fair Revenue Distribution**: Artists earn based on your actual listening time
- **Total Transparency**: See exactly where your subscription money goes
- **Quality Curation**: Human-moderated releases, no algorithm gaming
- **Direct Support**: Your listening directly supports the artists you love

## 🚀 Tech Stack

- **Frontend**: Nuxt 3 + Nuxt UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Audio Storage**: Cloudflare R2
- **Payments**: Stripe (Subscriptions + Connect)
- **Styling**: Tailwind CSS + Custom Brand Theme

## 🎨 Brand Identity

- **Name**: Fairtune
- **Domain**: [fairtune.art](https://fairtune.art)
- **Theme**: Warm Underground (dark theme with coral/cream accents)
- **Values**: Fair Play, Transparency, Artist-First, Quality, Direct Connection

See [BRAND.md](./BRAND.md) for complete brand guidelines.

## 📦 Setup

### Prerequisites

- Node.js 20.17.0+
- npm 10+
- Supabase account
- Stripe account
- Cloudflare R2 account (for audio storage)

### Installation

1. **Clone and install dependencies**

\`\`\`bash
npm install
\`\`\`

2. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

3. **Set up Supabase**

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on:
- Creating your Supabase project
- Running database migrations
- Configuring Row Level Security
- Setting up Edge Functions

4. **Run development server**

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## 🗂️ Project Structure

\`\`\`
/
├── assets/css/          # Global styles + brand theme
├── components/          # Vue components
│   ├── audio/          # Audio player components
│   ├── band/           # Band-related components
│   ├── album/          # Album components
│   └── subscription/   # Subscription components
├── composables/         # Vue composables
├── layouts/            # App layouts
├── pages/              # Nuxt pages/routes
├── public/             # Static assets
├── server/             # Server-side code
│   └── api/           # API endpoints
├── stores/             # Pinia stores
├── types/              # TypeScript types
├── utils/              # Utility functions
├── supabase/           # Supabase migrations & functions
└── app.config.ts       # App configuration
\`\`\`

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

### Required for Development

\`\`\`env
SUPABASE_URL=
SUPABASE_ANON_KEY=
\`\`\`

### Required for Production

\`\`\`env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudflare R2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ACCOUNT_ID=
\`\`\`

## 📝 Development

### Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run generate     # Generate static site
npm run preview      # Preview production build
npm run lint         # Lint code
npm run typecheck    # TypeScript type checking
\`\`\`

### Development Workflow

1. Create feature branch from \`main\`
2. Make changes and test locally
3. Run linting and type checking
4. Create pull request
5. Deploy to production after review

## 🏗️ Implementation Phases

### ✅ Phase 1: Foundation (Current)
- [x] Project setup
- [x] Brand identity
- [x] Basic layouts and pages
- [ ] Supabase integration
- [ ] Authentication

### 📋 Phase 2: Core Features
- [ ] Band registration and profiles
- [ ] Album upload flow
- [ ] Audio processing pipeline
- [ ] Subscription system

### 📋 Phase 3: Revenue Distribution
- [ ] Listening time tracking
- [ ] Revenue calculation
- [ ] Artist payouts
- [ ] User distribution dashboard

### 📋 Phase 4: Polish & Launch
- [ ] Admin moderation queue
- [ ] Discovery features
- [ ] Performance optimization
- [ ] Production deployment

## 🎯 Business Model

### Subscription Tiers

- **Free**: 30-second previews only
- **Listener** (CHF 13.00/month): Full streaming, lossless FLAC, all features included

### Revenue Split (Streaming)

- **70%** to artists (based on listening time)
- **15%** to PROs (SUISA, GEMA, ASCAP, BMI, etc.)
- **15%** platform fee

## 📄 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the maintainer for collaboration opportunities.

---

Built with ❤️ for independent artists
