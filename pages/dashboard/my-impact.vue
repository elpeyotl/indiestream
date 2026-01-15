<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
      <h1 class="text-3xl font-bold text-zinc-100">My Impact</h1>
      <p class="text-zinc-400 mt-2">See how your subscription supports the artists you love</p>
    </div>

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

      <!-- Share Button -->
      <UButton
        v-if="distribution && distribution.subscriptionStatus !== 'inactive'"
        color="violet"
        variant="outline"
        @click="showShareModal = true">
        <UIcon name="i-heroicons-share" class="w-4 h-4" />
        Share
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
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
      <!-- Not Subscribed State -->
      <div v-if="distribution.subscriptionStatus === 'inactive'" class="space-y-6">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <DashboardRevenueSplitChart
            :total-paid-cents="distribution.totalPaidCents"
            :artist-pool-cents="distribution.artistPoolCents"
            :cmo-fee-cents="distribution.cmoFeeCents"
            :platform-fee-cents="distribution.platformFeeCents"
            :months-subscribed="distribution.monthsSubscribed"
          />
        </UCard>

        <UCard class="bg-gradient-to-r from-violet-500/10 to-teal-500/10 border-violet-500/30">
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-heart" class="w-8 h-8 text-violet-400" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100 mb-2">Subscribe to Support Artists</h3>
            <p class="text-zinc-400 mb-6 max-w-md mx-auto">
              See your personal impact and support the artists you love with a subscription. 70% of your $9.99 goes directly to artists based on what you listen to.
            </p>
            <UButton color="violet" to="/pricing" size="lg">
              View Plans
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Subscribed with No Listening Data -->
      <div v-else-if="distribution.totalStreams === 0" class="space-y-6">
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

      <!-- Has Listening Data -->
      <div v-else class="space-y-6">
        <!-- Summary Card with Chart -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-zinc-100">{{ distribution.periodLabel }}</h2>
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

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p class="text-lg font-bold text-zinc-100">{{ distribution.artistBreakdown.length }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Artist Distribution -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-zinc-100">Artist Distribution</h2>
              <span class="text-sm text-zinc-400">{{ formatCurrency(distribution.artistPoolCents) }} to artists</span>
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

        <!-- Info Card -->
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 class="text-zinc-100 font-semibold mb-1">How It Works</h3>
              <p class="text-zinc-400 text-sm leading-relaxed">
                Your $9.99 subscription is split three ways: 70% ($6.99) goes directly to artists based on your listening time,
                15% ($1.50) funds performance royalties for composers through CMOs (SUISA, GEMA, PRS, ASCAP, BMI),
                and 15% ($1.50) covers platform operations. This user-centric model means your subscription directly supports
                the artists you actually listen to.
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
definePageMeta({
  middleware: 'auth',
})

const { distribution, loading, error, fetchDistribution, formatCurrency, formatDuration } = useMoneyDistribution()

// Period selector - default to this-month
const selectedPeriod = ref<'all-time' | 'last-month' | 'this-month'>('this-month')

// Share modal
const showShareModal = ref(false)

// Function to load distribution
const loadDistribution = () => {
  fetchDistribution(selectedPeriod.value)
}

// Load distribution when period changes
watch(selectedPeriod, () => {
  loadDistribution()
}, { immediate: true })
</script>
