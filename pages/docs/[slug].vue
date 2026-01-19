<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Back Link -->
    <NuxtLink
      to="/docs"
      class="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 mb-6 transition-colors"
    >
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
      Back to Documentation
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-400" />
      </div>
      <h2 class="text-xl font-semibold text-zinc-100 mb-2">Document Not Found</h2>
      <p class="text-zinc-400 mb-6">The requested documentation page doesn't exist.</p>
      <UButton color="violet" to="/docs">Browse Documentation</UButton>
    </div>

    <!-- Content -->
    <article v-else class="prose prose-invert prose-zinc max-w-none">
      <div v-html="renderedContent" />
    </article>

    <!-- Footer -->
    <div class="mt-12 pt-8 border-t border-zinc-800">
      <NuxtLink
        to="/docs"
        class="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Documentation
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

const loading = ref(true)
const error = ref(false)
const renderedContent = ref('')

// Map slugs to actual filenames
const docFiles: Record<string, string> = {
  'todo': 'TODO.md',
  'artist-payout-system': 'ARTIST_PAYOUT_SYSTEM.md',
  'free-tier-business-logic': 'FREE_TIER_BUSINESS_LOGIC.md',
  'notes': 'NOTES.md',
  'brand': 'BRAND.md',
  'supabase-setup': 'SUPABASE_SETUP.md',
  'deployment-strategy': 'deployment-strategy.md',
  'architecture': 'ARCHITECTURE.md',
  'business-case': 'BUSINESS_CASE.md',
  'domain-migration': 'DOMAIN_MIGRATION.md',
  'native-app-ux': 'NATIVE_APP_UX.md',
  'content-protection-policy': 'content-protection-policy.md',
}

const docTitles: Record<string, string> = {
  'todo': 'TODO & Roadmap',
  'artist-payout-system': 'Artist Payout System',
  'free-tier-business-logic': 'Free Tier Business Logic',
  'notes': 'Development Notes',
  'brand': 'Brand Guidelines',
  'supabase-setup': 'Supabase Setup',
  'deployment-strategy': 'Deployment Strategy',
  'architecture': 'Architecture',
  'business-case': 'Business Case',
  'domain-migration': 'Domain Migration',
  'native-app-ux': 'Native App UX',
  'content-protection-policy': 'Content Protection Policy',
}

const loadDocument = async () => {
  loading.value = true
  error.value = false

  const filename = docFiles[slug.value]
  if (!filename) {
    error.value = true
    loading.value = false
    return
  }

  try {
    const response = await $fetch(`/api/docs/${slug.value}`)
    renderedContent.value = marked(response as string) as string
  } catch (e) {
    console.error('Failed to load document:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

useHead({
  title: computed(() => `${docTitles[slug.value] || 'Documentation'} - Fairstream`),
})

onMounted(loadDocument)
watch(slug, loadDocument)
</script>

<style>
/* Prose styling for markdown content */
.prose {
  color: #a1a1aa;
}

.prose h1 {
  color: #fafafa;
  font-size: 2rem;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #27272a;
  padding-bottom: 0.75rem;
}

.prose h2 {
  color: #fafafa;
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.prose h3 {
  color: #e4e4e7;
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose h4 {
  color: #d4d4d8;
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.prose p {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  line-height: 1.75;
}

.prose a {
  color: #a78bfa;
  text-decoration: none;
}

.prose a:hover {
  color: #c4b5fd;
  text-decoration: underline;
}

.prose strong {
  color: #fafafa;
  font-weight: 600;
}

.prose code {
  color: #c084fc;
  background: #27272a;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.prose pre {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.prose pre code {
  background: transparent;
  padding: 0;
  color: #d4d4d8;
}

.prose ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}

.prose ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.75rem 0;
}

.prose li {
  margin: 0.25rem 0;
}

.prose li::marker {
  color: #71717a;
}

/* Checkbox styling for task lists */
.prose input[type="checkbox"] {
  margin-right: 0.5rem;
  accent-color: #8b5cf6;
}

.prose blockquote {
  border-left: 4px solid #8b5cf6;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #a1a1aa;
  font-style: italic;
}

.prose hr {
  border: none;
  border-top: 1px solid #27272a;
  margin: 2rem 0;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.prose th {
  background: #18181b;
  color: #fafafa;
  font-weight: 600;
  padding: 0.75rem;
  text-align: left;
  border: 1px solid #27272a;
}

.prose td {
  padding: 0.75rem;
  border: 1px solid #27272a;
}

.prose tr:nth-child(even) {
  background: #18181b40;
}

.prose img {
  max-width: 100%;
  border-radius: 0.5rem;
}
</style>
