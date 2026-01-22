<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Documentation</h1>
      <p class="text-zinc-400">
        Internal documentation for Fairtune development. This page is not linked publicly.
      </p>
    </div>

    <!-- Docs Grid -->
    <div class="grid gap-4">
      <NuxtLink
        v-for="doc in docs"
        :key="doc.slug"
        :to="`/docs/${doc.slug}`"
        class="block p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors"
      >
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" :class="doc.iconBg">
            <UIcon :name="doc.icon" class="w-5 h-5" :class="doc.iconColor" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-zinc-100 mb-1">{{ doc.title }}</h2>
            <p class="text-zinc-400 text-sm">{{ doc.description }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Footer -->
    <div class="mt-12 pt-8 border-t border-zinc-800">
      <p class="text-zinc-500 text-sm">
        These docs are for internal use and development planning.
        <NuxtLink to="/" class="text-violet-400 hover:text-violet-300">Return to Fairtune</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const docs = [
  {
    slug: 'todo',
    title: 'TODO & Roadmap',
    description: 'Feature checklist, completed items, and pending features organized by priority.',
    icon: 'i-heroicons-clipboard-document-list',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    slug: 'artist-payout-system',
    title: 'Artist Payout System',
    description: 'Comprehensive plan for Stripe Connect, royalty obligations, PRO licensing, and revenue distribution.',
    icon: 'i-heroicons-banknotes',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
  },
  {
    slug: 'free-tier-business-logic',
    title: 'Free Tier Business Logic',
    description: 'How the free tier works: 5 plays/month, tracking, exclusions from stats, and upgrade flows.',
    icon: 'i-heroicons-gift',
    iconBg: 'bg-fuchsia-500/20',
    iconColor: 'text-fuchsia-400',
  },
  {
    slug: 'notes',
    title: 'Development Notes',
    description: 'Technical architecture, database schema, composables, cost calculations, and licensing considerations.',
    icon: 'i-heroicons-code-bracket',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    slug: 'brand',
    title: 'Brand Guidelines',
    description: 'Visual identity, color palette, typography, voice & tone, and UI component styling.',
    icon: 'i-heroicons-paint-brush',
    iconBg: 'bg-pink-500/20',
    iconColor: 'text-pink-400',
  },
  {
    slug: 'supabase-setup',
    title: 'Supabase Setup',
    description: 'Database configuration, RLS policies, and migration instructions.',
    icon: 'i-heroicons-server',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    slug: 'deployment-strategy',
    title: 'Deployment Strategy',
    description: 'Go-live plan: environments, infrastructure, invite-only beta, and checklist.',
    icon: 'i-heroicons-rocket-launch',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
  },
  {
    slug: 'architecture',
    title: 'Architecture',
    description: 'System architecture, tech stack, folder structure, and component patterns.',
    icon: 'i-heroicons-cube-transparent',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    slug: 'business-case',
    title: 'Business Case',
    description: 'Market analysis, revenue model, competitive positioning, and growth strategy.',
    icon: 'i-heroicons-presentation-chart-line',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    slug: 'domain-migration',
    title: 'Domain Migration',
    description: 'Steps for migrating to a new domain, DNS setup, and SSL configuration.',
    icon: 'i-heroicons-globe-alt',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
  },
  {
    slug: 'native-app-ux',
    title: 'Native App UX',
    description: 'Mobile-first design patterns, PWA features, gestures, and haptic feedback.',
    icon: 'i-heroicons-device-phone-mobile',
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
  },
  {
    slug: 'content-protection-policy',
    title: 'Content Protection Policy',
    description: 'DMCA compliance, copyright policies, takedown procedures, and content guidelines.',
    icon: 'i-heroicons-shield-check',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
  },
]

useHead({
  title: 'Documentation - Fairtune',
})
</script>
