<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100">
        Welcome back, {{ displayName }}
      </h1>
      <p class="text-zinc-400 mt-1">Here's what's happening with your music</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <NuxtLink to="/dashboard/listening" class="block">
        <UCard class="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Hours Listened</p>
              <p class="text-2xl font-bold text-zinc-100">{{ formatHours(listeningStats.totalSeconds) }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/dashboard/listening" class="block">
        <UCard class="bg-zinc-900/50 border-zinc-800 hover:border-teal-500/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-play" class="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Total Streams</p>
              <p class="text-2xl font-bold text-zinc-100">{{ listeningStats.totalStreams }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/dashboard/listening" class="block">
        <UCard class="bg-zinc-900/50 border-zinc-800 hover:border-fuchsia-500/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-heart" class="w-6 h-6 text-fuchsia-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Artists Supported</p>
              <p class="text-2xl font-bold text-zinc-100">{{ listeningStats.uniqueArtists }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <!-- Free tier upgrade prompt for empty stats -->
    <div v-if="!isSubscribed && listeningStats.totalStreams === 0" class="mb-8">
      <UCard class="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/30">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
            <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-violet-400" />
          </div>
          <div class="flex-1">
            <p class="text-zinc-100 font-medium">Track your listening journey</p>
            <p class="text-zinc-400 text-sm">Subscribe to see your stats, support artists directly, and unlock unlimited streaming.</p>
          </div>
          <UButton color="violet" to="/pricing">
            Upgrade
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Artist Section -->
    <UCard class="bg-zinc-900/50 border-zinc-800 mb-8">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-zinc-100">Your Artist Profiles</h2>
          <UButton
            v-if="bands.length > 0"
            color="violet"
            variant="soft"
            size="sm"
            to="/dashboard/artist/new"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            New Artist
          </UButton>
        </div>
      </template>

      <!-- Loading -->
      <div v-if="bandsLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
      </div>

      <!-- No Bands -->
      <div v-else-if="bands.length === 0" class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
          <UIcon name="i-heroicons-microphone" class="w-8 h-8 text-violet-400" />
        </div>
        <h3 class="text-lg font-semibold text-zinc-100 mb-2">Start Your Music Journey</h3>
        <p class="text-zinc-400 mb-6 max-w-md mx-auto">
          Create an artist profile to upload your music and start earning from streams.
        </p>
        <UButton color="violet" to="/dashboard/artist/new">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          Create Artist Profile
        </UButton>
      </div>

      <!-- Band List -->
      <div v-else class="space-y-4">
        <NuxtLink
          v-for="band in bands"
          :key="band.id"
          :to="`/dashboard/artist/${band.id}`"
          class="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <!-- Avatar -->
          <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center overflow-hidden shrink-0">
            <img
              v-if="band.avatar_url"
              :src="band.avatar_url"
              :alt="band.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xl font-bold text-white">
              {{ band.name.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-zinc-100 truncate">{{ band.name }}</h3>
              <UIcon
                v-if="band.is_verified"
                name="i-heroicons-check-badge"
                class="w-5 h-5 text-violet-400 shrink-0"
              />
            </div>
            <p class="text-sm text-zinc-400 truncate">
              indiestream.art/{{ band.slug }}
            </p>
          </div>

          <!-- Stats -->
          <div class="hidden sm:flex items-center gap-6 text-sm">
            <div class="text-center">
              <p class="text-zinc-100 font-semibold">{{ formatNumber(band.total_streams) }}</p>
              <p class="text-zinc-500">Streams</p>
            </div>
            <div class="text-center">
              <p class="text-zinc-100 font-semibold">${{ (band.total_earnings_cents / 100).toFixed(2) }}</p>
              <p class="text-zinc-500">Earnings</p>
            </div>
          </div>

          <!-- Arrow -->
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-500" />
        </NuxtLink>
      </div>
    </UCard>

    <!-- Subscription Status -->
    <UCard class="bg-zinc-900/50 border-zinc-800 mb-8">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-zinc-100">Your Subscription</h2>
          <UBadge
            :color="isSubscribed ? 'green' : 'gray'"
            variant="soft"
          >
            {{ subscriptionBadge }}
          </UBadge>
        </div>
      </template>

      <!-- Subscribed State -->
      <div v-if="isSubscribed" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-100 font-medium">Listener Plan</p>
            <p v-if="subscription?.current_period_end" class="text-zinc-400 text-sm">
              {{ subscriptionDateLabel }}
              {{ formatDate(subscription?.current_period_end) }}
            </p>
          </div>
          <UButton
            color="gray"
            variant="outline"
            :loading="subscriptionLoading"
            @click="openCustomerPortal"
          >
            Manage Subscription
          </UButton>
        </div>
        <div v-if="subscription?.cancel_at_period_end" class="flex items-center gap-2 text-amber-400 text-sm">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
          Your subscription will end on {{ formatDate(subscription?.current_period_end) }}
        </div>
      </div>

      <!-- Free State -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-zinc-100 font-medium">Free Tier</p>
            <p class="text-zinc-400 text-sm">
              {{ freeTierStatus?.playsRemaining ?? 5 }} free full-track plays remaining this month
            </p>
          </div>
          <UButton color="violet" to="/pricing">
            Upgrade
          </UButton>
        </div>
        <!-- Free plays progress bar -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-zinc-500">
            <span>{{ freeTierStatus?.playsUsed ?? 0 }} of 5 plays used</span>
            <span v-if="freeTierStatus?.resetsAt">
              Resets {{ formatDate(freeTierStatus.resetsAt) }}
            </span>
          </div>
          <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              class="h-full bg-violet-500 rounded-full transition-all duration-300"
              :style="{ width: `${((freeTierStatus?.playsUsed ?? 0) / 5) * 100}%` }"
            />
          </div>
        </div>
        <p class="text-zinc-500 text-xs">
          Upgrade to listen to unlimited full tracks and support artists directly with your subscription.
        </p>
      </div>
    </UCard>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Discover Music</h2>
        </template>
        <p class="text-zinc-400 mb-4">
          Find new artists and albums to add to your collection.
        </p>
        <UButton color="violet" variant="outline" to="/discover">
          Browse Artists
        </UButton>
      </UCard>

      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Your Favorites</h2>
        </template>
        <p class="text-zinc-400 mb-4">
          View and manage your saved tracks and albums.
        </p>
        <UButton color="violet" variant="outline" to="/dashboard/favorites">
          View Favorites
        </UButton>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'

definePageMeta({
  middleware: 'auth',
})

const user = useSupabaseUser()
const client = useSupabaseClient()
const { getUserBands } = useBand()
const { getStreamUrl } = useAlbum()
const { subscription, isSubscribed, freeTierStatus, loading: subscriptionLoading, openCustomerPortal } = useSubscription()

const bands = ref<Band[]>([])
const bandsLoading = ref(true)

const listeningStats = ref({
  totalSeconds: 0,
  totalStreams: 0,
  uniqueArtists: 0,
})

const subscriptionBadge = computed(() => {
  if (!subscription.value) return 'Free'
  switch (subscription.value.status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past Due'
    case 'canceled':
      return 'Canceled'
    default:
      return 'Free'
  }
})

const subscriptionDateLabel = computed(() => {
  if (!subscription.value) return ''
  if (subscription.value.cancel_at_period_end) return 'Cancels on'
  if (subscription.value.status === 'trialing') return 'Trial ends on'
  return 'Renews on'
})

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const displayName = computed(() => {
  if (!user.value) return 'there'
  return user.value.user_metadata?.display_name || user.value.email?.split('@')[0] || 'there'
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatHours = (seconds: number): string => {
  const hours = seconds / 3600
  if (hours < 1) {
    const mins = Math.floor(seconds / 60)
    return mins > 0 ? `${mins}m` : '0'
  }
  return hours.toFixed(1)
}

const loadListeningStats = async () => {
  try {
    // Only get user's own streams (not band owner views) and exclude free plays
    const { data, error } = await client
      .from('listening_history')
      .select('duration_seconds, completed, band_id, is_free_play')
      .eq('user_id', user.value?.id)
      .eq('is_free_play', false)

    if (error) throw error

    if (data) {
      listeningStats.value.totalSeconds = data.reduce((sum, item) => sum + (item.duration_seconds || 0), 0)
      listeningStats.value.totalStreams = data.filter(item => item.completed).length
      listeningStats.value.uniqueArtists = new Set(data.map(item => item.band_id)).size
    }
  } catch (e) {
    console.error('Failed to load listening stats:', e)
  }
}

onMounted(async () => {
  try {
    bands.value = await getUserBands()

    // Load fresh avatar URLs from keys
    for (const band of bands.value) {
      if (band.avatar_key) {
        try {
          band.avatar_url = await getStreamUrl(band.avatar_key)
        } catch (e) {
          console.error('Failed to load avatar for band:', band.id, e)
        }
      }
    }
  } catch (e) {
    console.error('Failed to load bands:', e)
  } finally {
    bandsLoading.value = false
  }

  // Load listening stats
  loadListeningStats()
})
</script>
