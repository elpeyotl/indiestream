<template>
  <div>
    <!-- Period Toggle + Share Button -->
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div class="inline-flex gap-2 p-1 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <UButton
          :color="selectedPeriod === 'this-month' ? 'violet' : 'gray'"
          :variant="selectedPeriod === 'this-month' ? 'solid' : 'ghost'"
          size="sm"
          @click="selectedPeriod = 'this-month'"
        >
          This Month
        </UButton>
        <UButton
          :color="selectedPeriod === 'last-month' ? 'violet' : 'gray'"
          :variant="selectedPeriod === 'last-month' ? 'solid' : 'ghost'"
          size="sm"
          @click="selectedPeriod = 'last-month'"
        >
          Last Month
        </UButton>
        <UButton
          :color="selectedPeriod === 'all-time' ? 'violet' : 'gray'"
          :variant="selectedPeriod === 'all-time' ? 'solid' : 'ghost'"
          size="sm"
          @click="selectedPeriod = 'all-time'"
        >
          All Time
        </UButton>
      </div>

      <div class="flex items-center gap-3">
        <!-- Revalidating indicator -->
        <UIcon
          v-if="loading && distribution"
          name="i-heroicons-arrow-path"
          class="w-4 h-4 text-zinc-400 animate-spin"
        />

        <!-- Share Button - show for anyone with impact -->
        <UButton
          v-if="distribution && distribution.hasImpact"
          color="violet"
          variant="ghost"
          @click="showShareModal = true">
          <UIcon name="i-heroicons-share" class="w-4 h-4" />
          Share
        </UButton>
      </div>
    </div>

    <!-- Loading - only show spinner on initial load (no data yet) -->
    <div v-if="loading && !distribution" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error && !distribution" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-400" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-100 mb-2">Failed to Load Data</h3>
      <p class="text-zinc-400 mb-6">{{ error }}</p>
      <UButton color="violet" @click="loadDistribution">
        Try Again
      </UButton>
    </div>

    <template v-else-if="distribution">
      <!-- Not Subscribed State - but may have tips/purchases -->
      <div v-if="distribution.subscriptionStatus === 'inactive'" class="space-y-6">
        <!-- Show direct support if user has tips or purchases -->
        <template v-if="distribution.hasImpact">
          <!-- Total Impact Hero -->
          <UCard class="bg-gradient-to-br from-pink-500/10 via-violet-500/10 to-emerald-500/10 border-pink-500/30">
            <div class="text-center py-4">
              <p class="text-zinc-400 text-sm mb-1">Your Direct Artist Support</p>
              <p class="text-4xl font-bold text-zinc-100">{{ formatCurrency(distribution.totals.totalToArtistsCents) }}</p>
              <p class="text-zinc-400 text-sm mt-2">
                {{ distribution.totals.uniqueArtistsSupported }} {{ distribution.totals.uniqueArtistsSupported === 1 ? 'artist' : 'artists' }} supported
              </p>
            </div>
          </UCard>

          <!-- Stats Grid for non-subscribers -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UCard v-if="distribution.tips.tipCount > 0" class="bg-zinc-900/50 border-zinc-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-gift" class="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p class="text-zinc-400 text-xs">Tips Given</p>
                  <p class="text-lg font-bold text-zinc-100">{{ distribution.tips.tipCount }}</p>
                  <p class="text-sm text-pink-400">{{ formatCurrency(distribution.tips.totalNetCents) }} to artists</p>
                </div>
              </div>
            </UCard>

            <UCard v-if="distribution.purchases.purchaseCount > 0" class="bg-zinc-900/50 border-zinc-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p class="text-zinc-400 text-xs">Albums Purchased</p>
                  <p class="text-lg font-bold text-zinc-100">{{ distribution.purchases.purchaseCount }}</p>
                  <p class="text-sm text-emerald-400">{{ formatCurrency(distribution.purchases.totalArtistShareCents) }} to artists</p>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Tips Breakdown -->
          <UCard v-if="distribution.tips.artistBreakdown.length > 0" class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-zinc-100">Tips</h2>
                <span class="text-sm text-pink-400">{{ formatCurrency(distribution.tips.totalNetCents) }} to artists</span>
              </div>
            </template>
            <div class="space-y-3">
              <NuxtLink
                v-for="tip in distribution.tips.artistBreakdown"
                :key="tip.bandId"
                :to="`/${tip.bandSlug}`"
                class="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center overflow-hidden">
                    <img v-if="tip.avatarUrl" :src="tip.avatarUrl" :alt="tip.bandName" class="w-full h-full object-cover" />
                    <span v-else class="text-sm font-bold text-white">{{ tip.bandName.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ tip.bandName }}</p>
                    <p class="text-xs text-zinc-400">{{ tip.tipCount }} {{ tip.tipCount === 1 ? 'tip' : 'tips' }}</p>
                  </div>
                </div>
                <p class="text-pink-400 font-semibold">{{ formatCurrency(tip.totalNetCents) }}</p>
              </NuxtLink>
            </div>
          </UCard>

          <!-- Purchases Breakdown -->
          <UCard v-if="distribution.purchases.breakdown.length > 0" class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-zinc-100">Album Purchases</h2>
                <span class="text-sm text-emerald-400">{{ formatCurrency(distribution.purchases.totalArtistShareCents) }} to artists</span>
              </div>
            </template>
            <div class="space-y-3">
              <NuxtLink
                v-for="purchase in distribution.purchases.breakdown"
                :key="purchase.albumId"
                :to="`/${purchase.bandSlug}/${purchase.albumSlug}`"
                class="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden">
                    <img v-if="purchase.avatarUrl" :src="purchase.avatarUrl" :alt="purchase.bandName" class="w-full h-full object-cover" />
                    <UIcon v-else name="i-heroicons-musical-note" class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ purchase.albumTitle }}</p>
                    <p class="text-xs text-zinc-400">{{ purchase.bandName }}</p>
                  </div>
                </div>
                <p class="text-emerald-400 font-semibold">{{ formatCurrency(purchase.artistShareCents) }}</p>
              </NuxtLink>
            </div>
          </UCard>
        </template>

        <!-- Subscribe CTA -->
        <UCard class="bg-gradient-to-r from-violet-500/10 to-teal-500/10 border-violet-500/30">
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-heart" class="w-8 h-8 text-violet-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100 mb-2">
              {{ distribution.hasImpact ? 'Support Artists Every Time You Listen' : 'Subscribe to Support Artists' }}
            </h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              {{ distribution.hasImpact
                ? 'With a subscription, 70% of your $9.99 goes directly to artists based on what you stream. Add streaming support to your tips and purchases!'
                : 'See your personal impact and support the artists you love with a subscription. 70% of your $9.99 goes directly to artists based on what you listen to.'
              }}
            </p>
            <UButton color="violet" to="/pricing" size="lg">
              View Plans
            </UButton>
          </div>
        </UCard>

        <!-- How It Works for non-subscribers with impact -->
        <UCard v-if="distribution.hasImpact" class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 class="text-zinc-100 font-semibold mb-1">How It Works</h3>
              <p class="text-zinc-400 text-sm leading-relaxed">
                Your support reaches artists directly: <span class="text-pink-400">~97% of tips</span> go to artists (only Stripe fees apply),
                and <span class="text-emerald-400">85% of album purchases</span> go to artists. Subscribe to add streaming support where
                70% of your monthly fee goes to artists based on your listening time.
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Subscribed with No Activity at all -->
      <div v-else-if="!distribution.hasImpact" class="space-y-6">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <DashboardRevenueSplitChart
            :total-paid-cents="distribution.totalPaidCents"
            :artist-pool-cents="distribution.artistPoolCents"
            :cmo-fee-cents="distribution.cmoFeeCents"
            :platform-fee-cents="distribution.platformFeeCents"
            :months-subscribed="distribution.monthsSubscribed"
          />
        </UCard>

        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-teal-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100 mb-2">Start Listening to See Your Impact</h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              You haven't streamed any music {{ selectedPeriod === 'this-month' ? 'this month' : selectedPeriod === 'last-month' ? 'last month' : 'yet' }}. Start listening to support artists and see your personalized impact breakdown.
            </p>
            <UButton color="teal" to="/discover" size="lg">
              Discover Artists
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Has Impact Data (subscriber or anyone with activity) -->
      <div v-else class="space-y-6">
        <!-- Total Impact Hero -->
        <UCard class="bg-gradient-to-br from-teal-500/10 via-violet-500/10 to-pink-500/10 border-teal-500/30">
          <div class="text-center py-4">
            <p class="text-zinc-400 text-sm mb-1">Total Artist Support</p>
            <p class="text-4xl font-bold text-zinc-100">{{ formatCurrency(distribution.totals.totalToArtistsCents) }}</p>
            <p class="text-zinc-400 text-sm mt-2">
              {{ distribution.totals.uniqueArtistsSupported }} {{ distribution.totals.uniqueArtistsSupported === 1 ? 'artist' : 'artists' }} supported
            </p>
          </div>
        </UCard>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-clock" class="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p class="text-zinc-400 text-xs">Listening Time</p>
                <p class="text-lg font-bold text-zinc-100">{{ formatDuration(distribution.totalListeningSeconds) }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-play" class="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p class="text-zinc-400 text-xs">Total Streams</p>
                <p class="text-lg font-bold text-zinc-100">{{ distribution.totalStreams }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <p class="text-zinc-400 text-xs">Artists Supported</p>
                <p class="text-lg font-bold text-zinc-100">{{ distribution.totals.uniqueArtistsSupported }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-gift" class="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p class="text-zinc-400 text-xs">Tips Given</p>
                <p class="text-lg font-bold text-zinc-100">{{ distribution.tips.tipCount }}</p>
              </div>
            </div>
          </UCard>

          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p class="text-zinc-400 text-xs">Albums Bought</p>
                <p class="text-lg font-bold text-zinc-100">{{ distribution.purchases.purchaseCount }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Streaming Artist Distribution -->
        <UCard v-if="distribution.artistBreakdown.length > 0" class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded bg-teal-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-play" class="w-3 h-3 text-teal-400" />
                </div>
                <h2 class="text-lg font-semibold text-zinc-100">Streaming Distribution</h2>
              </div>
              <span class="text-sm text-teal-400">{{ formatCurrency(distribution.artistPoolCents) }} to artists</span>
            </div>
          </template>

          <div class="space-y-3">
            <DashboardArtistImpactCard
              v-for="artist in distribution.artistBreakdown"
              :key="artist.bandId"
              :artist-name="artist.bandName"
              :artist-slug="artist.bandSlug"
              :avatar-url="artist.avatarUrl"
              :listening-seconds="artist.listeningSeconds"
              :stream-count="artist.streamCount"
              :percentage="artist.percentageOfListening"
              :earnings-cents="artist.earningsCents"
            />
          </div>
        </UCard>

        <!-- Tips Breakdown (for subscribers who also tip) -->
        <UCard v-if="distribution.tips.artistBreakdown.length > 0" class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded bg-pink-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-gift" class="w-3 h-3 text-pink-400" />
                </div>
                <h2 class="text-lg font-semibold text-zinc-100">Tips</h2>
              </div>
              <span class="text-sm text-pink-400">{{ formatCurrency(distribution.tips.totalNetCents) }} to artists</span>
            </div>
          </template>
          <div class="space-y-3">
            <NuxtLink
              v-for="tip in distribution.tips.artistBreakdown"
              :key="tip.bandId"
              :to="`/${tip.bandSlug}`"
              class="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center overflow-hidden">
                  <img v-if="tip.avatarUrl" :src="tip.avatarUrl" :alt="tip.bandName" class="w-full h-full object-cover" />
                  <span v-else class="text-sm font-bold text-white">{{ tip.bandName.charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="font-medium text-zinc-100">{{ tip.bandName }}</p>
                  <p class="text-xs text-zinc-400">{{ tip.tipCount }} {{ tip.tipCount === 1 ? 'tip' : 'tips' }}</p>
                </div>
              </div>
              <p class="text-pink-400 font-semibold">{{ formatCurrency(tip.totalNetCents) }}</p>
            </NuxtLink>
          </div>
        </UCard>

        <!-- Purchases Breakdown (for subscribers who also purchase) -->
        <UCard v-if="distribution.purchases.breakdown.length > 0" class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-shopping-bag" class="w-3 h-3 text-emerald-400" />
                </div>
                <h2 class="text-lg font-semibold text-zinc-100">Album Purchases</h2>
              </div>
              <span class="text-sm text-emerald-400">{{ formatCurrency(distribution.purchases.totalArtistShareCents) }} to artists</span>
            </div>
          </template>
          <div class="space-y-3">
            <NuxtLink
              v-for="purchase in distribution.purchases.breakdown"
              :key="purchase.albumId"
              :to="`/${purchase.bandSlug}/${purchase.albumSlug}`"
              class="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center overflow-hidden">
                  <img v-if="purchase.avatarUrl" :src="purchase.avatarUrl" :alt="purchase.bandName" class="w-full h-full object-cover" />
                  <UIcon v-else name="i-heroicons-musical-note" class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="font-medium text-zinc-100">{{ purchase.albumTitle }}</p>
                  <p class="text-xs text-zinc-400">{{ purchase.bandName }}</p>
                </div>
              </div>
              <p class="text-emerald-400 font-semibold">{{ formatCurrency(purchase.artistShareCents) }}</p>
            </NuxtLink>
          </div>
        </UCard>

        <!-- Revenue Split Chart (only for subscribers) -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-zinc-100">Subscription Split - {{ distribution.periodLabel }}</h2>
              <UBadge v-if="selectedPeriod === 'all-time'" color="violet" variant="subtle">
                {{ distribution.monthsSubscribed }} {{ distribution.monthsSubscribed === 1 ? 'month' : 'months' }} subscribed
              </UBadge>
            </div>
          </template>
          <DashboardRevenueSplitChart
            :total-paid-cents="distribution.totalPaidCents"
            :artist-pool-cents="distribution.artistPoolCents"
            :cmo-fee-cents="distribution.cmoFeeCents"
            :platform-fee-cents="distribution.platformFeeCents"
            :months-subscribed="distribution.monthsSubscribed"
          />
        </UCard>

        <!-- How It Works -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 class="text-zinc-100 font-semibold mb-1">How Your Support Reaches Artists</h3>
              <p class="text-zinc-400 text-sm leading-relaxed">
                Your support reaches artists in three ways:
                <span class="text-teal-400">70% of your subscription</span> ($6.99/mo) goes to artists based on your listening time,
                <span class="text-pink-400">~97% of your tips</span> go directly to artists (only Stripe processing fees apply),
                and <span class="text-emerald-400">85% of album purchases</span> go to artists.
                The remaining subscription amounts fund performance royalties (CMOs) and platform operations.
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </template>

    <!-- Share Impact Modal -->
    <ShareImpactModal v-model="showShareModal" />
  </div>
</template>

<script setup lang="ts">
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore

interface ArtistBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  listeningSeconds: number
  streamCount: number
  percentageOfListening: number
  earningsCents: number
}

interface TipBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  tipCount: number
  totalGrossCents: number
  totalNetCents: number
}

interface PurchaseBreakdown {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  albumId: string
  albumTitle: string
  albumSlug: string
  coverKey: string | null
  amountCents: number
  artistShareCents: number
  purchasedAt: string
}

interface MoneyDistribution {
  period: 'all-time' | 'last-month' | 'this-month'
  periodLabel: string
  subscriptionStatus: 'active' | 'trialing' | 'inactive'
  totalPaidCents: number
  artistPoolCents: number
  cmoFeeCents: number
  platformFeeCents: number
  totalListeningSeconds: number
  totalStreams: number
  monthsSubscribed: number
  artistBreakdown: ArtistBreakdown[]

  tips: {
    totalGrossCents: number
    totalNetCents: number
    tipCount: number
    artistBreakdown: TipBreakdown[]
  }

  purchases: {
    totalGrossCents: number
    totalArtistShareCents: number
    purchaseCount: number
    breakdown: PurchaseBreakdown[]
  }

  totals: {
    totalToArtistsCents: number
    totalContributionCents: number
    uniqueArtistsSupported: number
  }

  hasImpact: boolean
}

// Period selector - default to this-month
const selectedPeriod = ref<'all-time' | 'last-month' | 'this-month'>('this-month')

// Share modal
const showShareModal = ref(false)

// Fetch distribution using Nuxt's useLazyAsyncData
// server: false ensures this only runs on client (requires auth session)
const { data: distribution, pending: loading, error: fetchError, refresh } = await useLazyAsyncData(
  'money-distribution',
  async () => {
    const data = await $fetch<MoneyDistribution>('/api/listener/money-distribution', {
      query: { period: selectedPeriod.value },
    })

    // Get presigned URLs for artist avatars (streaming)
    for (const artist of data.artistBreakdown) {
      if (artist.avatarKey) {
        try {
          artist.avatarUrl = await getStreamUrl(artist.avatarKey)
        } catch (e) {
          console.error('Failed to load avatar for artist:', artist.bandId, e)
        }
      }
    }

    // Get presigned URLs for tips artist avatars
    for (const tip of data.tips.artistBreakdown) {
      if (tip.avatarKey) {
        try {
          tip.avatarUrl = await getStreamUrl(tip.avatarKey)
        } catch (e) {
          console.error('Failed to load avatar for tip artist:', tip.bandId, e)
        }
      }
    }

    // Get presigned URLs for purchases avatars and album covers
    for (const purchase of data.purchases.breakdown) {
      if (purchase.avatarKey) {
        try {
          purchase.avatarUrl = await getStreamUrl(purchase.avatarKey)
        } catch (e) {
          console.error('Failed to load avatar for purchase artist:', purchase.bandId, e)
        }
      }
    }

    return data
  },
  {
    watch: [selectedPeriod],
    server: false,
  }
)

const error = computed(() => fetchError.value?.message || null)

const loadDistribution = () => refresh()

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
</script>
