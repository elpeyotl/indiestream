<template>
  <section class="mb-12">
    <!-- Logged Out Hero -->
    <div v-if="!isLoggedIn" class="bg-zinc-950 border-2 border-zinc-800 p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
      <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">
        HEAVY RIFFS. FAIR PAY. NO BULLSHIT.
      </h1>
      <p class="text-lg text-zinc-400 font-mono mb-6 max-w-xl">
        70% to artists. 15% to royalties. The only streaming platform where your money actually goes to your artists.
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/register"
          class="px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
        >
          Sign Up
        </NuxtLink>
        <NuxtLink
          to="/discover"
          class="px-6 py-3 border-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors"
        >
          Browse Music
        </NuxtLink>
      </div>
    </div>

    <!-- Free User with Impact (tips/purchases) -->
    <div v-else-if="!isSubscribed && hasImpact" class="bg-zinc-950 border-2 border-fuchsia-500/50 p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
      <div v-if="loading" class="animate-pulse space-y-4">
        <div class="h-6 w-32 bg-zinc-800 border-2 border-zinc-700"></div>
        <div class="h-10 w-64 bg-zinc-800 border-2 border-zinc-700"></div>
        <div class="h-5 w-48 bg-zinc-800 border-2 border-zinc-700"></div>
      </div>
      <template v-else>
        <p class="text-zinc-500 font-mono text-sm uppercase tracking-tight mb-2">Hey {{ userName }}.</p>
        <p class="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-3">
          You've directly supported
          <span class="text-fuchsia-500">{{ stats?.artistsSupported || 0 }} {{ (stats?.artistsSupported || 0) === 1 ? 'artist' : 'artists' }}</span>
          with
          <span class="text-pink-500">{{ formatCurrency(totalDirectSupport) }}</span>.
        </p>
        <p class="text-zinc-500 font-mono text-sm mb-6">
          <template v-if="stats?.tipCount">{{ stats.tipCount }} {{ stats.tipCount === 1 ? 'tip' : 'tips' }}</template>
          <template v-if="stats?.tipCount && stats?.purchaseCount"> · </template>
          <template v-if="stats?.purchaseCount">{{ stats.purchaseCount }} {{ stats.purchaseCount === 1 ? 'album purchase' : 'album purchases' }}</template>
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/pricing"
            class="px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
          >
            Add Streaming Support
          </NuxtLink>
          <NuxtLink
            to="/dashboard/stats"
            class="px-6 py-3 border-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors inline-flex items-center gap-2"
          >
            See your impact
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </template>
    </div>

    <!-- Free User Hero (no impact yet) -->
    <div v-else-if="!isSubscribed" class="bg-zinc-950 border-2 border-zinc-800 p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
      <h2 class="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-3">
        STREAM FAIR. SUPPORT DIRECT.
      </h2>
      <p class="text-lg text-zinc-300 font-mono mb-2">
        CHF 9.99/month. 70% to artists.
      </p>
      <p class="text-zinc-500 font-mono text-sm mb-6">
        See exactly where your money goes.
      </p>
      <NuxtLink
        to="/pricing"
        class="inline-block px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
      >
        Subscribe
      </NuxtLink>
    </div>

    <!-- Subscriber Hero -->
    <div v-else class="bg-zinc-950 border-2 border-fuchsia-500/50 p-8 md:p-12 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
      <div v-if="loading" class="animate-pulse space-y-4">
        <div class="h-6 w-32 bg-zinc-800 border-2 border-zinc-700"></div>
        <div class="h-10 w-64 bg-zinc-800 border-2 border-zinc-700"></div>
        <div class="h-5 w-48 bg-zinc-800 border-2 border-zinc-700"></div>
      </div>
      <template v-else>
        <p class="text-zinc-500 font-mono text-sm uppercase tracking-tight mb-2">Hey {{ userName }}.</p>
        <p class="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-3">
          This month you've put
          <span class="text-emerald-500">{{ formatCurrency(totalSubscriberSupport) }}</span>
          directly into artists' pockets.
        </p>
        <p class="text-zinc-500 font-mono text-sm mb-6">
          {{ stats?.artistsSupported || 0 }} artists supported · {{ stats?.hoursListened || 0 }} hours listened
          <template v-if="stats?.tipCount"> · {{ stats.tipCount }} {{ stats.tipCount === 1 ? 'tip' : 'tips' }}</template>
        </p>
        <NuxtLink
          to="/dashboard/stats"
          class="inline-flex items-center gap-2 px-6 py-3 border-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight hover:border-fuchsia-500 hover:text-fuchsia-500 transition-colors"
        >
          See your full impact
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </NuxtLink>
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
