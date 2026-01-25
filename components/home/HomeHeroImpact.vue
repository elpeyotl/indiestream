<template>
  <section class="mb-12">
    <!-- Logged Out Hero -->
    <div v-if="!isLoggedIn" class="bg-gradient-to-br from-violet-900/30 to-zinc-900 rounded-2xl p-8 md:p-12">
      <h1 class="text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
        Heavy Riffs. Fair Pay. No Bullshit.
      </h1>
      <p class="text-lg text-zinc-300 mb-6 max-w-xl">
        70% to artists. 15% to royalties. The only streaming platform where your money actually goes to your artists.
      </p>
      <div class="flex flex-wrap gap-3">
        <UButton color="violet" size="lg" to="/register">
          Sign Up
        </UButton>
        <UButton color="gray" variant="ghost" size="lg" to="/discover">
          Browse Music
        </UButton>
      </div>
    </div>

    <!-- Free User with Impact (tips/purchases) -->
    <div v-else-if="!isSubscribed && hasImpact" class="bg-gradient-to-br from-pink-900/20 via-violet-900/20 to-emerald-900/20 rounded-2xl p-8 md:p-12">
      <div v-if="loading" class="animate-pulse">
        <USkeleton class="h-8 w-32 mb-4" />
        <USkeleton class="h-12 w-64 mb-3" />
        <USkeleton class="h-5 w-48" />
      </div>
      <template v-else>
        <p class="text-zinc-400 mb-2">Hey {{ userName }}.</p>
        <p class="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
          You've directly supported
          <span class="text-violet-400">{{ stats?.artistsSupported || 0 }} {{ (stats?.artistsSupported || 0) === 1 ? 'artist' : 'artists' }}</span>
          with
          <span class="text-pink-400">{{ formatCurrency(totalDirectSupport) }}</span>.
        </p>
        <p class="text-zinc-400 mb-4">
          <template v-if="stats?.tipCount">{{ stats.tipCount }} {{ stats.tipCount === 1 ? 'tip' : 'tips' }}</template>
          <template v-if="stats?.tipCount && stats?.purchaseCount"> · </template>
          <template v-if="stats?.purchaseCount">{{ stats.purchaseCount }} {{ stats.purchaseCount === 1 ? 'album purchase' : 'album purchases' }}</template>
        </p>
        <div class="flex flex-wrap gap-3">
          <UButton color="violet" size="lg" to="/pricing">
            Add Streaming Support
          </UButton>
          <UButton color="gray" variant="ghost" to="/dashboard/stats">
            See your impact
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
          </UButton>
        </div>
      </template>
    </div>

    <!-- Free User Hero (no impact yet) -->
    <div v-else-if="!isSubscribed" class="bg-gradient-to-br from-teal-900/30 to-zinc-900 rounded-2xl p-8 md:p-12">
      <h2 class="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
        Stream fair. Support direct.
      </h2>
      <p class="text-lg text-zinc-300 mb-2">
        CHF 9.99/month. 70% to artists.
      </p>
      <p class="text-zinc-400 mb-6">
        See exactly where your money goes.
      </p>
      <UButton color="violet" size="lg" to="/pricing">
        Subscribe
      </UButton>
    </div>

    <!-- Subscriber Hero -->
    <div v-else class="bg-gradient-to-br from-violet-900/20 to-zinc-900 rounded-2xl p-8 md:p-12">
      <div v-if="loading" class="animate-pulse">
        <USkeleton class="h-8 w-32 mb-4" />
        <USkeleton class="h-12 w-64 mb-3" />
        <USkeleton class="h-5 w-48" />
      </div>
      <template v-else>
        <p class="text-zinc-400 mb-2">Hey {{ userName }}.</p>
        <p class="text-2xl md:text-3xl font-bold text-zinc-100 mb-3">
          This month you've put
          <span class="text-teal-400">{{ formatCurrency(totalSubscriberSupport) }}</span>
          directly into artists' pockets.
        </p>
        <p class="text-zinc-400 mb-6">
          {{ stats?.artistsSupported || 0 }} artists supported · {{ stats?.hoursListened || 0 }} hours listened
          <template v-if="stats?.tipCount"> · {{ stats.tipCount }} {{ stats.tipCount === 1 ? 'tip' : 'tips' }}</template>
        </p>
        <UButton color="gray" variant="ghost" to="/dashboard/stats">
          See your full impact
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-1" />
        </UButton>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
interface ImpactStats {
  monthlyEarnings: number
  artistsSupported: number
  hoursListened: number
  streamCount: number
  // New fields for tips/purchases
  tipsCents?: number
  purchasesCents?: number
  tipCount?: number
  purchaseCount?: number
}

interface Props {
  isLoggedIn: boolean
  isSubscribed: boolean
  stats?: ImpactStats | null
  loading?: boolean
  hasImpact?: boolean
}

const props = defineProps<Props>()

const userProfileStore = useUserProfileStore()
const { ownProfile } = storeToRefs(userProfileStore)

const userName = computed(() => {
  if (!ownProfile.value) return ''
  return ownProfile.value.displayName?.split(' ')[0] || ''
})

const formatCurrency = (cents: number): string => {
  return `CHF ${(cents / 100).toFixed(2)}`
}

// Calculate total direct support (tips + purchases) for non-subscribers
const totalDirectSupport = computed(() => {
  if (!props.stats) return 0
  return (props.stats.tipsCents || 0) + (props.stats.purchasesCents || 0)
})

// Calculate total support for subscribers (streaming share + tips + purchases)
const totalSubscriberSupport = computed(() => {
  if (!props.stats) return 0
  return (props.stats.monthlyEarnings || 0) + (props.stats.tipsCents || 0) + (props.stats.purchasesCents || 0)
})
</script>
