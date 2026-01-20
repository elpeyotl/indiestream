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
          @update-pending-count="pendingModerationCount = $event"
        />
      </template>

      <template #artist-approvals>
        <AdminArtistApprovalsTab
          @update-pending-count="pendingArtistCount = $event"
        />
      </template>

      <template #reports>
        <AdminContentReportsTab
          @update-pending-count="pendingReportsCount = $event"
        />
      </template>

      <template #dmca>
        <AdminDmcaRequestsTab
          @update-pending-count="pendingDmcaCount = $event"
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
  'revenue': 9,
  'payouts': 10,
  'pro-export': 11,
}

// Initialize tab from URL query param
const initTabFromUrl = () => {
  const tabParam = route.query.tab as string
  if (tabParam && tabSlotToIndex[tabParam] !== undefined) {
    currentTab.value = tabSlotToIndex[tabParam]
  }
}

// Badge counts for tabs
const pendingModerationCount = ref(0)
const pendingArtistCount = ref(0)
const pendingReportsCount = ref(0)
const pendingDmcaCount = ref(0)

// Fetch pending counts on page load (before tabs are clicked)
const fetchPendingCounts = async () => {
  try {
    const counts = await $fetch<{
      moderation: number
      artists: number
      reports: number
      dmca: number
    }>('/api/admin/pending-counts')

    pendingModerationCount.value = counts.moderation
    pendingArtistCount.value = counts.artists
    pendingReportsCount.value = counts.reports
    pendingDmcaCount.value = counts.dmca
  } catch (e) {
    console.error('Failed to fetch pending counts:', e)
  }
}

// Fetch counts and init tab on mount
onMounted(() => {
  initTabFromUrl()
  fetchPendingCounts()
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
