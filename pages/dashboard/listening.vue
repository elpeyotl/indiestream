<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        Back to Dashboard
      </NuxtLink>
      <h1 class="text-3xl font-bold text-zinc-100">Your Listening</h1>
      <p class="text-zinc-400 mt-1">Track your music journey and see which artists you've supported</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ formatHours(stats.totalSeconds) }}</p>
          <p class="text-sm text-zinc-400">Hours Listened</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">{{ stats.totalStreams }}</p>
          <p class="text-sm text-zinc-400">Total Streams</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-teal-400">{{ stats.uniqueTracks }}</p>
          <p class="text-sm text-zinc-400">Unique Tracks</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-fuchsia-400">{{ stats.uniqueArtists }}</p>
          <p class="text-sm text-zinc-400">Artists Supported</p>
        </div>
      </UCard>
    </div>

    <!-- Time Filter -->
    <div class="flex gap-2 mb-6">
      <UButton
        v-for="period in timePeriods"
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
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>

    <template v-else>
      <!-- Recent Listening History -->
      <UCard class="bg-zinc-900/50 border-zinc-800 mb-8">
        <template #header>
          <h2 class="text-lg font-semibold text-zinc-100">Recent Listening</h2>
        </template>

        <div v-if="history.length === 0" class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-violet-400" />
          </div>
          <h3 class="text-lg font-semibold text-zinc-100 mb-2">No listening history yet</h3>
          <p class="text-zinc-400 mb-6">Start listening to music to see your history here.</p>
          <UButton color="violet" to="/discover">
            Discover Music
          </UButton>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in history"
            :key="item.id"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <!-- Track Info -->
            <div class="w-12 h-12 rounded-lg bg-zinc-800 shrink-0 overflow-hidden">
              <img
                v-if="item.cover_url"
                :src="item.cover_url"
                :alt="item.track_title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-600" />
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium text-zinc-100 truncate">{{ item.track_title }}</p>
              <p class="text-sm text-zinc-400 truncate">{{ item.artist_name }}</p>
            </div>

            <!-- Listened Duration -->
            <div class="text-right">
              <p class="text-sm text-zinc-400">{{ formatDuration(item.duration_seconds) }}</p>
              <p class="text-xs text-zinc-500">{{ formatRelativeTime(item.listened_at) }}</p>
            </div>

            <!-- Stream Badge -->
            <UBadge v-if="item.completed" color="teal" variant="soft" size="xs">
              <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
              Stream
            </UBadge>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="mt-4 text-center">
          <UButton color="gray" variant="ghost" :loading="loadingMore" @click="loadMore">
            Load More
          </UButton>
        </div>
      </UCard>

      <!-- Top Artists -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <h2 class="text-lg font-semibold text-zinc-100">Top Artists</h2>
          </template>

          <div v-if="topArtists.length === 0" class="text-center py-8 text-zinc-400">
            <p>Listen to more music to see your top artists</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(artist, index) in topArtists"
              :key="artist.band_id"
              class="flex items-center gap-3"
            >
              <span class="text-lg font-bold text-zinc-500 w-6">{{ index + 1 }}</span>
              <div class="flex-1 min-w-0">
                <NuxtLink
                  :to="`/${artist.artist_slug}`"
                  class="font-medium text-zinc-100 hover:text-violet-400 truncate block"
                >
                  {{ artist.artist_name }}
                </NuxtLink>
                <p class="text-xs text-zinc-500">{{ artist.stream_count }} streams</p>
              </div>
              <p class="text-sm text-zinc-400">{{ formatHours(artist.total_seconds) }}h</p>
            </div>
          </div>
        </UCard>

        <UCard class="bg-zinc-900/50 border-zinc-800">
          <template #header>
            <h2 class="text-lg font-semibold text-zinc-100">Top Tracks</h2>
          </template>

          <div v-if="topTracks.length === 0" class="text-center py-8 text-zinc-400">
            <p>Listen to more music to see your top tracks</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(track, index) in topTracks"
              :key="track.track_id"
              class="flex items-center gap-3"
            >
              <span class="text-lg font-bold text-zinc-500 w-6">{{ index + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ track.track_title }}</p>
                <p class="text-xs text-zinc-500">{{ track.artist_name }}</p>
              </div>
              <p class="text-sm text-zinc-400">{{ track.play_count }}x</p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const client = useSupabaseClient()
const { getStreamUrl } = useAlbum()

interface ListeningItem {
  id: string
  track_id: string
  track_title: string
  artist_name: string
  artist_slug: string
  cover_url: string | null
  cover_key?: string | null
  duration_seconds: number
  completed: boolean
  listened_at: string
}

interface TopArtist {
  band_id: string
  artist_name: string
  artist_slug: string
  stream_count: number
  total_seconds: number
}

interface TopTrack {
  track_id: string
  track_title: string
  artist_name: string
  play_count: number
}

const loading = ref(true)
const loadingMore = ref(false)
const history = ref<ListeningItem[]>([])
const topArtists = ref<TopArtist[]>([])
const topTracks = ref<TopTrack[]>([])
const hasMore = ref(false)
const page = ref(0)
const pageSize = 20

const selectedPeriod = ref('all')
const timePeriods = [
  { label: 'All Time', value: 'all' },
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' },
  { label: 'Today', value: 'today' },
]

