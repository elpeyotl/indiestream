<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-zinc-100 mb-2">Admin Dashboard</h1>
      <p class="text-zinc-400">Platform administration and management</p>
    </div>

    <!-- Tabs -->
    <UTabs
      v-model="currentTab"
      :items="tabs"
      class="w-full"
      :ui="{
        list: {
          background: 'bg-zinc-900/50',
          marker: {
            background: 'bg-violet-500/20',
          },
          tab: {
            active: 'text-violet-400',
            inactive: 'text-zinc-400 hover:text-zinc-200',
          },
        },
      }"
    >
      <!-- Overview Tab -->
      <template #overview>
        <div class="py-6 space-y-6">
          <!-- Platform Stats -->
          <div v-if="statsLoading" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-zinc-100">{{ formatNumber(stats.totalStreams) }}</p>
                <p class="text-sm text-zinc-400">Total Streams</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-violet-400">{{ stats.totalArtists }}</p>
                <p class="text-sm text-zinc-400">Artists</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-teal-400">{{ stats.totalTracks }}</p>
                <p class="text-sm text-zinc-400">Tracks</p>
              </div>
            </UCard>
            <UCard class="bg-zinc-900/50 border-zinc-800">
              <div class="text-center">
                <p class="text-3xl font-bold text-fuchsia-400">{{ stats.totalUsers }}</p>
                <p class="text-sm text-zinc-400">Users</p>
              </div>
            </UCard>
          </div>

        </div>
      </template>

      <!-- Users Tab -->
      <template #users>
        <div class="py-6 space-y-6">
          <!-- Search and Filters -->
          <div class="flex gap-4">
            <UInput
              v-model="userSearch"
              placeholder="Search by email or name..."
              size="lg"
              class="flex-1"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
              </template>
            </UInput>
            <UButton color="gray" @click="loadUsers">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Users Table -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <div v-if="usersLoading" class="flex justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>

            <div v-else-if="users.length === 0" class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-users" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">User</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Role</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Stats</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Joined</th>
                    <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="u in users"
                    :key="u.id"
                    class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td class="py-3 px-4">
                      <div>
                        <p class="font-medium text-zinc-100">{{ u.display_name || 'No name' }}</p>
                        <p class="text-sm text-zinc-400">{{ u.email }}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <USelect
                        :model-value="u.role"
                        :options="roleOptions"
                        size="sm"
                        :disabled="u.id === currentUserId"
                        @update:model-value="(val) => updateUserRole(u.id, val)"
                      />
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-sm">
                        <span class="text-zinc-400">{{ u.band_count }} bands</span>
                        <span class="text-zinc-600 mx-1">|</span>
                        <span class="text-zinc-400">{{ u.stream_count }} streams</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-sm text-zinc-400">
                      {{ formatDate(u.created_at) }}
                    </td>
                    <td class="py-3 px-4 text-right">
                      <UButton
                        color="red"
                        variant="ghost"
                        size="xs"
                        :disabled="u.id === currentUserId"
                        @click="confirmDeleteUser(u)"
                      >
                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                      </UButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="usersPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
              <p class="text-sm text-zinc-400">
                Showing {{ (usersPagination.page - 1) * usersPagination.limit + 1 }} - {{ Math.min(usersPagination.page * usersPagination.limit, usersPagination.total) }} of {{ usersPagination.total }}
              </p>
              <div class="flex gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="usersPagination.page <= 1"
                  @click="loadUsers(usersPagination.page - 1)"
                >
                  Previous
                </UButton>
                <UButton
                  color="gray"
                  variant="ghost"
                  size="sm"
                  :disabled="usersPagination.page >= usersPagination.totalPages"
                  @click="loadUsers(usersPagination.page + 1)"
                >
                  Next
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Payouts Tab -->
      <template #payouts>
        <div class="py-6 space-y-6">
          <!-- Period Selector -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">Calculate Artist Payouts</h3>
            <div class="flex flex-wrap items-end gap-4">
              <UFormGroup label="Month">
                <USelectMenu
                  v-model="payoutMonth"
                  :options="monthOptions"
                  value-attribute="value"
                  option-attribute="label"
                  class="w-40"
                />
              </UFormGroup>
              <UFormGroup label="Year">
                <USelectMenu
                  v-model="payoutYear"
                  :options="yearOptions"
                  value-attribute="value"
                  option-attribute="label"
                  class="w-32"
                />
              </UFormGroup>
              <UButton
                color="violet"
                :loading="calculatingPayouts"
                @click="calculatePayouts"
              >
                <UIcon name="i-heroicons-calculator" class="w-4 h-4 mr-2" />
                Calculate Payouts
              </UButton>
            </div>
            <p class="text-sm text-zinc-500 mt-4">
              This will calculate the user-centric revenue distribution for the selected month. 85% of each subscriber's fee goes to artists based on their listening time.
            </p>
          </UCard>

          <!-- Calculation Results -->
          <UCard v-if="payoutCalculation" class="bg-zinc-900/50 border-zinc-800">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">Calculation Results</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-zinc-100">{{ formatCurrency(payoutCalculation.totalRevenue) }}</p>
                <p class="text-sm text-zinc-400">Total Revenue</p>
              </div>
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-teal-400">{{ formatCurrency(payoutCalculation.artistPool) }}</p>
                <p class="text-sm text-zinc-400">Artist Pool (85%)</p>
              </div>
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-violet-400">{{ payoutCalculation.artistsCount }}</p>
                <p class="text-sm text-zinc-400">Artists</p>
              </div>
              <div class="text-center p-4 bg-zinc-800/50 rounded-lg">
                <p class="text-2xl font-bold text-zinc-100">{{ payoutCalculation.subscribersCount }}</p>
                <p class="text-sm text-zinc-400">Subscribers</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
              <div>
                <p class="text-zinc-300">Ready to process payouts?</p>
                <p class="text-sm text-zinc-500">This will send Stripe transfers to artists with balance >= $10.</p>
              </div>
              <UButton
                color="green"
                :loading="processingPayouts"
                @click="processPayouts"
              >
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4 mr-2" />
                Process Payouts
              </UButton>
            </div>
          </UCard>

          <!-- Processing Results -->
          <UCard v-if="payoutResults" class="bg-zinc-900/50 border-zinc-800">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">Payout Results</h3>
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p class="text-2xl font-bold text-green-400">{{ payoutResults.processed }}</p>
                <p class="text-sm text-zinc-400">Successful</p>
              </div>
              <div class="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p class="text-2xl font-bold text-red-400">{{ payoutResults.failed }}</p>
                <p class="text-sm text-zinc-400">Failed</p>
              </div>
              <div class="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p class="text-2xl font-bold text-yellow-400">{{ payoutResults.skipped }}</p>
                <p class="text-sm text-zinc-400">Skipped</p>
              </div>
            </div>

            <p class="text-teal-400 font-semibold mb-4">
              Total Paid: {{ formatCurrency(payoutResults.totalAmount) }}
            </p>

            <div v-if="payoutResults.results.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-800">
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Artist</th>
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Amount</th>
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Status</th>
                    <th class="text-left py-2 px-3 text-sm font-medium text-zinc-400">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in payoutResults.results" :key="result.bandId" class="border-b border-zinc-800/50">
                    <td class="py-2 px-3 text-sm text-zinc-300">{{ result.bandName }}</td>
                    <td class="py-2 px-3 text-sm text-teal-400">{{ formatCurrency(result.amount) }}</td>
                    <td class="py-2 px-3">
                      <UBadge
                        :color="result.status === 'success' ? 'green' : result.status === 'failed' ? 'red' : 'yellow'"
                        variant="subtle"
                        size="xs"
                      >
                        {{ result.status }}
                      </UBadge>
                    </td>
                    <td class="py-2 px-3 text-xs text-zinc-500 font-mono">
                      {{ result.transferId || result.error || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UCard>

          <!-- Info Card -->
          <UCard class="bg-zinc-900/50 border-zinc-800">
            <h3 class="font-semibold text-zinc-100 mb-3">Payout System Info</h3>
            <div class="space-y-2 text-sm text-zinc-400">
              <p><span class="text-violet-400 font-medium">User-Centric Model:</span> Each subscriber's $9.99 is distributed only to artists they listened to.</p>
              <p><span class="text-teal-400 font-medium">85% Artist Share:</span> Artists receive 85% of their listeners' subscription contribution.</p>
              <p><span class="text-zinc-300 font-medium">$10 Minimum:</span> Artists need at least $10 balance and a connected Stripe account to receive payouts.</p>
              <p><span class="text-zinc-300 font-medium">Stripe Connect:</span> Artists connect their bank account through Stripe Express onboarding in their dashboard.</p>
            </div>
          </UCard>
        </div>
      </template>

      <!-- PRO Export Tab -->
      <template #pro-export>
        <div class="py-6">
          <UCard class="bg-zinc-900/50 border-zinc-800 max-w-2xl">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <UIcon name="i-heroicons-document-arrow-down" class="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-zinc-100">SUISA/GEMA Export</h2>
                  <p class="text-sm text-zinc-400">Generate stream reports for PRO submission</p>
                </div>
              </div>
            </template>

            <div class="space-y-6">
              <!-- Quarter Presets -->
              <div>
                <label class="text-sm font-medium text-zinc-300 mb-2 block">Quick Select</label>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="preset in quarterPresets"
                    :key="preset.value"
                    size="sm"
                    :color="selectedPreset === preset.value ? 'violet' : 'gray'"
                    :variant="selectedPreset === preset.value ? 'solid' : 'ghost'"
                    @click="applyPreset(preset.value)"
                  >
                    {{ preset.label }}
                  </UButton>
                </div>
              </div>

              <!-- Custom Date Range -->
              <div class="grid grid-cols-2 gap-4">
                <UFormGroup label="Start Date">
                  <UInput v-model="startDate" type="date" size="lg" />
                </UFormGroup>
                <UFormGroup label="End Date">
                  <UInput v-model="endDate" type="date" size="lg" />
                </UFormGroup>
              </div>

              <!-- Info Box -->
              <div class="bg-zinc-800/50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-zinc-200 mb-2">Export includes:</h4>
                <ul class="text-sm text-zinc-400 space-y-1">
                  <li>- All completed streams (30+ seconds) from paying subscribers</li>
                  <li>- ISRC and ISWC codes for each track</li>
                  <li>- Composer credits with IPI numbers and split percentages</li>
                  <li>- Play counts grouped by territory (country)</li>
                  <li>- Total listening duration in seconds</li>
                </ul>
              </div>

              <!-- Download Button -->
              <div class="flex justify-end">
                <UButton
                  color="violet"
                  size="lg"
                  :loading="exporting"
                  :disabled="!startDate || !endDate"
                  @click="downloadExport"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 mr-2" />
                  Download CSV
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Delete User Confirmation Modal -->
    <UModal v-model="showDeleteUserModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Delete User</h3>
          </div>
        </template>

        <p class="text-zinc-300">
          Are you sure you want to delete <strong>{{ userToDelete?.email }}</strong>?
        </p>
        <p class="text-zinc-400 text-sm mt-2">
          This will permanently delete:
        </p>
        <ul class="text-zinc-400 text-sm mt-1 list-disc list-inside">
          <li>User account and profile</li>
          <li>{{ userToDelete?.band_count || 0 }} artist profile(s) and all their music</li>
          <li>{{ userToDelete?.stream_count || 0 }} listening history records</li>
          <li>Library, follows, and all other data</li>
        </ul>
        <p class="text-red-400 text-sm mt-3">This action cannot be undone.</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showDeleteUserModal = false" :disabled="deletingUser">
              Cancel
            </UButton>
            <UButton color="red" :loading="deletingUser" @click="handleDeleteUser">
              Delete User
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

interface AdminUser {
  id: string
  email: string
  display_name: string | null
  role: 'user' | 'band' | 'admin'
  created_at: string
  updated_at: string
  band_count: number
  stream_count: number
}

const toast = useToast()
const client = useSupabaseClient()
const currentUser = useSupabaseUser()

const currentUserId = computed(() => currentUser.value?.id)
const currentTab = ref(0)

const tabs = [
  { label: 'Overview', slot: 'overview', icon: 'i-heroicons-chart-bar' },
  { label: 'Users', slot: 'users', icon: 'i-heroicons-users' },
  { label: 'Payouts', slot: 'payouts', icon: 'i-heroicons-banknotes' },
  { label: 'PRO Export', slot: 'pro-export', icon: 'i-heroicons-document-arrow-down' },
]

// Stats
const statsLoading = ref(true)
const stats = ref({
  totalStreams: 0,
  totalArtists: 0,
  totalTracks: 0,
  totalUsers: 0,
})

// Users
const users = ref<AdminUser[]>([])
const usersLoading = ref(false)
const userSearch = ref('')
const usersPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Artist', value: 'band' },
  { label: 'Admin', value: 'admin' },
]

// Delete user
const showDeleteUserModal = ref(false)
const deletingUser = ref(false)
const userToDelete = ref<AdminUser | null>(null)

// PRO Export
const startDate = ref('')
const endDate = ref('')
const selectedPreset = ref('last-quarter')
const exporting = ref(false)

const currentYear = new Date().getFullYear()

const quarterPresets = [
  { label: 'Q1 ' + currentYear, value: 'q1' },
  { label: 'Q2 ' + currentYear, value: 'q2' },
  { label: 'Q3 ' + currentYear, value: 'q3' },
  { label: 'Q4 ' + currentYear, value: 'q4' },
  { label: 'Last Quarter', value: 'last-quarter' },
  { label: 'Last Month', value: 'last-month' },
  { label: 'Custom', value: 'custom' },
]

// Payouts
interface PayoutCalculationResult {
  success: boolean
  periodId: string
  periodStart: string
  periodEnd: string
  totalRevenue: number
  artistPool: number
  platformFee: number
  totalStreams: number
  artistsCount: number
  subscribersCount: number
}

interface PayoutProcessResult {
  success: boolean
  processed: number
  failed: number
  skipped: number
  totalAmount: number
  results: Array<{
    bandId: string
    bandName: string
    amount: number
    status: 'success' | 'failed' | 'skipped'
    error?: string
    transferId?: string
  }>
}

const payoutMonth = ref(new Date().getMonth())
const payoutYear = ref(new Date().getFullYear())
const calculatingPayouts = ref(false)
const processingPayouts = ref(false)
const payoutCalculation = ref<PayoutCalculationResult | null>(null)
const payoutResults = ref<PayoutProcessResult | null>(null)

const monthOptions = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 },
]

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  label: String(currentYear - i),
  value: currentYear - i,
}))

