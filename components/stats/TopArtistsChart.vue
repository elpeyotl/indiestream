<template>
  <div class="space-y-3">
    <div
      v-for="(artist, index) in artists"
      :key="artist.bandId"
      class="flex items-center gap-3"
    >
      <!-- Rank -->
      <span class="text-lg font-bold text-zinc-500 w-6 shrink-0">{{ index + 1 }}</span>

      <!-- Artist Avatar -->
      <div class="w-10 h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
        <img
          v-if="artist.avatarUrl"
          :src="artist.avatarUrl"
          :alt="artist.bandName"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon name="i-heroicons-user" class="w-5 h-5 text-zinc-600" />
        </div>
      </div>

      <!-- Artist Info and Bar -->
      <div class="flex-1 min-w-0">
        <NuxtLink
          :to="`/${artist.bandSlug}`"
          class="font-medium text-zinc-100 hover:text-teal-400 truncate block"
        >
          {{ artist.bandName }}
        </NuxtLink>

        <!-- Progress Bar -->
        <div class="mt-1 w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div
            class="bg-teal-500 h-full transition-all duration-500"
            :style="{ width: `${artist.percentageOfTotal}%` }"
          ></div>
        </div>

        <p class="text-xs text-zinc-500 mt-1">
          {{ artist.streamCount }} streams · {{ formatTime(artist.listeningSeconds) }}
        </p>
      </div>

      <!-- Percentage -->
      <span class="text-sm font-medium text-teal-400 shrink-0">
        {{ artist.percentageOfTotal.toFixed(1) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TopArtist {
  bandId: string
  bandName: string
  bandSlug: string
  avatarKey: string | null
  avatarUrl: string | null
  streamCount: number
  listeningSeconds: number
  percentageOfTotal: number
  firstListenedAt: string
}

interface Props {
  artists: TopArtist[]
}

defineProps<Props>()

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
</script>
