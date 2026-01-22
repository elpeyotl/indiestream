<template>
  <div>
    <!-- Period Toggle -->
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div class="inline-flex gap-2 p-1 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <UButton
          :color="selectedPeriod === 'this-year' ? 'violet' : 'gray'"
          :variant="selectedPeriod === 'this-year' ? 'solid' : 'ghost'"
          size="sm"
          @click="selectedPeriod = 'this-year'"
        >
          This Year
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

      <!-- Revalidating indicator -->
      <UIcon
        v-if="loading && stats"
        name="i-heroicons-arrow-path"
        class="w-4 h-4 text-zinc-400 animate-spin"
      />
    </div>

    <!-- Loading - only show spinner on initial load (no data yet) -->
    <LoadingSpinner v-if="loading && !stats" />

    <EmptyState
      v-else-if="error && !stats"
      icon="i-heroicons-exclamation-triangle"
      :title="'Failed to Load Stats'"
      :description="error"
      action-label="Try Again"
      color="red"
      @action="loadStats"
    />

    <!-- Content -->
    <template v-else-if="stats">
      <EmptyState
        v-if="stats.totalStreams === 0"
        icon="i-heroicons-musical-note"
        title="No Listening Data"
        :description="`You haven't listened to any music ${periodDescription} yet. Start exploring to unlock your stats!`"
        action-label="Discover Music"
        action-to="/discover"
      />

      <!-- Stats Content -->
      <div v-else class="space-y-8">
        <!-- Hero Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsStatCard
            title="Listening Time"
            :value="formatTime(stats.totalListeningSeconds)"
            icon="i-heroicons-clock"
            color="violet"
          />
          <StatsStatCard
            title="Total Streams"
            :value="stats.totalStreams"
            icon="i-heroicons-play"
            color="teal"
          />
          <StatsStatCard
            title="Unique Artists"
            :value="stats.uniqueArtists"
            icon="i-heroicons-user-group"
            color="fuchsia"
          />
          <StatsStatCard
            title="Unique Tracks"
            :value="stats.uniqueTracks"
            icon="i-heroicons-musical-note"
            color="orange"
          />
        </div>

        <!-- Listening Patterns Section -->
        <UCard class="bg-zinc-900/50 border-zinc-800" v-if="stats.mostActiveDay">
          <template #header>
            <h2 class="text-xl font-semibold text-zinc-100">When You Listen</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 rounded-lg bg-zinc-800/50">
              <UIcon name="i-heroicons-calendar" class="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p class="text-2xl font-bold text-zinc-100">{{ stats.mostActiveDay }}</p>
              <p class="text-sm text-zinc-400">Most Active Day</p>
            </div>
            <div class="text-center p-4 rounded-lg bg-zinc-800/50">
              <UIcon name="i-heroicons-clock" class="w-6 h-6 text-teal-400 mx-auto mb-2" />
              <p class="text-2xl font-bold text-zinc-100">{{ formatHour(stats.mostActiveHour) }}</p>
              <p class="text-sm text-zinc-400">Peak Listening Hour</p>
            </div>
            <div class="text-center p-4 rounded-lg bg-zinc-800/50">
              <UIcon name="i-heroicons-fire" class="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p class="text-2xl font-bold text-zinc-100">{{ stats.longestStreak }} days</p>
              <p class="text-sm text-zinc-400">Longest Streak</p>
            </div>
          </div>

          <!-- Listening by Hour Chart -->
          <div v-if="stats.listeningByHour.length > 0">
            <h3 class="text-sm font-semibold text-zinc-300 mb-3">Listening by Hour</h3>
            <div class="flex items-end gap-1 h-32">
              <div
                v-for="hourData in stats.listeningByHour"
                :key="hourData.hour"
                class="flex-1 bg-violet-500/20 rounded-t hover:bg-violet-500/40 transition-colors relative group"
                :style="{ height: `${(hourData.minutes / maxMinutesInHour) * 100}%` }"
                :title="`${hourData.hour}:00 - ${hourData.minutes}min`"
              >
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {{ hourData.hour }}:00<br>{{ hourData.minutes }}min
                </div>
              </div>
            </div>
            <div class="flex justify-between text-xs text-zinc-500 mt-2">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
          </div>
        </UCard>

        <!-- Top Artists Section -->
        <UCard class="bg-zinc-900/50 border-zinc-800" v-if="stats.topArtists.length > 0">
          <template #header>
            <h2 class="text-xl font-semibold text-zinc-100">Your Top Artists</h2>
          </template>

          <!-- Favorite Artist Spotlight -->
          <div v-if="stats.favoriteArtist" class="mb-6 p-4 rounded-lg bg-gradient-to-r from-teal-500/10 to-violet-500/10 border border-teal-500/30">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                <img
                  v-if="stats.favoriteArtist.avatarUrl"
                  :src="stats.favoriteArtist.avatarUrl"
                  :alt="stats.favoriteArtist.bandName"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-user" class="w-10 h-10 text-zinc-600" />
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm text-teal-400 font-medium mb-1">Your Favorite Artist</p>
                <NuxtLink
                  :to="`/${stats.favoriteArtist.bandSlug}`"
                  class="text-2xl font-bold text-zinc-100 hover:text-teal-400 block"
                >
                  {{ stats.favoriteArtist.bandName }}
                </NuxtLink>
                <p class="text-sm text-zinc-400 mt-1">
                  {{ stats.favoriteArtist.streamCount }} streams · {{ formatTime(stats.favoriteArtist.listeningSeconds) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-3xl font-bold text-teal-400">{{ stats.favoriteArtist.percentageOfTotal.toFixed(1) }}%</p>
                <p class="text-xs text-zinc-500">of listening</p>
              </div>
            </div>
          </div>

          <!-- Top 10 Artists Chart -->
          <StatsTopArtistsChart :artists="stats.topArtists" />
        </UCard>

        <!-- Top Tracks Section -->
        <UCard class="bg-zinc-900/50 border-zinc-800" v-if="stats.topTracks.length > 0">
          <template #header>
            <h2 class="text-xl font-semibold text-zinc-100">Your Top Tracks</h2>
          </template>

          <div class="space-y-2">
            <div
              v-for="(track, index) in stats.topTracks"
              :key="track.trackId"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <span class="text-lg font-bold text-zinc-500 w-6">{{ index + 1 }}</span>

              <div class="w-12 h-12 rounded bg-zinc-800 shrink-0 overflow-hidden">
                <img
                  v-if="track.coverUrl"
                  :src="track.coverUrl"
                  :alt="track.albumTitle"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-600" />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ track.trackTitle }}</p>
                <NuxtLink
                  :to="`/${track.artistSlug}`"
                  class="text-sm text-zinc-400 hover:text-teal-400 truncate block"
                >
                  {{ track.artistName }}
                </NuxtLink>
              </div>

              <div class="text-right shrink-0">
                <p class="text-sm font-medium text-fuchsia-400">{{ track.playCount }}x</p>
                <p class="text-xs text-zinc-500">{{ formatTime(track.listeningSeconds) }}</p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Top Genres Section -->
        <UCard class="bg-zinc-900/50 border-zinc-800" v-if="stats.topGenres.length > 0">
          <template #header>
            <h2 class="text-xl font-semibold text-zinc-100">Your Genres</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(genre, index) in stats.topGenres"
              :key="genre.genre"
              class="flex items-center gap-3 p-4 rounded-lg bg-zinc-800/50"
            >
              <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <span class="text-lg font-bold text-violet-400">{{ index + 1 }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ genre.genre }}</p>
                <p class="text-xs text-zinc-500">{{ genre.streamCount }} streams · {{ genre.artistCount }} artists</p>
              </div>
              <span class="text-sm font-medium text-violet-400">{{ genre.percentageOfTotal.toFixed(1) }}%</span>
            </div>
          </div>
        </UCard>

        <!-- Discovery & Fun Facts Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Discovery Stats -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <h2 class="text-xl font-semibold text-zinc-100">Discovery & Exploration</h2>
            </template>

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-zinc-100">{{ stats.newArtistsDiscovered }}</p>
                  <p class="text-sm text-zinc-400">New Artists Discovered</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-zinc-100">{{ stats.artistDiversity.toFixed(1) }}%</p>
                  <p class="text-sm text-zinc-400">Artist Diversity Score</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-zinc-100">{{ stats.repeatListenerScore.toFixed(1) }}%</p>
                  <p class="text-sm text-zinc-400">Repeat Listener Score</p>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Fun Facts -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <h2 class="text-xl font-semibold text-zinc-100">Your Listening Highlights</h2>
            </template>

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-fire" class="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-zinc-100">{{ stats.longestStreak }} days</p>
                  <p class="text-sm text-zinc-400">Longest Listening Streak</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-zinc-100">{{ stats.totalListeningDays }}</p>
                  <p class="text-sm text-zinc-400">Days with Listening</p>
                </div>
              </div>

              <div v-if="stats.topListeningDay.date" class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-star" class="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-zinc-100">{{ stats.topListeningDay.minutes }}min</p>
                  <p class="text-sm text-zinc-400">Top Day: {{ formatDate(stats.topListeningDay.date) }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore

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

interface TopTrack {
  trackId: string
  trackTitle: string
  artistName: string
  artistSlug: string
  albumTitle: string
  coverKey: string | null
  coverUrl: string | null
  playCount: number
  listeningSeconds: number
  percentageOfTotal: number
}

interface TopAlbum {
  albumId: string
  albumTitle: string
  artistName: string
  artistSlug: string
  coverKey: string | null
  coverUrl: string | null
  streamCount: number
  listeningSeconds: number
  percentageOfTotal: number
}

interface TopGenre {
  genre: string
  streamCount: number
  artistCount: number
  percentageOfTotal: number
}

interface ListeningStats {
  period: string
  periodLabel: string
  totalListeningSeconds: number
  totalStreams: number
  uniqueArtists: number
  uniqueTracks: number
  uniqueAlbums: number
  averageSessionDuration: number
  totalListeningDays: number
  longestStreak: number
  currentStreak: number
  mostActiveDay: string
  mostActiveHour: number
  listeningByHour: { hour: number; minutes: number }[]
  listeningByDayOfWeek: { day: string; minutes: number }[]
  listeningByMonth: { month: string; minutes: number }[]
  topArtists: TopArtist[]
  topTracks: TopTrack[]
  topAlbums: TopAlbum[]
  topGenres: TopGenre[]
  newArtistsDiscovered: number
  artistDiversity: number
  repeatListenerScore: number
  vsLastPeriod?: {
    listeningSecondsChange: number
    streamsChange: number
    newArtistsChange: number
  }
  topListeningDay: { date: string; minutes: number }
  favoriteArtist: TopArtist | null
  mostPlayedTrack: TopTrack | null
}

const selectedPeriod = ref<'this-year' | 'last-month' | 'all-time'>('this-year')

// Fetch stats using Nuxt's useLazyAsyncData
// server: false ensures this only runs on client (requires auth session)
const { data: stats, pending: loading, error: fetchError, refresh } = await useLazyAsyncData(
  'listening-stats',
  async () => {
    const data = await $fetch<ListeningStats>('/api/listener/stats', {
      query: { period: selectedPeriod.value },
    })

    // Get presigned URLs for images
    // Load artist avatars
    for (const artist of data.topArtists) {
      if (artist.avatarKey) {
        try {
          artist.avatarUrl = await getStreamUrl(artist.avatarKey)
        } catch (e) {
          console.error('Failed to load avatar for artist:', artist.bandId, e)
        }
      }
    }

    // Load album/track covers
    for (const track of data.topTracks) {
      if (track.coverKey) {
        try {
          track.coverUrl = await getStreamUrl(track.coverKey)
        } catch (e) {
          console.error('Failed to load cover for track:', track.trackId, e)
        }
      }
    }

    for (const album of data.topAlbums) {
      if (album.coverKey) {
        try {
          album.coverUrl = await getStreamUrl(album.coverKey)
        } catch (e) {
          console.error('Failed to load cover for album:', album.albumId, e)
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

const loadStats = () => refresh()

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const periodDescription = computed(() => {
  switch (selectedPeriod.value) {
    case 'this-year': return 'this year'
    case 'last-month': return 'last month'
    case 'all-time': return 'yet'
  }
})

const maxMinutesInHour = computed(() => {
  if (!stats.value?.listeningByHour) return 1
  return Math.max(...stats.value.listeningByHour.map(h => h.minutes), 1)
})

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
