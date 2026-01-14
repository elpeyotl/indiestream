<template>
  <NuxtLink
    :to="`/${artistSlug}`"
    class="block p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-800 hover:border-teal-500/50"
  >
    <div class="flex items-center gap-4">
      <!-- Avatar -->
      <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-500 to-violet-500 flex items-center justify-center overflow-hidden shrink-0">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="artistName"
          class="w-full h-full object-cover"
        />
        <span v-else class="text-xl font-bold text-white">
          {{ artistName.charAt(0).toUpperCase() }}
        </span>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-zinc-100 truncate mb-1">{{ artistName }}</h3>
        <div class="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <span>{{ formattedDuration }}</span>
          <span class="text-zinc-600">•</span>
          <span>{{ streamCount }} {{ streamCount === 1 ? 'stream' : 'streams' }}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="text-xs text-zinc-500">
            {{ formattedPercentage }} of your listening
          </div>
          <div class="text-lg font-bold text-teal-400">
            {{ formattedEarnings }}
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-500 shrink-0" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  artistName: string
  artistSlug: string
  avatarUrl: string | null
  listeningSeconds: number
  streamCount: number
  percentage: number
  earningsCents: number
}

const props = defineProps<Props>()

const formattedDuration = computed(() => {
  const hours = Math.floor(props.listeningSeconds / 3600)
  const minutes = Math.floor((props.listeningSeconds % 3600) / 60)
  const seconds = props.listeningSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
})

const formattedPercentage = computed(() => {
  return `${props.percentage.toFixed(1)}%`
})

const formattedEarnings = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(props.earningsCents / 100)
})
</script>
