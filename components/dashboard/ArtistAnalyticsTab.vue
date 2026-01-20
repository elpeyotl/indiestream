<template>
  <div class="py-6 space-y-6">
    <!-- Time Period Filter -->
    <div class="flex gap-2">
      <UButton
        v-for="period in analyticsPeriods"
        :key="period.value"
        :color="selectedPeriod === period.value ? 'violet' : 'gray'"
        :variant="selectedPeriod === period.value ? 'solid' : 'ghost'"
        size="sm"
        @click="selectedPeriod = period.value"
      >
        {{ period.label }}
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="analyticsLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Empty State -->
      <div v-if="analytics.totalStreams === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No streams yet. Share your music to start getting plays!</p>
      </div>

      <template v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="text-center">
              <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(analytics.totalStreams) }}</p>
              <p class="text-sm text-zinc-400">Total Streams</p>
            </div>
          </UCard>
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="text-center">
              <p class="text-3xl font-bold text-violet-400">{{ formatNumber(analytics.uniqueListeners) }}</p>
              <p class="text-sm text-zinc-400">Unique Listeners</p>
            </div>
          </UCard>
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="text-center">
              <p class="text-3xl font-bold text-teal-400">{{ formatListeningTime(analytics.totalSeconds) }}</p>
              <p class="text-sm text-zinc-400">Listening Time</p>
            </div>
          </UCard>
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div class="text-center">
              <p class="text-3xl font-bold text-fuchsia-400">{{ analytics.completionRate }}%</p>
              <p class="text-sm text-zinc-400">Completion Rate</p>
            </div>
          </UCard>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Streams Over Time -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <h3 class="text-lg font-semibold text-zinc-100">Streams Over Time</h3>
            </template>
            <div class="h-48">
              <div class="flex items-end justify-between h-full gap-1">
                <div
                  v-for="(day, index) in analytics.streamsByDay"
                  :key="index"
                  class="flex-1 bg-violet-500/80 rounded-t transition-all hover:bg-violet-400"
                  :style="{ height: `${getBarHeight(day.count)}%` }"
                  :title="`${day.date}: ${day.count} streams`"
                />
              </div>
              <div class="flex justify-between mt-2 text-xs text-zinc-500">
                <span>{{ analytics.streamsByDay[0]?.date || '' }}</span>
                <span>{{ analytics.streamsByDay[analytics.streamsByDay.length - 1]?.date || '' }}</span>
              </div>
            </div>
          </UCard>

          <!-- Top Tracks -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <h3 class="text-lg font-semibold text-zinc-100">Top Tracks</h3>
            </template>
            <div v-if="analytics.topTracks.length === 0" class="text-center py-8 text-zinc-500">
              No track data yet
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(track, index) in analytics.topTracks"
                :key="track.track_id"
                class="flex items-center gap-3"
              >
                <span class="text-lg font-bold text-zinc-500 w-6">{{ index + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-zinc-100 truncate">{{ track.title }}</p>
                  <div class="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                    <div
                      class="bg-violet-500 h-1.5 rounded-full"
                      :style="{ width: `${getTrackBarWidth(track.play_count)}%` }"
                    />
                  </div>
                </div>
                <span class="text-sm text-zinc-400">{{ track.play_count }}</span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Charts Row 2: Album Performance & Listener Locations -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Albums -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <h3 class="text-lg font-semibold text-zinc-100">Album Performance</h3>
            </template>
            <div v-if="analytics.albumStats.length === 0" class="text-center py-8 text-zinc-500">
              No album data yet
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="album in analytics.albumStats.slice(0, 5)"
                :key="album.album_id"
                class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
              >
                <div class="w-12 h-12 rounded-lg bg-zinc-700 shrink-0 overflow-hidden">
                  <img
                    v-if="albumCovers[album.album_id]"
                    :src="albumCovers[album.album_id]"
                    :alt="album.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-500" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-zinc-100 truncate">{{ album.title }}</p>
                  <div class="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                    <div
                      class="bg-fuchsia-500 h-1.5 rounded-full"
                      :style="{ width: `${getAlbumBarWidth(album.stream_count)}%` }"
                    />
                  </div>
                </div>
                <span class="text-sm text-zinc-400">{{ album.stream_count }}</span>
              </div>
            </div>
          </UCard>

          <!-- Listener Locations -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <template #header>
              <h3 class="text-lg font-semibold text-zinc-100">Listener Locations</h3>
            </template>
            <div v-if="countryAnalyticsLoading" class="flex items-center justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
            </div>
            <div v-else-if="countryAnalytics.length === 0" class="text-center py-8 text-zinc-500">
              <UIcon name="i-heroicons-globe-alt" class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No location data yet</p>
              <p class="text-xs mt-1">Location tracking requires recent streams</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="country in countryAnalytics.slice(0, 8)"
                :key="country.country_code"
                class="flex items-center gap-3"
              >
                <span class="text-xl">{{ getCountryFlag(country.country_code) }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-zinc-100">{{ getCountryName(country.country_code) }}</span>
                    <span class="text-xs text-zinc-400">{{ country.stream_count }} streams</span>
                  </div>
                  <div class="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      class="bg-teal-500 h-1.5 rounded-full"
                      :style="{ width: `${getCountryBarWidth(country.stream_count)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useArtistDashboard } from '~/composables/useArtistDashboard'
import { useArtistRealtime } from '~/composables/useArtistRealtime'

interface AnalyticsData {
  totalStreams: number
  uniqueListeners: number
  totalSeconds: number
  completionRate: number
  topTracks: { track_id: string; title: string; play_count: number }[]
  albumStats: { album_id: string; title: string; stream_count: number }[]
  streamsByDay: { date: string; count: number }[]
}

interface CountryData {
  country_code: string
  stream_count: number
  total_duration: number
}

const props = defineProps<{
  bandId: string
  albumCovers: Record<string, string>
}>()

const client = useSupabaseClient()
const { formatNumber, formatListeningTime, getCountryFlag, getCountryName } = useArtistDashboard()
const { subscribe } = useArtistRealtime()

// State
const analyticsLoading = ref(false)
const countryAnalyticsLoading = ref(false)
const selectedPeriod = ref('30d')
const countryAnalytics = ref<CountryData[]>([])

const analyticsPeriods = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]

const analytics = ref<AnalyticsData>({
  totalStreams: 0,
  uniqueListeners: 0,
  totalSeconds: 0,
  completionRate: 0,
  topTracks: [],
  albumStats: [],
  streamsByDay: [],
})

// Chart helpers
const getBarHeight = (count: number): number => {
  const maxCount = Math.max(...analytics.value.streamsByDay.map(d => d.count), 1)
  return Math.max((count / maxCount) * 100, 2)
}

const getTrackBarWidth = (playCount: number): number => {
  const maxCount = Math.max(...analytics.value.topTracks.map(t => t.play_count), 1)
  return (playCount / maxCount) * 100
}

const getAlbumBarWidth = (streamCount: number): number => {
  const maxCount = Math.max(...analytics.value.albumStats.map(a => a.stream_count), 1)
  return (streamCount / maxCount) * 100
}

const getCountryBarWidth = (streamCount: number): number => {
  const maxCount = Math.max(...countryAnalytics.value.map(c => c.stream_count), 1)
  return (streamCount / maxCount) * 100
}

const getAnalyticsPeriodStart = (): string | null => {
  const now = new Date()
  switch (selectedPeriod.value) {
    case '7d':
      const week = new Date(now)
      week.setDate(week.getDate() - 7)
      return week.toISOString()
    case '30d':
      const month = new Date(now)
      month.setDate(month.getDate() - 30)
      return month.toISOString()
    case '90d':
      const quarter = new Date(now)
      quarter.setDate(quarter.getDate() - 90)
      return quarter.toISOString()
    default:
      return null
  }
}

const loadCountryAnalytics = async () => {
  countryAnalyticsLoading.value = true
  try {
    const days = selectedPeriod.value === '7d' ? 7
      : selectedPeriod.value === '30d' ? 30
      : selectedPeriod.value === '90d' ? 90
      : 365 * 10 // "all time" = 10 years

    const data = await $fetch<CountryData[]>('/api/analytics/countries', {
      query: {
        bandId: props.bandId,
        days,
      },
    })
    countryAnalytics.value = data || []
  } catch (e) {
    console.error('Failed to load country analytics:', e)
    countryAnalytics.value = []
  } finally {
    countryAnalyticsLoading.value = false
  }
}

interface ListeningHistoryItem {
  id: string
  user_id: string
  track_id: string
  duration_seconds: number
  completed: boolean
  listened_at: string
  tracks: {
    id: string
    title: string
    album_id: string
    albums: {
      id: string
      title: string
      band_id: string
    }
  }
}

const loadAnalytics = async () => {
  analyticsLoading.value = true

  try {
    const periodStart = getAnalyticsPeriodStart()

    // Query listening history for this band
    let query = client
      .from('listening_history')
      .select(`
        id,
        user_id,
        track_id,
        duration_seconds,
        completed,
        listened_at,
        tracks!inner (
          id,
          title,
          album_id,
          albums!inner (
            id,
            title,
            band_id
          )
        )
      `)
      .eq('band_id', props.bandId)

    if (periodStart) {
      query = query.gte('listened_at', periodStart)
    }

    const { data, error } = await query as { data: ListeningHistoryItem[] | null, error: any }

    if (error) {
      console.error('Failed to load analytics:', error)
      return
    }

    if (!data || data.length === 0) {
      analytics.value = {
        totalStreams: 0,
        uniqueListeners: 0,
        totalSeconds: 0,
        completionRate: 0,
        topTracks: [],
        albumStats: [],
        streamsByDay: [],
      }
      return
    }

    // Calculate stats
    const completedStreams = data.filter(d => d.completed)
    analytics.value.totalStreams = completedStreams.length
    analytics.value.uniqueListeners = new Set(data.map(d => d.user_id)).size
    analytics.value.totalSeconds = data.reduce((sum, d) => sum + (d.duration_seconds || 0), 0)
    analytics.value.completionRate = data.length > 0
      ? Math.round((completedStreams.length / data.length) * 100)
      : 0

    // Top tracks
    const trackCounts = new Map<string, { title: string; count: number }>()
    for (const item of data) {
      const trackId = item.track_id
      const title = (item.tracks as any)?.title || 'Unknown'
      const existing = trackCounts.get(trackId)
      if (existing) {
        existing.count++
      } else {
        trackCounts.set(trackId, { title, count: 1 })
      }
    }
    analytics.value.topTracks = Array.from(trackCounts.entries())
      .map(([track_id, { title, count }]) => ({ track_id, title, play_count: count }))
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 5)

    // Album stats
    const albumCounts = new Map<string, { title: string; count: number }>()
    for (const item of data) {
      const albumId = (item.tracks as any)?.album_id
      const title = (item.tracks as any)?.albums?.title || 'Unknown'
      if (albumId) {
        const existing = albumCounts.get(albumId)
        if (existing) {
          existing.count++
        } else {
          albumCounts.set(albumId, { title, count: 1 })
        }
      }
    }
    analytics.value.albumStats = Array.from(albumCounts.entries())
      .map(([album_id, { title, count }]) => ({ album_id, title, stream_count: count }))
      .sort((a, b) => b.stream_count - a.stream_count)

    // Streams by day
    const dayMap = new Map<string, number>()
    const daysToShow = selectedPeriod.value === '7d' ? 7 : selectedPeriod.value === '30d' ? 30 : 90

    // Initialize all days with 0
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dayMap.set(dateStr, 0)
    }

    // Count streams per day
    for (const item of data) {
      if (item.completed) {
        const dateStr = item.listened_at.split('T')[0]
        if (dayMap.has(dateStr)) {
          dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1)
        }
      }
    }

    analytics.value.streamsByDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }))
  } catch (e) {
    console.error('Failed to load analytics:', e)
  } finally {
    analyticsLoading.value = false
  }
}

// Watch for period changes
watch(selectedPeriod, () => {
  loadAnalytics()
  loadCountryAnalytics()
})

onMounted(() => {
  loadAnalytics()
  loadCountryAnalytics()

  // Subscribe to realtime stream updates
  // When new streams come in, refresh analytics data
  subscribe({
    table: 'listening_history',
    bandId: props.bandId,
    onUpdate: () => {
      loadAnalytics()
      loadCountryAnalytics()
    },
    debounce: 3000, // Debounce 3s since streams can be frequent
  })
})
</script>
