<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100">
        Welcome back, {{ displayName }}
      </h1>
      <p class="text-zinc-400 mt-1">Here's what's happening with your music</p>
    </div>

    <!-- My Impact Hero Card -->
    <ClientOnly>
      <template #fallback>
        <UCard
          class="mb-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20"
        >
          <div class="flex items-center justify-between mb-4">
            <USkeleton class="h-7 w-32" />
            <USkeleton class="h-6 w-6 rounded" />
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <USkeleton class="h-8 w-20 mb-1" />
              <USkeleton class="h-4 w-28" />
            </div>
            <div>
              <USkeleton class="h-8 w-12 mb-1" />
              <USkeleton class="h-4 w-28" />
            </div>
            <div class="col-span-2 md:col-span-1">
              <USkeleton class="h-8 w-16 mb-1" />
              <USkeleton class="h-4 w-20" />
            </div>
          </div>
          <USkeleton class="h-10 w-full rounded-md" />
        </UCard>
      </template>

      <!-- My Impact Hero Card Skeleton -->
      <UCard
        v-if="isSubscribed && impactLoading"
        class="mb-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20"
      >
        <div class="flex items-center justify-between mb-4">
          <USkeleton class="h-7 w-32" />
          <USkeleton class="h-6 w-6 rounded" />
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <USkeleton class="h-8 w-20 mb-1" />
            <USkeleton class="h-4 w-28" />
          </div>
          <div>
            <USkeleton class="h-8 w-12 mb-1" />
            <USkeleton class="h-4 w-28" />
          </div>
          <div class="col-span-2 md:col-span-1">
            <USkeleton class="h-8 w-16 mb-1" />
            <USkeleton class="h-4 w-20" />
          </div>
        </div>
        <USkeleton class="h-10 w-full rounded-md" />
      </UCard>

      <!-- My Impact Hero Card (Subscribers Only) -->
      <UCard
        v-else-if="isSubscribed"
        class="mb-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20"
      >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Your Impact</h2>
        <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-violet-400" />
      </div>

      <!-- Key stats grid -->
      <div v-if="impactStats" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p class="text-2xl font-bold text-violet-400">
            {{ formatCurrency(impactStats.totalEarned) }}
          </p>
          <p class="text-sm text-zinc-400">Earned by Artists</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-violet-400">{{ impactStats.artistsSupported }}</p>
          <p class="text-sm text-zinc-400">Artists Supported</p>
        </div>
        <div class="col-span-2 md:col-span-1">
          <p class="text-2xl font-bold text-violet-400">
            {{ formatCurrency(impactStats.thisMonth) }}
          </p>
          <p class="text-sm text-zinc-400">This Month</p>
        </div>
      </div>

      <!-- Empty state for new subscribers -->
      <div v-else class="text-center py-4">
        <UIcon name="i-heroicons-musical-note" class="w-12 h-12 mx-auto mb-2 text-zinc-600" />
        <p class="text-zinc-400 text-sm">Start listening to see your impact!</p>
      </div>

      <UButton to="/dashboard/stats" color="violet" block>
        View Your Stats
      </UButton>
      </UCard>
    </ClientOnly>

    <!-- Stats Grid -->
    <ClientOnly>
      <template #fallback>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-4">
              <USkeleton class="w-12 h-12 rounded-xl" />
              <div>
                <USkeleton class="h-4 w-24 mb-2" />
                <USkeleton class="h-8 w-16" />
              </div>
            </div>
          </UCard>
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-4">
              <USkeleton class="w-12 h-12 rounded-xl" />
              <div>
                <USkeleton class="h-4 w-24 mb-2" />
                <USkeleton class="h-8 w-16" />
              </div>
            </div>
          </UCard>
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-4">
              <USkeleton class="w-12 h-12 rounded-xl" />
              <div>
                <USkeleton class="h-4 w-24 mb-2" />
                <USkeleton class="h-8 w-16" />
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <div v-if="statsPending" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-center gap-4">
            <USkeleton class="w-12 h-12 rounded-xl" />
            <div>
              <USkeleton class="h-4 w-24 mb-2" />
              <USkeleton class="h-8 w-16" />
            </div>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-center gap-4">
            <USkeleton class="w-12 h-12 rounded-xl" />
            <div>
              <USkeleton class="h-4 w-24 mb-2" />
              <USkeleton class="h-8 w-16" />
            </div>
          </div>
        </UCard>
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-center gap-4">
            <USkeleton class="w-12 h-12 rounded-xl" />
            <div>
              <USkeleton class="h-4 w-24 mb-2" />
              <USkeleton class="h-8 w-16" />
            </div>
          </div>
        </UCard>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <NuxtLink to="/dashboard/stats" class="block">
        <UCard class="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Hours Listened</p>
              <p class="text-2xl font-bold text-zinc-100">{{ formatHours(listeningStats?.totalSeconds ?? 0) }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/dashboard/stats" class="block">
        <UCard class="bg-zinc-900/50 border-zinc-800 hover:border-teal-500/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-play" class="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Total Streams</p>
              <p class="text-2xl font-bold text-zinc-100">{{ listeningStats?.totalStreams ?? 0 }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>

      <NuxtLink to="/dashboard/stats" class="block">
        <UCard class="bg-zinc-900/50 border-zinc-800 hover:border-fuchsia-500/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-heart" class="w-6 h-6 text-fuchsia-400" />
            </div>
            <div>
              <p class="text-zinc-400 text-sm">Artists Supported</p>
              <p class="text-2xl font-bold text-zinc-100">{{ listeningStats?.uniqueArtists ?? 0 }}</p>
            </div>
          </div>
        </UCard>
      </NuxtLink>
      </div>
    </ClientOnly>

    <!-- Free tier upgrade prompt for empty stats -->
    <ClientOnly>
      <div v-if="!isSubscribed && !statsPending && (listeningStats?.totalStreams ?? 0) === 0" class="mb-8">
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
    </ClientOnly>

    <!-- Artist Section -->
    <ClientOnly>
      <template #fallback>
        <UCard class="bg-zinc-900/50 border-zinc-800 mb-8">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-zinc-100">Your Artist Profiles</h2>
              <div class="flex items-center gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  to="/dashboard/bulk-upload"
                >
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-1" />
                  Bulk Upload
                </UButton>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div v-for="i in 2" :key="i" class="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50">
              <USkeleton class="w-14 h-14 rounded-lg shrink-0" />
              <div class="flex-1 min-w-0">
                <USkeleton class="h-5 w-32 mb-2" />
                <USkeleton class="h-4 w-40 hidden sm:block" />
              </div>
              <div class="hidden sm:flex items-center gap-6">
                <div class="text-center">
                  <USkeleton class="h-5 w-12 mb-1 mx-auto" />
                  <USkeleton class="h-4 w-14" />
                </div>
                <div class="text-center">
                  <USkeleton class="h-5 w-14 mb-1 mx-auto" />
                  <USkeleton class="h-4 w-16" />
                </div>
              </div>
              <USkeleton class="w-5 h-5 rounded" />
            </div>
          </div>
        </UCard>
      </template>

      <UCard class="bg-zinc-900/50 border-zinc-800 mb-8">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-zinc-100">Your Artist Profiles</h2>
            <div class="flex items-center gap-2">
              <UButton
                color="gray"
                variant="ghost"
                size="sm"
                to="/dashboard/bulk-upload"
              >
                <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-1" />
                Bulk Upload
              </UButton>
              <UButton
                v-if="bands && bands.length > 0"
                color="violet"
                variant="soft"
                size="sm"
                to="/dashboard/artist/new"
              >
                <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
                New Artist
              </UButton>
            </div>
          </div>
        </template>

        <!-- Loading Skeleton -->
      <div v-if="bandsPending" class="space-y-4">
        <div v-for="i in 2" :key="i" class="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50">
          <USkeleton class="w-14 h-14 rounded-lg shrink-0" />
          <div class="flex-1 min-w-0">
            <USkeleton class="h-5 w-32 mb-2" />
            <USkeleton class="h-4 w-40 hidden sm:block" />
          </div>
          <div class="hidden sm:flex items-center gap-6">
            <div class="text-center">
              <USkeleton class="h-5 w-12 mb-1 mx-auto" />
              <USkeleton class="h-4 w-14" />
            </div>
            <div class="text-center">
              <USkeleton class="h-5 w-14 mb-1 mx-auto" />
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
          <USkeleton class="w-5 h-5 rounded" />
        </div>
      </div>

      <!-- No Bands -->
      <div v-else-if="!bands || bands.length === 0" class="text-center py-8">
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
            <p class="text-sm text-zinc-400 truncate hidden sm:block">
              fairtune.fm/{{ band.slug }}
            </p>
            <!-- Mobile stats (shown below name on small screens) -->
            <div class="flex items-center gap-3 text-xs text-zinc-400 sm:hidden mt-0.5">
              <span>{{ formatNumber(band.total_streams ?? 0) }} streams</span>
              <span>&middot;</span>
              <span>${{ ((band.total_earnings_cents ?? 0) / 100).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Stats (desktop) -->
          <div class="hidden sm:flex items-center gap-6 text-sm">
            <div class="text-center">
              <p class="text-zinc-100 font-semibold">{{ formatNumber(band.total_streams ?? 0) }}</p>
              <p class="text-zinc-500">Streams</p>
            </div>
            <div class="text-center">
              <p class="text-zinc-100 font-semibold">${{ ((band.total_earnings_cents ?? 0) / 100).toFixed(2) }}</p>
              <p class="text-zinc-500">Earnings</p>
            </div>
          </div>

          <!-- Arrow -->
          <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-500" />
        </NuxtLink>
      </div>
      </UCard>
    </ClientOnly>

    <!-- Subscription Status -->
    <ClientOnly>
      <template #fallback>
        <UCard class="bg-zinc-900/50 border-zinc-800 mb-8">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-zinc-100">Your Subscription</h2>
              <USkeleton class="h-6 w-16 rounded-full" />
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <USkeleton class="h-5 w-24 mb-2" />
                <USkeleton class="h-4 w-40" />
              </div>
              <USkeleton class="h-9 w-32 rounded-md" />
            </div>
          </div>
        </UCard>
      </template>

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
          <div class="flex gap-2">
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              to="/dashboard/payments"
            >
              Payment History
            </UButton>
            <UButton
              color="gray"
              variant="ghost"
              :loading="subscriptionLoading"
              @click="openCustomerPortal"
            >
              Manage Subscription
            </UButton>
          </div>
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
          <div class="flex gap-2">
            <UButton
              v-if="subscription?.status === 'active' && !subscription?.stripe_subscription_id"
              color="gray"
              variant="ghost"
              size="sm"
              :loading="syncing"
              @click="syncSubscription"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
              Sync
            </UButton>
            <UButton color="violet" to="/pricing">
              Upgrade
            </UButton>
          </div>
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
    </ClientOnly>

    <!-- Artist Boost (Subscribers Only) -->
    <ClientOnly>
      <BoostCard
        v-if="isSubscribed"
        :boost="boostData"
        class="mb-8"
        @refresh="refreshBoost"
      />
    </ClientOnly>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Discover Music</h2>
        </template>
        <p class="text-zinc-400 mb-4">
          Find new artists and albums to add to your collection.
        </p>
        <UButton color="violet" variant="ghost" to="/discover">
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
        <UButton color="violet" variant="ghost" to="/dashboard/favorites">
          View Favorites
        </UButton>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from '~/types/database'
import type { Band } from '~/stores/band'
import type { SubscriptionData } from '~/stores/subscription'

definePageMeta({
  middleware: 'auth',
})

const user = useSupabaseUser()
const client = useSupabaseClient<Database>()
const bandStore = useBandStore()
const { getUserBands, resolveAvatarUrls } = bandStore
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore
const subscriptionStore = useSubscriptionStore()
const { subscription, isSubscribed, freeTierStatus, loading: subscriptionLoading } = storeToRefs(subscriptionStore)
const { openCustomerPortal, setSubscription, fetchSubscription, fetchFreeTierStatus } = subscriptionStore

// Impact distribution interface
interface ImpactDistribution {
  period: string
  artistPoolCents: number
  artistBreakdown: Array<{ bandId: string }>
}

const syncing = ref(false)
const toast = useToast()

// Fetch bands using useAsyncData (auth-required, client-only)
const { data: bands, pending: bandsPending } = await useLazyAsyncData(
  'dashboard-bands',
  async () => {
    const bandsData = await getUserBands()
    await resolveAvatarUrls(bandsData)
    return bandsData
  },
  {
    default: () => [] as Band[],
    server: false,
  }
)

// Fetch listening stats using useAsyncData (auth-required, client-only)
const { data: listeningStats, pending: statsPending } = await useLazyAsyncData(
  'dashboard-listening-stats',
  async () => {
    if (!user.value?.id) return { totalSeconds: 0, totalStreams: 0, uniqueArtists: 0 }

    const { data, error } = await client
      .from('listening_history')
      .select('duration_seconds, completed, band_id, is_free_play')
      .eq('user_id', user.value.id)
      .eq('is_free_play', false)

    if (error) throw error

    return {
      totalSeconds: data?.reduce((sum, item) => sum + (item.duration_seconds || 0), 0) ?? 0,
      totalStreams: data?.filter(item => item.completed).length ?? 0,
      uniqueArtists: new Set(data?.map(item => item.band_id) ?? []).size,
    }
  },
  {
    default: () => ({ totalSeconds: 0, totalStreams: 0, uniqueArtists: 0 }),
    server: false,
  }
)

// Fetch impact distribution for subscribers using useLazyAsyncData (auth-required, client-only)
const { data: distribution, pending: impactLoading, refresh: refreshDistribution } = await useLazyAsyncData<ImpactDistribution | null>(
  'dashboard-impact',
  async () => {
    // Only fetch if user is subscribed
    if (!isSubscribed.value) return null

    const data = await $fetch<ImpactDistribution>('/api/listener/money-distribution', {
      query: { period: 'this-month' },
    })
    return data
  },
  {
    default: () => null,
    watch: [isSubscribed],
    server: false,
  }
)

// Fetch boost status for subscribers
interface BoostStatus {
  boost: {
    amount_cents: number
    status: string
    current_period_end: string | null
  } | null
}

const { data: boostResponse, refresh: refreshBoost } = await useLazyAsyncData<BoostStatus | null>(
  'dashboard-boost',
  async () => {
    if (!isSubscribed.value) return null
    return await $fetch<BoostStatus>('/api/boost/status')
  },
  {
    default: () => null,
    watch: [isSubscribed],
    server: false,
  }
)

const boostData = computed(() => boostResponse.value?.boost || null)

const syncSubscription = async () => {
  syncing.value = true
  try {
    const result = await $fetch<{
      synced: boolean
      subscription?: SubscriptionData
      message?: string
    }>('/api/subscription/sync', { method: 'POST' })

    if (result.synced && result.subscription) {
      // Update store directly with the synced data
      setSubscription(result.subscription)
      // Also refresh free tier status
      await fetchFreeTierStatus()

      toast.add({
        title: 'Subscription synced',
        description: `Status: ${result.subscription.status}`,
        color: 'green',
      })
    } else {
      toast.add({
        title: 'Sync failed',
        description: result.message || 'Could not find subscription in Stripe',
        color: 'red',
      })
    }
  } catch (e: any) {
    toast.add({
      title: 'Sync error',
      description: e.message || 'Failed to sync subscription',
      color: 'red',
    })
  } finally {
    syncing.value = false
  }
}

// Impact stats for hero card
const impactStats = computed(() => {
  if (!distribution.value || !isSubscribed.value) return null

  // We'll use the "last-month" data if available, otherwise show 0
  let thisMonthEarned = 0
  if (distribution.value.period === 'last-month') {
    thisMonthEarned = distribution.value.artistPoolCents
  }

  return {
    totalEarned: distribution.value.artistPoolCents,
    artistsSupported: distribution.value.artistBreakdown.length,
    thisMonth: thisMonthEarned,
  }
})

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

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

onMounted(() => {
  // Refresh subscription status on mount (in case webhook updated it)
  fetchSubscription()
})
</script>
