<template>
  <div class="min-h-screen bg-zinc-950 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-violet-400 mx-auto mb-4" />
        <p class="text-zinc-400">Loading impact...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-20">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-exclamation-circle" class="w-8 h-8 text-red-400" />
        </div>
        <h3 class="text-lg font-semibold text-zinc-100 mb-2">Share Not Found</h3>
        <p class="text-zinc-400 mb-6">{{ error }}</p>
        <UButton to="/" color="violet">
          Go to Home
        </UButton>
      </div>

      <!-- Impact Card -->
      <UCard v-else-if="impactData" class="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
        <!-- User Header -->
        <div class="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
          <UserAvatar
            v-if="impactData.user"
            :user="impactData.user"
            size="md" />
          <div>
            <h1 class="text-xl font-semibold text-zinc-100">
              {{ impactData.user.displayName }}'s Impact
            </h1>
            <p class="text-sm text-zinc-400">{{ impactData.periodLabel }}</p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div v-if="impactData.stats.totalEarned !== null" class="text-center p-4 bg-zinc-900/50 rounded-lg">
            <p class="text-3xl font-bold text-violet-400 mb-1">
              {{ formatCurrency(impactData.stats.totalEarned) }}
            </p>
            <p class="text-xs text-zinc-400">Earned by Artists</p>
          </div>

          <div v-if="impactData.stats.artistsSupported !== null" class="text-center p-4 bg-zinc-900/50 rounded-lg">
            <p class="text-3xl font-bold text-violet-400 mb-1">
              {{ impactData.stats.artistsSupported }}
            </p>
            <p class="text-xs text-zinc-400">Artists Supported</p>
          </div>

          <div v-if="impactData.stats.listeningTime !== null" class="text-center p-4 bg-zinc-900/50 rounded-lg">
            <p class="text-3xl font-bold text-violet-400 mb-1">
              {{ formatDuration(impactData.stats.listeningTime) }}
            </p>
            <p class="text-xs text-zinc-400">Listening Time</p>
          </div>

          <div v-if="impactData.stats.streamCount !== null" class="text-center p-4 bg-zinc-900/50 rounded-lg">
            <p class="text-3xl font-bold text-violet-400 mb-1">
              {{ impactData.stats.streamCount }}
            </p>
            <p class="text-xs text-zinc-400">Streams</p>
          </div>
        </div>

        <!-- Artist Breakdown (if enabled) -->
        <div v-if="impactData.artistBreakdown.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-zinc-100 mb-3">Top Artists Supported</h3>
          <div class="space-y-2">
            <div
              v-for="artist in impactData.artistBreakdown"
              :key="artist.bandId"
              class="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
              <span class="text-zinc-300 font-medium">{{ artist.bandName }}</span>
              <span class="text-violet-400 font-semibold">
                {{ formatCurrency(artist.earningsCents) }}
              </span>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="pt-6 border-t border-zinc-800 text-center">
          <p class="text-sm text-zinc-400 mb-4">
            Stream music that supports artists directly
          </p>
          <UButton to="/pricing" color="violet" size="lg" block>
            Join Indiestream
          </UButton>
        </div>
      </UCard>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-sm text-zinc-500">
          Shared via
          <NuxtLink to="/" class="text-violet-400 hover:underline font-medium">
            Indiestream
          </NuxtLink>
           · Stream Fair. Support Direct.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const token = route.params.token as string

const loading = ref(true)
const error = ref<string | null>(null)
const impactData = ref<any>(null)

// Helper functions from useMoneyDistribution
const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

onMounted(async () => {
  try {
    const data = await $fetch(`/api/impact/share/${token}`)
    impactData.value = data
  } catch (e: any) {
    console.error('Failed to load shared impact:', e)
    error.value = e.statusMessage || 'Failed to load shared impact'
  } finally {
    loading.value = false
  }
})

// SEO meta tags for social sharing
useHead({
  title: computed(() =>
    impactData.value
      ? `${impactData.value.user.displayName}'s Indiestream Impact`
      : 'Indiestream Impact Share'
  ),
  meta: [
    { name: 'description', content: 'See how my listening supports artists directly on Indiestream' },
    { property: 'og:title', content: computed(() =>
      impactData.value
        ? `${impactData.value.user.displayName}'s Indiestream Impact`
        : 'Indiestream Impact Share'
    ) },
    { property: 'og:description', content: 'Stream Fair. Support Direct.' },
    { property: 'og:type', content: 'website' },
  ],
})
</script>