// Helpers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Load stats
const loadStats = async () => {
  statsLoading.value = true
  try {
    const { count: streamCount } = await client
      .from('listening_history')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true)

    const { count: artistCount } = await client
      .from('bands')
      .select('*', { count: 'exact', head: true })

    const { count: trackCount } = await client
      .from('tracks')
      .select('*', { count: 'exact', head: true })

    const { count: userCount } = await client
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    stats.value = {
      totalStreams: streamCount || 0,
      totalArtists: artistCount || 0,
      totalTracks: trackCount || 0,
      totalUsers: userCount || 0,
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    statsLoading.value = false
  }
}

// Load users
const loadUsers = async (page = 1) => {
  usersLoading.value = true
  try {
    const data = await $fetch('/api/admin/users', {
      query: {
        page,
        limit: 50,
        search: userSearch.value,
      },
    })

    users.value = data.users as AdminUser[]
    usersPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load users:', e)
    toast.add({
      title: 'Failed to load users',
      description: e.message,
      color: 'red',
    })
  } finally {
    usersLoading.value = false
  }
}

// Update user role
const updateUserRole = async (userId: string, role: string) => {
  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: { role },
    })

    // Update local state
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.role = role as 'user' | 'band' | 'admin'
    }

    toast.add({
      title: 'Role updated',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Failed to update role:', e)
    toast.add({
      title: 'Failed to update role',
      description: e.data?.message || e.message,
      color: 'red',
    })
  }
}

