<template>
  <div v-if="band" class="container mx-auto px-4 py-8">
    <!-- Pending Approval Banner -->
    <div v-if="band.status === 'pending'" class="mb-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 class="font-semibold text-orange-200">Profile Pending Approval</h3>
          <p class="text-sm text-orange-200/80 mt-1">
            Your artist profile is being reviewed by our team. You'll receive a notification once it's approved.
            Until then, your profile won't be visible to other users and you won't be able to upload music.
          </p>
        </div>
      </div>
    </div>

    <!-- Suspended Banner -->
    <div v-if="band.status === 'suspended'" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 class="font-semibold text-red-200">Profile Suspended</h3>
          <p class="text-sm text-red-200/80 mt-1">
            Your artist profile has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Back to Dashboard
        </NuxtLink>
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-16 h-16 rounded-xl overflow-hidden shrink-0"
            :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
          >
            <img
              v-if="band.avatar_url"
              :src="band.avatar_url"
              :alt="band.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <span class="text-2xl font-bold text-white">
                {{ band.name.charAt(0).toUpperCase() }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-zinc-100">{{ band.name }}</h1>
              <UBadge v-if="band.status === 'pending'" color="orange" variant="subtle" size="xs">
                Pending
              </UBadge>
              <UIcon
                v-if="band.is_verified"
                name="i-heroicons-check-badge"
                class="w-6 h-6 text-violet-400"
              />
            </div>
            <NuxtLink
              v-if="band.status === 'active'"
              :to="`/${band.slug}`"
              class="text-sm text-violet-400 hover:text-violet-300"
              target="_blank"
            >
              fairtune.fm/{{ band.slug }}
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 inline" />
            </NuxtLink>
            <span v-else class="text-sm text-zinc-500">
              fairtune.fm/{{ band.slug }} (not visible until approved)
            </span>
          </div>
        </div>
      </div>

      <UButton
        color="violet"
        :to="band.status === 'active' ? '/dashboard/artist/upload' : undefined"
        :disabled="band.status !== 'active'"
        :title="band.status !== 'active' ? 'You can upload music once your profile is approved' : ''"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Upload Music
      </UButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(band.total_streams || 0) }}</p>
          <p class="text-sm text-zinc-400">Total Streams</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-teal-400">${{ ((band.total_earnings_cents || 0) / 100).toFixed(2) }}</p>
          <p class="text-sm text-zinc-400">Total Earnings</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-zinc-100">{{ albums.length }}</p>
          <p class="text-sm text-zinc-400">Releases</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-3xl font-bold text-violet-400">{{ formatNumber(band.follower_count || 0) }}</p>
          <p class="text-sm text-zinc-400">Followers</p>
        </div>
      </UCard>
    </div>

    <!-- Tabs -->
    <PillTabs v-model="currentTab" :tabs="tabs">
      <template #releases>
        <DashboardArtistReleasesTab
          :albums="albums"
          :album-covers="albumCovers"
          :band-slug="band.slug || ''"
          :band-status="band.status || 'pending'"
          @delete-album="confirmDeleteAlbum"
        />
      </template>

      <template #analytics>
        <DashboardArtistAnalyticsTab
          :band-id="band.id"
          :album-covers="albumCovers"
        />
      </template>

      <template #earnings>
        <DashboardArtistEarningsTab :band-id="band.id" />
      </template>

      <template #sales>
        <DashboardArtistSalesTab :band-id="band.id" />
      </template>

      <template #settings>
        <DashboardArtistSettingsTab
          :band="band"
          @saved="handleBandSaved"
          @delete="confirmDelete"
        />
      </template>
    </PillTabs>

    <!-- Delete Artist Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Artist Profile</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ band.name }}</strong>? This will permanently delete all your releases, tracks, and analytics data.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deleting" @click="handleDelete">
              Delete Forever
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Delete Album Confirmation Modal -->
    <UModal v-model="showDeleteAlbumModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete Album</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ albumToDelete?.title }}</strong>? This will permanently delete the album and all its tracks.
        </p>
        <p class="text-red-400 text-sm mt-2">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteAlbumModal = false">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingAlbum" @click="handleDeleteAlbum">
              Delete Album
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>

  <!-- Loading State -->
  <div v-else-if="loading" class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-center py-24">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'
import type { Album } from '~/stores/album'
import { useArtistDashboard } from '~/composables/useArtistDashboard'
import { useArtistRealtime } from '~/composables/useArtistRealtime'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { toast, formatNumber } = useArtistDashboard()
const bandStore = useBandStore()
const { getBandById, deleteBand } = bandStore
const albumStore = useAlbumStore()
const { getBandAlbums, getStreamUrl, deleteAlbum } = albumStore
const { subscribeToAll, subscribeToAlbumTracks } = useArtistRealtime()

// Mutable state for albums (can be updated by realtime)
const albums = ref<Album[]>([])
const albumCovers = ref<Record<string, string>>({})

