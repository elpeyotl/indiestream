<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-zinc-100 mb-2">Admin Dashboard</h1>
      <p class="text-zinc-400">Platform administration and management</p>
    </div>

    <!-- Tabs -->
    <PillTabs v-model="currentTab" :tabs="tabs">
      <template #overview>
        <AdminOverviewTab />
      </template>

      <template #moderation>
        <AdminTrackModerationTab
          @update-pending-count="() => refreshPendingCounts()"
        />
      </template>

      <template #artist-approvals>
        <AdminArtistApprovalsTab
          @update-pending-count="() => refreshPendingCounts()"
        />
      </template>

      <template #reports>
        <AdminContentReportsTab
          @update-pending-count="() => refreshPendingCounts()"
        />
      </template>

      <template #dmca>
        <AdminDmcaRequestsTab
          @update-pending-count="() => refreshPendingCounts()"
        />
      </template>

      <template #users>
        <AdminUsersTab />
      </template>

      <template #artists>
        <AdminArtistsTab @stats-updated="refreshStats" />
      </template>

      <template #albums>
        <AdminAlbumsTab @stats-updated="refreshStats" />
      </template>

      <template #playlists>
        <AdminPlaylistsTab />
      </template>

      <template #featured-genres>
        <AdminFeaturedGenresTab />
      </template>

      <template #revenue>
        <AdminRevenueTab />
      </template>

      <template #payouts>
        <AdminPayoutsTab />
      </template>

      <template #pro-export>
        <AdminProExportTab />
      </template>
    </PillTabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const currentTab = ref(0)

// Map tab query param to tab index
const tabSlotToIndex: Record<string, number> = {
  'overview': 0,
  'moderation': 1,
  'artist-approvals': 2,
  'reports': 3,
  'dmca': 4,
  'users': 5,
  'artists': 6,
  'albums': 7,
  'playlists': 8,
  'featured-genres': 9,
  'revenue': 10,
  'payouts': 11,
  'pro-export': 12,
}

// Initialize tab from URL query param
const initTabFromUrl = () => {
  const tabParam = route.query.tab as string
  if (tabParam && tabSlotToIndex[tabParam] !== undefined) {
    currentTab.value = tabSlotToIndex[tabParam]
  }
}

// Fetch pending counts using useLazyFetch
const { data: pendingCounts, refresh: refreshPendingCounts } = await useLazyFetch<{
  moderation: number
  artists: number
  reports: number
  dmca: number
}>('/api/admin/pending-counts', {
  server: false,
  default: () => ({ moderation: 0, artists: 0, reports: 0, dmca: 0 }),
})

// Computed badge counts from fetched data
const pendingModerationCount = computed(() => pendingCounts.value?.moderation ?? 0)
const pendingArtistCount = computed(() => pendingCounts.value?.artists ?? 0)
const pendingReportsCount = computed(() => pendingCounts.value?.reports ?? 0)
const pendingDmcaCount = computed(() => pendingCounts.value?.dmca ?? 0)

// Init tab from URL on mount
onMounted(() => {
  initTabFromUrl()
})

const tabs = computed(() => [
  { label: 'Overview', slot: 'overview', icon: 'i-heroicons-chart-bar' },
  {
    label: 'Track Moderation',
    slot: 'moderation',
    icon: 'i-heroicons-shield-check',
    badge: pendingModerationCount.value > 0 ? pendingModerationCount.value : undefined,
  },
  {
    label: 'Artist Approvals',
    slot: 'artist-approvals',
    icon: 'i-heroicons-user-plus',
    badge: pendingArtistCount.value > 0 ? pendingArtistCount.value : undefined,
  },
  {
    label: 'Content Reports',
    slot: 'reports',
    icon: 'i-heroicons-flag',
    badge: pendingReportsCount.value > 0 ? pendingReportsCount.value : undefined,
  },
  {
    label: 'DMCA Requests',
    slot: 'dmca',
    icon: 'i-heroicons-shield-exclamation',
    badge: pendingDmcaCount.value > 0 ? pendingDmcaCount.value : undefined,
  },
  { label: 'Users', slot: 'users', icon: 'i-heroicons-users' },
  { label: 'Artists', slot: 'artists', icon: 'i-heroicons-musical-note' },
  { label: 'Albums', slot: 'albums', icon: 'i-heroicons-square-3-stack-3d' },
  { label: 'Playlists', slot: 'playlists', icon: 'i-heroicons-queue-list' },
  { label: 'Featured Genres', slot: 'featured-genres', icon: 'i-heroicons-tag' },
  { label: 'Revenue', slot: 'revenue', icon: 'i-heroicons-currency-dollar' },
  { label: 'Payouts', slot: 'payouts', icon: 'i-heroicons-banknotes' },
  { label: 'PRO Export', slot: 'pro-export', icon: 'i-heroicons-document-arrow-down' },
])

// Placeholder for refreshing stats when data changes
const refreshStats = () => {
  // The overview tab handles its own stats loading
  // This is available for future use if cross-tab communication is needed
}
</script>