// Delete user
const confirmDeleteUser = (user: AdminUser) => {
  userToDelete.value = user
  showDeleteUserModal.value = true
}

const handleDeleteUser = async () => {
  if (!userToDelete.value) return

  deletingUser.value = true
  try {
    await $fetch(`/api/admin/users/${userToDelete.value.id}`, {
      method: 'DELETE',
    })

    // Remove from local state
    users.value = users.value.filter(u => u.id !== userToDelete.value!.id)
    usersPagination.value.total -= 1

    toast.add({
      title: 'User deleted',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    showDeleteUserModal.value = false

    // Reload stats
    loadStats()
  } catch (e: any) {
    console.error('Failed to delete user:', e)
    toast.add({
      title: 'Failed to delete user',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    deletingUser.value = false
  }
}

// PRO Export
const applyPreset = (preset: string) => {
  selectedPreset.value = preset
  const now = new Date()
  const year = now.getFullYear()

  switch (preset) {
    case 'q1':
      startDate.value = `${year}-01-01`
      endDate.value = `${year}-03-31`
      break
    case 'q2':
      startDate.value = `${year}-04-01`
      endDate.value = `${year}-06-30`
      break
    case 'q3':
      startDate.value = `${year}-07-01`
      endDate.value = `${year}-09-30`
      break
    case 'q4':
      startDate.value = `${year}-10-01`
      endDate.value = `${year}-12-31`
      break
    case 'last-quarter': {
      const quarterEnd = new Date(year, now.getMonth(), 0)
      const quarterStart = new Date(quarterEnd.getFullYear(), quarterEnd.getMonth() - 2, 1)
      startDate.value = quarterStart.toISOString().split('T')[0]
      endDate.value = quarterEnd.toISOString().split('T')[0]
      break
    }
    case 'last-month': {
      const lastMonth = new Date(year, now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(year, now.getMonth(), 0)
      startDate.value = lastMonth.toISOString().split('T')[0]
      endDate.value = lastMonthEnd.toISOString().split('T')[0]
      break
    }
    case 'custom':
      break
  }
}

const downloadExport = async () => {
  if (!startDate.value || !endDate.value) {
    toast.add({ title: 'Please select a date range', color: 'red' })
    return
  }

  exporting.value = true

  try {
    const response = await $fetch('/api/admin/pro-export', {
      method: 'POST',
      body: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    })

    const blob = new Blob([response as string], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suisa-report-${startDate.value}-to-${endDate.value}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.add({
      title: 'Export downloaded',
      description: 'CSV file saved to your downloads',
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Export failed:', e)
    toast.add({
      title: 'Export failed',
      description: e.data?.message || e.message || 'Failed to generate report',
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    exporting.value = false
  }
}

// Calculate payouts for a period
const calculatePayouts = async () => {
  const periodStart = new Date(payoutYear.value, payoutMonth.value, 1)
  const periodEnd = new Date(payoutYear.value, payoutMonth.value + 1, 0)

  calculatingPayouts.value = true
  payoutCalculation.value = null
  payoutResults.value = null

  try {
    const result = await $fetch<PayoutCalculationResult>('/api/admin/calculate-payouts', {
      method: 'POST',
      body: {
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
      },
    })

    payoutCalculation.value = result

    toast.add({
      title: 'Payouts Calculated',
      description: `${result.artistsCount} artists have earnings to distribute.`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })
  } catch (e: any) {
    console.error('Calculate payouts error:', e)
    toast.add({
      title: 'Calculation Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    calculatingPayouts.value = false
  }
}

// Process payouts (send Stripe transfers)
const processPayouts = async () => {
  processingPayouts.value = true

  try {
    const result = await $fetch<PayoutProcessResult>('/api/admin/process-payouts', {
      method: 'POST',
      body: {},
    })

    payoutResults.value = result

    if (result.processed > 0) {
      toast.add({
        title: 'Payouts Processed',
        description: `${result.processed} payouts sent, ${result.failed} failed, ${result.skipped} skipped.`,
        color: 'green',
        icon: 'i-heroicons-check-circle',
      })
    } else {
      toast.add({
        title: 'No Payouts Sent',
        description: result.results[0]?.error || 'No artists have connected Stripe accounts with balance >= $10.',
        color: 'yellow',
        icon: 'i-heroicons-information-circle',
      })
    }
  } catch (e: any) {
    console.error('Process payouts error:', e)
    toast.add({
      title: 'Processing Failed',
      description: e.data?.statusMessage || e.message,
      color: 'red',
      icon: 'i-heroicons-exclamation-triangle',
    })
  } finally {
    processingPayouts.value = false
  }
}

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Search debounce
let searchTimeout: ReturnType<typeof setTimeout>
watch(userSearch, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers(1)
  }, 300)
})

onMounted(() => {
  loadStats()
  loadUsers()
  applyPreset('last-quarter')
})
</script>