// Fetch band data using useLazyAsyncData
const { data: band, pending: loading, refresh: refreshBand } = await useLazyAsyncData(
  `dashboard-artist-${route.params.id}`,
  async () => {
    const id = route.params.id as string
    const bandData = await getBandById(id)

    if (!bandData) return null

    // Load avatar URL from key if available
    if (bandData.avatar_key) {
      try {
        bandData.avatar_url = await getStreamUrl(bandData.avatar_key)
      } catch (e) {
        console.error('Failed to load avatar:', e)
      }
    }

    // Load banner URL from key if available
    if (bandData.banner_key) {
      try {
        bandData.banner_url = await getStreamUrl(bandData.banner_key)
      } catch (e) {
        console.error('Failed to load banner:', e)
      }
    }

    return bandData
  },
  {
    server: false,
  }
)

// Load albums when band is available
watch(band, async (newBand) => {
  if (!newBand) return

  try {
    // Load albums (including unpublished drafts, no moderation filtering)
    albums.value = await getBandAlbums(newBand.id, true, false)

    // Load cover URLs
    for (const album of albums.value) {
      if (album.cover_key && !albumCovers.value[album.id]) {
        try {
          albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
        } catch (e) {
          console.error('Failed to load cover:', e)
        }
      }
    }

    // Subscribe to realtime updates
    subscribeToAll(newBand.id, {
      onStreamUpdate: reloadBandStats,
      onBandUpdate: reloadBandStats,
      onAlbumUpdate: reloadAlbums,
    })

    // Subscribe to track changes for each album (for moderation status updates)
    for (const album of albums.value) {
      subscribeToAlbumTracks(album.id, reloadAlbums)
    }
  } catch (e) {
    console.error('Failed to load albums:', e)
  }
}, { immediate: true })

// Delete artist state
const deleting = ref(false)
const showDeleteModal = ref(false)

// Album delete state
const showDeleteAlbumModal = ref(false)
const deletingAlbum = ref(false)
const albumToDelete = ref<Album | null>(null)

// Tab state
const tabs = [
  { label: 'Releases', slot: 'releases', icon: 'i-heroicons-musical-note' },
  { label: 'Analytics', slot: 'analytics', icon: 'i-heroicons-chart-bar' },
  { label: 'Earnings', slot: 'earnings', icon: 'i-heroicons-banknotes' },
  { label: 'Sales', slot: 'sales', icon: 'i-heroicons-shopping-bag' },
  { label: 'Settings', slot: 'settings', icon: 'i-heroicons-cog-6-tooth' },
]

const currentTab = ref(0)

const tabSlotToIndex: Record<string, number> = {
  'releases': 0,
  'analytics': 1,
  'earnings': 2,
  'sales': 3,
  'settings': 4,
}

watch(currentTab, (newTab) => {
  const tabName = tabs[newTab]?.slot
  if (tabName && route.query.tab !== tabName) {
    router.replace({ query: { ...route.query, tab: tabName } })
  }
})

const initTabFromUrl = () => {
  const tabParam = route.query.tab as string
  if (tabParam && tabSlotToIndex[tabParam] !== undefined) {
    currentTab.value = tabSlotToIndex[tabParam]
  }
}

// Band saved handler
const handleBandSaved = (updatedBand: Band) => {
  band.value = updatedBand
}

// Delete artist functions
const confirmDelete = () => {
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!band.value) return

  deleting.value = true
  try {
    await deleteBand(band.value.id)
    toast.add({ title: 'Artist profile deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    router.push('/dashboard')
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete artist profile', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

// Reload band stats (for realtime updates)
const reloadBandStats = async () => {
  await refreshBand()
}

// Reload albums (for realtime updates on moderation status)
const reloadAlbums = async () => {
  if (!band.value) return
  try {
    albums.value = await getBandAlbums(band.value.id, true, false)
    // Reload cover URLs for any new albums
    for (const albumItem of albums.value) {
      if (albumItem.cover_key && !albumCovers.value[albumItem.id]) {
        try {
          albumCovers.value[albumItem.id] = await getStreamUrl(albumItem.cover_key)
        } catch (e) {
          console.error('Failed to load cover:', e)
        }
      }
    }
  } catch (e) {
    console.error('Failed to reload albums:', e)
  }
}

// Album delete functions
const confirmDeleteAlbum = (album: Album) => {
  albumToDelete.value = album
  showDeleteAlbumModal.value = true
}

const handleDeleteAlbum = async () => {
  if (!albumToDelete.value) return

  deletingAlbum.value = true
  try {
    await deleteAlbum(albumToDelete.value.id)
    albums.value = albums.value.filter(a => a.id !== albumToDelete.value!.id)
    toast.add({ title: 'Album deleted', color: 'green', icon: 'i-heroicons-check-circle' })
    showDeleteAlbumModal.value = false
  } catch (e: any) {
    toast.add({ title: 'Delete failed', description: e.message || 'Failed to delete album', color: 'red', icon: 'i-heroicons-exclamation-triangle' })
  } finally {
    deletingAlbum.value = false
  }
}

// Handle URL query params on mount
onMounted(() => {
  initTabFromUrl()

  // Check for Stripe Connect return
  if (route.query.connected === 'true') {
    toast.add({
      title: 'Stripe Connected',
      description: 'Your payout account is being set up. It may take a moment to verify.',
      icon: 'i-heroicons-check-circle',
      color: 'green',
    })
    router.replace({ query: { ...route.query, connected: undefined, tab: 'earnings' } })
  }

  if (route.query.refresh === 'true') {
    router.replace({ query: { ...route.query, refresh: undefined, tab: 'earnings' } })
  }
})
</script>
