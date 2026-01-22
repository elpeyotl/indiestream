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
      <UCard v-else-if="impactData" class="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border-violet-500/20">
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
          <div v-if="impactData.stats.totalEarned !== null" class="text-center p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg">
            <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5 text-emerald-400" />
            </div>
            <p class="text-3xl font-bold text-emerald-400 mb-1">
              {{ formatCurrency(impactData.stats.totalEarned) }}
            </p>
            <p class="text-xs text-zinc-400">Earned by Artists</p>
          </div>

          <div v-if="impactData.stats.artistsSupported !== null" class="text-center p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg">
            <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-violet-400" />
            </div>
            <p class="text-3xl font-bold text-violet-400 mb-1">
              {{ impactData.stats.artistsSupported }}
            </p>
            <p class="text-xs text-zinc-400">Artists Supported</p>
          </div>

          <div v-if="impactData.stats.listeningTime !== null" class="text-center p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
            <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-clock" class="w-5 h-5 text-amber-400" />
            </div>
            <p class="text-3xl font-bold text-amber-400 mb-1">
              {{ formatDuration(impactData.stats.listeningTime) }}
            </p>
            <p class="text-xs text-zinc-400">Listening Time</p>
          </div>

          <div v-if="impactData.stats.streamCount !== null" class="text-center p-4 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 rounded-lg">
            <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-fuchsia-400" />
            </div>
            <p class="text-3xl font-bold text-fuchsia-400 mb-1">
              {{ impactData.stats.streamCount }}
            </p>
            <p class="text-xs text-zinc-400">Streams</p>
          </div>
        </div>

        <!-- Artist Breakdown (if enabled) -->
        <div v-if="impactData.artistBreakdown.length > 0" class="mb-6">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-violet-400" />
            <h3 class="text-lg font-semibold text-zinc-100">Top Artists Supported</h3>
          </div>
          <div class="space-y-3">
            <div
              v-for="(artist, index) in impactData.artistBreakdown"
              :key="artist.bandId"
              class="group flex items-center gap-3 p-3 bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 hover:from-violet-900/20 hover:to-fuchsia-900/20 border border-zinc-800/50 hover:border-violet-500/30 rounded-lg transition-all duration-200">
              <!-- Rank Badge -->
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                {{ index + 1 }}
              </div>

              <!-- Artist Avatar -->
              <img
                v-if="artist.avatarUrl"
                :src="artist.avatarUrl"
                :alt="artist.bandName"
                class="w-12 h-12 rounded-full object-cover border-2 border-zinc-800 group-hover:border-violet-500/50 transition-colors" />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border-2 border-zinc-800 group-hover:border-violet-500/50 transition-colors">
                <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
              </div>

              <!-- Artist Info -->
              <div class="flex-1 min-w-0">
                <p class="text-zinc-100 font-semibold truncate group-hover:text-violet-300 transition-colors">
                  {{ artist.bandName }}
                </p>
                <p class="text-xs text-zinc-500">
                  {{ artist.streamCount }} streams · {{ formatDuration(artist.listeningSeconds) }}
                </p>
              </div>

              <!-- Earnings -->
              <div class="text-right">
                <p class="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {{ formatCurrency(artist.earningsCents) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="pt-6 border-t border-zinc-800 text-center">
          <p class="text-sm text-zinc-400 mb-4">
            Stream music that supports artists directly
          </p>
          <UButton to="/pricing" color="violet" size="lg" block>
            Join Fairtune
          </UButton>
        </div>
      </UCard>

      <!-- Footer -->
      <div class="text-center mt-8">
        <p class="text-sm text-zinc-500">
          Shared via
          <NuxtLink to="/" class="text-violet-400 hover:underline font-medium">
            Fairtune
          </NuxtLink>
           · Stream Fair. Support Direct.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const getToken = () => route.params.token as string

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

// Helper to get presigned URL for avatars
const getStreamUrl = async (key: string): Promise<string> => {
  const encodedKey = btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
  return response.url
}

// Define impact data type
interface ImpactShareData {
  user: { displayName: string }
  periodLabel: string
  stats: {
    totalEarned: number | null
    artistsSupported: number | null
    listeningTime: number | null
    streamCount: number | null
  }
  artistBreakdown: Array<{
    bandId: string
    bandName: string
    avatarKey?: string
    avatarUrl?: string | null
    streamCount: number
    listeningSeconds: number
    earningsCents: number
  }>
}

// Fetch impact data using useLazyAsyncData
const { data: impactData, pending: loading, error: fetchError } = await useLazyAsyncData(
  `impact-share-${route.params.token}`,
  async () => {
    const data = await $fetch<ImpactShareData>(`/api/impact/share/${getToken()}`)

    // Fetch presigned URLs for artist avatars
    if (data.artistBreakdown && data.artistBreakdown.length > 0) {
      await Promise.all(
        data.artistBreakdown.map(async (artist) => {
          if (artist.avatarKey) {
            try {
              artist.avatarUrl = await getStreamUrl(artist.avatarKey)
            } catch (e) {
              console.error(`Failed to load avatar for ${artist.bandName}:`, e)
              artist.avatarUrl = null
            }
          } else {
            artist.avatarUrl = null
          }
        })
      )
    }

    return data
  },
  {
    watch: [() => route.params.token],
  }
)

const error = computed(() => {
  if (fetchError.value) return (fetchError.value as any).statusMessage || 'Failed to load shared impact'
  return null
})

// SEO meta tags for social sharing
useHead({
  title: computed(() =>
    impactData.value
      ? `${impactData.value.user.displayName}'s Fairtune Impact`
      : 'Fairtune Impact Share'
  ),
  meta: [
    { name: 'description', content: 'See how my listening supports artists directly on Fairtune' },
    { property: 'og:title', content: computed(() =>
      impactData.value
        ? `${impactData.value.user.displayName}'s Fairtune Impact`
        : 'Fairtune Impact Share'
    ) },
    { property: 'og:description', content: 'Stream Fair. Support Direct.' },
    { property: 'og:type', content: 'website' },
  ],
})
</script>