const stats = ref({
  totalSeconds: 0,
  totalStreams: 0,
  uniqueTracks: 0,
  uniqueArtists: 0,
})

const getPeriodStart = (): string | null => {
  const now = new Date()
  switch (selectedPeriod.value) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    case 'week':
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return weekAgo.toISOString()
    case 'month':
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return monthAgo.toISOString()
    default:
      return null
  }
}

const loadHistory = async (reset = false) => {
  if (reset) {
    page.value = 0
    history.value = []
  }

  const periodStart = getPeriodStart()

  let query = client
    .from('listening_history')
    .select(`
      id,
      track_id,
      duration_seconds,
      completed,
      listened_at,
      tracks!inner (
        title,
        albums!inner (
          cover_key,
          bands!inner (
            name,
            slug
          )
        )
      )
    `)
    .order('listened_at', { ascending: false })
    .range(page.value * pageSize, (page.value + 1) * pageSize - 1)

  if (periodStart) {
    query = query.gte('listened_at', periodStart)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to load history:', error)
    return
  }

  const items: ListeningItem[] = (data || []).map((item: any) => ({
    id: item.id,
    track_id: item.track_id,
    track_title: item.tracks?.title || 'Unknown Track',
    artist_name: item.tracks?.albums?.bands?.name || 'Unknown Artist',
    artist_slug: item.tracks?.albums?.bands?.slug || '',
    cover_url: null,
    cover_key: item.tracks?.albums?.cover_key || null,
    duration_seconds: item.duration_seconds,
    completed: item.completed,
    listened_at: item.listened_at,
  }))

  history.value = reset ? items : [...history.value, ...items]
  hasMore.value = items.length === pageSize

  // Load cover URLs for items with cover keys
  for (const item of items) {
    if (item.cover_key) {
      try {
        item.cover_url = await getStreamUrl(item.cover_key)
      } catch (e) {
        console.error('Failed to load cover:', e)
      }
    }
  }
}

const loadStats = async () => {
  const periodStart = getPeriodStart()

  // Total listening time and streams
  let query = client
    .from('listening_history')
    .select('duration_seconds, completed, track_id, band_id')

  if (periodStart) {
    query = query.gte('listened_at', periodStart)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to load stats:', error)
    return
  }

  if (data) {
    stats.value.totalSeconds = data.reduce((sum, item) => sum + (item.duration_seconds || 0), 0)
    stats.value.totalStreams = data.filter(item => item.completed).length
    stats.value.uniqueTracks = new Set(data.map(item => item.track_id)).size
    stats.value.uniqueArtists = new Set(data.map(item => item.band_id)).size
  }
}

const loadTopArtists = async () => {
  const periodStart = getPeriodStart()

  let query = client
    .from('listening_history')
    .select(`
      band_id,
      duration_seconds,
      completed,
      bands!inner (
        name,
        slug
      )
    `)

  if (periodStart) {
    query = query.gte('listened_at', periodStart)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to load top artists:', error)
    return
  }

  // Aggregate by artist
  const artistMap = new Map<string, TopArtist>()
  for (const item of data || []) {
    const existing = artistMap.get(item.band_id)
    if (existing) {
      existing.stream_count += item.completed ? 1 : 0
      existing.total_seconds += item.duration_seconds || 0
    } else {
      artistMap.set(item.band_id, {
        band_id: item.band_id,
        artist_name: (item.bands as any)?.name || 'Unknown',
        artist_slug: (item.bands as any)?.slug || '',
        stream_count: item.completed ? 1 : 0,
        total_seconds: item.duration_seconds || 0,
      })
    }
  }

  topArtists.value = Array.from(artistMap.values())
    .sort((a, b) => b.stream_count - a.stream_count)
    .slice(0, 5)
}

const loadTopTracks = async () => {
  const periodStart = getPeriodStart()

  let query = client
    .from('listening_history')
    .select(`
      track_id,
      tracks!inner (
        title,
        albums!inner (
          bands!inner (
            name
          )
        )
      )
    `)

  if (periodStart) {
    query = query.gte('listened_at', periodStart)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to load top tracks:', error)
    return
  }

  // Aggregate by track
  const trackMap = new Map<string, TopTrack>()
  for (const item of data || []) {
    const existing = trackMap.get(item.track_id)
    if (existing) {
      existing.play_count += 1
    } else {
      trackMap.set(item.track_id, {
        track_id: item.track_id,
        track_title: (item.tracks as any)?.title || 'Unknown',
        artist_name: (item.tracks as any)?.albums?.bands?.name || 'Unknown',
        play_count: 1,
      })
    }
  }

  topTracks.value = Array.from(trackMap.values())
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, 5)
}

const loadMore = async () => {
  loadingMore.value = true
  page.value += 1
  await loadHistory()
  loadingMore.value = false
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([
    loadHistory(true),
    loadStats(),
    loadTopArtists(),
    loadTopTracks(),
  ])
  loading.value = false
}

// Format helpers
const formatHours = (seconds: number): string => {
  const hours = seconds / 3600
  if (hours < 1) {
    return (seconds / 60).toFixed(0) + 'm'
  }
  return hours.toFixed(1)
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatRelativeTime = (date: string): string => {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

// Watch for period changes
watch(selectedPeriod, () => {
  loadAll()
})

onMounted(() => {
  loadAll()
})
</script>
