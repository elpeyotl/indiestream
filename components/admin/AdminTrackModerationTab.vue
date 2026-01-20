<template>
  <div class="py-6 space-y-6">
    <!-- Stats - Clickable Filters on Desktop -->
    <div class="hidden md:grid grid-cols-4 gap-4">
      <button
        class="text-left transition-all rounded-lg"
        :class="moderationStatusFilter === 'pending' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="moderationStatusFilter = 'pending'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-yellow-400">{{ pendingCount }}</p>
            <p class="text-sm text-zinc-400">Pending Review</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="moderationPriorityFilter === 'urgent' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="moderationPriorityFilter = 'urgent'; moderationStatusFilter = 'all'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-red-400">{{ urgentCount }}</p>
            <p class="text-sm text-zinc-400">Urgent</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="moderationStatusFilter === 'approved' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="moderationStatusFilter = 'approved'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ approvedTodayCount }}</p>
            <p class="text-sm text-zinc-400">Approved Today</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="moderationStatusFilter === 'revision_requested' ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="moderationStatusFilter = 'revision_requested'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-orange-400">{{ revisionRequestedCount }}</p>
            <p class="text-sm text-zinc-400">Awaiting Revision</p>
          </div>
        </UCard>
      </button>
    </div>

    <!-- Mobile Stats (non-clickable) -->
    <div class="md:hidden grid grid-cols-2 gap-4">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-400">{{ pendingCount }}</p>
          <p class="text-xs text-zinc-400">Pending</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-red-400">{{ urgentCount }}</p>
          <p class="text-xs text-zinc-400">Urgent</p>
        </div>
      </UCard>
    </div>

    <!-- Search and Filters - Always visible -->
    <div class="flex flex-wrap gap-4">
      <UInput
        v-model="moderationSearch"
        placeholder="Search by track or artist name..."
        size="lg"
        class="flex-1 min-w-[200px]"
      >
        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
        </template>
      </UInput>

      <USelectMenu
        v-model="moderationStatusFilter"
        :options="moderationStatusOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-44"
      />

      <USelectMenu
        v-model="moderationPriorityFilter"
        :options="moderationPriorityOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-40"
      />

      <UButton color="gray" @click="loadModerationQueue">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Queue Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="moderationLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="moderationQueue.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No tracks in queue</p>
        <p class="text-sm mt-1">All tracks have been reviewed!</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Track</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Artist</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Priority</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Submitted</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in moderationQueue"
              :key="item.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
              @click="openTrackDetail(item)"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0"
                  >
                    <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ item.track?.title || 'Untitled' }}</p>
                    <p class="text-sm text-zinc-500">{{ item.track?.album?.title || 'No album' }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div>
                  <p class="text-zinc-300">{{ item.band?.name || 'Unknown' }}</p>
                  <p class="text-xs text-zinc-500">{{ item.submitter?.email }}</p>
                </div>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'yellow' : 'gray'"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.priority }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="getStatusColor(item.status)"
                  variant="subtle"
                  size="xs"
                >
                  {{ formatStatus(item.status) }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-zinc-400">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="py-3 px-4 text-right" @click.stop>
                <div class="flex justify-end gap-1">
                  <UButton
                    v-if="item.status === 'pending' || item.status === 'pending_update'"
                    color="green"
                    variant="ghost"
                    size="xs"
                    title="Approve"
                    @click="handleQuickApprove(item)"
                  >
                    <UIcon name="i-heroicons-check" class="w-4 h-4" />
                  </UButton>
                  <UButton
                    v-if="item.status === 'pending' || item.status === 'pending_update'"
                    color="red"
                    variant="ghost"
                    size="xs"
                    title="Reject"
                    @click="openRejectModal(item)"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                  </UButton>
                  <UDropdown
                    :items="getPriorityMenuItems(item)"
                    :popper="{ placement: 'bottom-end' }"
                  >
                    <UButton
                      color="gray"
                      variant="ghost"
                      size="xs"
                      title="Change Priority"
                    >
                      <UIcon name="i-heroicons-arrow-up-down" class="w-4 h-4" />
                    </UButton>
                  </UDropdown>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="moderationPagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
        <p class="text-sm text-zinc-400">
          Showing {{ (moderationPagination.page - 1) * moderationPagination.limit + 1 }} - {{ Math.min(moderationPagination.page * moderationPagination.limit, moderationPagination.total) }} of {{ moderationPagination.total }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="moderationPagination.page <= 1"
            @click="loadModerationQueue(moderationPagination.page - 1)"
          >
            Previous
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="moderationPagination.page >= moderationPagination.totalPages"
            @click="loadModerationQueue(moderationPagination.page + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Track Detail Modal -->
    <UModal v-model="showTrackDetailModal" :ui="{ width: 'sm:max-w-3xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-100">{{ selectedQueueItem?.track?.title || 'Track Details' }}</h3>
                <p class="text-sm text-zinc-400">{{ selectedQueueItem?.band?.name }} - {{ selectedQueueItem?.track?.album?.title }}</p>
              </div>
            </div>
            <UBadge
              v-if="selectedQueueItem"
              :color="getStatusColor(selectedQueueItem.status)"
              variant="subtle"
            >
              {{ formatStatus(selectedQueueItem.status) }}
            </UBadge>
          </div>
        </template>

        <div v-if="loadingTrackDetail" class="flex justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
        </div>

        <div v-else-if="selectedQueueItem" class="space-y-6">
          <!-- Audio Player -->
          <div class="bg-zinc-800/50 rounded-lg p-4">
            <div class="flex items-center gap-4">
              <UButton
                :color="isPlaying ? 'violet' : 'gray'"
                size="lg"
                :disabled="!audioPreviewUrl || audioLoading"
                :loading="audioLoading"
                @click="toggleAudioPreview"
              >
                <UIcon :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'" class="w-5 h-5" />
              </UButton>
              <div class="flex-1">
                <p class="text-zinc-200 font-medium">{{ selectedQueueItem.track.title }}</p>
                <p class="text-sm text-zinc-500">
                  {{ formatDuration(selectedQueueItem.track.duration_seconds) }}
                  <span v-if="selectedQueueItem.track.is_explicit" class="ml-2 text-red-400">[Explicit]</span>
                  <span v-if="selectedQueueItem.track.is_cover" class="ml-2 text-yellow-400">[Cover]</span>
                </p>
                <p v-if="!audioPreviewUrl && !audioLoading" class="text-xs text-yellow-500 mt-1">
                  No audio file available
                </p>
              </div>
              <audio
                ref="audioElement"
                :src="audioPreviewUrl || undefined"
                @ended="isPlaying = false"
                @error="handleAudioError"
                @canplay="audioLoading = false"
                class="hidden"
              />
            </div>
          </div>

          <!-- Track Info Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">ISRC</p>
              <p class="text-zinc-200 font-mono">{{ selectedQueueItem.track.isrc || 'Not provided' }}</p>
            </div>
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">ISWC</p>
              <p class="text-zinc-200 font-mono">{{ selectedQueueItem.track.iswc || 'Not provided' }}</p>
            </div>
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">Track #</p>
              <p class="text-zinc-200">{{ selectedQueueItem.track.track_number }}</p>
            </div>
            <div class="bg-zinc-800/30 rounded-lg p-3">
              <p class="text-xs text-zinc-500 uppercase tracking-wide">Priority</p>
              <UBadge
                :color="selectedQueueItem.priority === 'urgent' ? 'red' : selectedQueueItem.priority === 'high' ? 'yellow' : 'gray'"
                variant="subtle"
                size="xs"
              >
                {{ selectedQueueItem.priority }}
              </UBadge>
            </div>
          </div>

          <!-- Credits -->
          <div v-if="selectedQueueItem.track.credits && selectedQueueItem.track.credits.length > 0">
            <h4 class="text-sm font-medium text-zinc-300 mb-2">Credits</h4>
            <div class="bg-zinc-800/30 rounded-lg overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-zinc-700">
                    <th class="text-left py-2 px-3 text-xs text-zinc-500">Name</th>
                    <th class="text-left py-2 px-3 text-xs text-zinc-500">Role</th>
                    <th class="text-left py-2 px-3 text-xs text-zinc-500">IPI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="credit in selectedQueueItem.track.credits" :key="credit.id" class="border-b border-zinc-700/50">
                    <td class="py-2 px-3 text-sm text-zinc-200">{{ credit.name }}</td>
                    <td class="py-2 px-3 text-sm text-zinc-400">{{ credit.role }}</td>
                    <td class="py-2 px-3 text-sm text-zinc-400 font-mono">{{ credit.ipi_number || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Artist Info -->
          <div class="bg-zinc-800/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-zinc-300 mb-2">Artist Information</h4>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p class="text-zinc-200">{{ selectedQueueItem.band.name }}</p>
                <p class="text-sm text-zinc-500">{{ selectedQueueItem.band.owner?.email }}</p>
              </div>
              <NuxtLink :to="`/${selectedQueueItem.band.slug}`" target="_blank" class="ml-auto">
                <UButton color="gray" variant="ghost" size="xs">
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
                  View Profile
                </UButton>
              </NuxtLink>
            </div>
          </div>

          <!-- Previous Notes -->
          <div v-if="selectedQueueItem.notes" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 class="text-sm font-medium text-yellow-400 mb-2">Previous Notes</h4>
            <p class="text-zinc-300 text-sm whitespace-pre-wrap">{{ selectedQueueItem.notes }}</p>
          </div>

          <!-- Action Notes -->
          <UFormGroup label="Notes (optional for approval, required for rejection/revision)">
            <UTextarea
              v-model="moderationNotes"
              placeholder="Add notes about this track..."
              rows="3"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton color="gray" variant="ghost" @click="closeTrackDetail">
              Close
            </UButton>
            <div v-if="selectedQueueItem?.status === 'pending' || selectedQueueItem?.status === 'pending_update'" class="flex gap-2">
              <UButton
                color="orange"
                variant="soft"
                :loading="moderationActionLoading"
                @click="handleRequestRevision"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
                Request Revision
              </UButton>
              <UButton
                color="red"
                variant="soft"
                :loading="moderationActionLoading"
                @click="handleReject"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-1" />
                Reject
              </UButton>
              <UButton
                color="green"
                :loading="moderationActionLoading"
                @click="handleApprove"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Approve
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Reject Track Modal -->
    <UModal v-model="showRejectModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Reject Track</h3>
          </div>
        </template>

        <p class="text-zinc-300 mb-4">
          Please provide a reason for rejecting <strong>{{ selectedQueueItem?.track?.title }}</strong>.
        </p>

        <UFormGroup label="Rejection Reason" required>
          <UTextarea
            v-model="moderationNotes"
            placeholder="Explain why this track is being rejected..."
            rows="4"
          />
        </UFormGroup>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showRejectModal = false" :disabled="moderationActionLoading">
              Cancel
            </UButton>
            <UButton color="red" :loading="moderationActionLoading" :disabled="!moderationNotes.trim()" @click="confirmReject">
              Reject Track
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Request Revision Modal -->
    <UModal v-model="showRevisionModal">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-orange-500" />
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Request Revision</h3>
          </div>
        </template>

        <p class="text-zinc-300 mb-4">
          Please provide feedback for the artist about <strong>{{ selectedQueueItem?.track?.title }}</strong>.
        </p>

        <UFormGroup label="Revision Notes" required>
          <UTextarea
            v-model="moderationNotes"
            placeholder="Explain what changes are needed..."
            rows="4"
          />
        </UFormGroup>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="showRevisionModal = false" :disabled="moderationActionLoading">
              Cancel
            </UButton>
            <UButton color="orange" :loading="moderationActionLoading" :disabled="!moderationNotes.trim()" @click="confirmRequestRevision">
              Request Revision
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ModerationQueueItem } from '~/types/admin'
import { moderationStatusOptions, moderationPriorityOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'
import { useAdminRealtime } from '~/composables/useAdminRealtime'

const emit = defineEmits<{
  updatePendingCount: [count: number]
}>()

const { toast, formatDate, getStatusColor } = useAdminUtils()
const { subscribe } = useAdminRealtime()

// State
const moderationQueue = ref<ModerationQueueItem[]>([])
const moderationLoading = ref(false)
const moderationSearch = ref('')
const moderationStatusFilter = ref('pending')
const moderationPriorityFilter = ref('all')
const moderationPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

// Computed stats
const pendingCount = computed(() => {
  return moderationQueue.value.filter(item => item.status === 'pending' || item.status === 'pending_update').length
})

const urgentCount = computed(() => {
  return moderationQueue.value.filter(item => item.priority === 'urgent' && (item.status === 'pending' || item.status === 'pending_update')).length
})

const approvedTodayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return moderationQueue.value.filter(item =>
    item.status === 'approved' && item.reviewed_at?.startsWith(today),
  ).length
})

const revisionRequestedCount = computed(() => {
  return moderationQueue.value.filter(item => item.status === 'revision_requested').length
})

// Track detail modal
const showTrackDetailModal = ref(false)
const selectedQueueItem = ref<ModerationQueueItem | null>(null)
const loadingTrackDetail = ref(false)

// Moderation actions
const moderationActionLoading = ref(false)
const moderationNotes = ref('')
const showRejectModal = ref(false)
const showRevisionModal = ref(false)

// Audio preview
const audioPreviewUrl = ref<string | null>(null)
const isPlaying = ref(false)
const audioLoading = ref(false)
const audioElement = ref<HTMLAudioElement | null>(null)

// Helpers
const formatStatus = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending'
    case 'pending_update': return 'Update Pending'
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'revision_requested': return 'Revision Requested'
    default: return status
  }
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Fetch pending count for tab badge
const fetchPendingCount = async () => {
  try {
    const data = await $fetch<{ total: number }>('/api/admin/moderation-queue', {
      query: { status: 'pending', limit: 1 },
    })
    emit('updatePendingCount', data.total)
  } catch (e) {
    console.error('Failed to fetch pending count:', e)
  }
}

// Load moderation queue
const loadModerationQueue = async (page = 1) => {
  moderationLoading.value = true
  try {
    const data = await $fetch<{
      items: ModerationQueueItem[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>('/api/admin/moderation-queue', {
      query: {
        page,
        limit: 50,
        search: moderationSearch.value,
        status: moderationStatusFilter.value,
        priority: moderationPriorityFilter.value,
      },
    })

    moderationQueue.value = data.items
    moderationPagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }

    // Update pending count for badge
    if (moderationStatusFilter.value === 'pending' || moderationStatusFilter.value === 'all') {
      fetchPendingCount()
    }
  } catch (e: any) {
    console.error('Failed to load moderation queue:', e)
    toast.add({
      title: 'Failed to load moderation queue',
      description: e.message,
      color: 'red',
    })
  } finally {
    moderationLoading.value = false
  }
}

// Open track detail modal
const openTrackDetail = async (item: ModerationQueueItem) => {
  selectedQueueItem.value = item
  moderationNotes.value = ''
  showTrackDetailModal.value = true
  loadingTrackDetail.value = true

  try {
    // Load full track details
    const fullItem = await $fetch<ModerationQueueItem>(`/api/admin/moderation-queue/${item.id}`)
    selectedQueueItem.value = fullItem

    // Load audio preview URL if audio_key exists
    if (fullItem.track?.audio_key) {
      try {
        const encodedKey = btoa(fullItem.track.audio_key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
        audioPreviewUrl.value = response.url
      } catch (err) {
        console.error('Failed to get stream URL:', err)
        audioPreviewUrl.value = null
      }
    } else {
      audioPreviewUrl.value = null
    }
  } catch (e: any) {
    console.error('Failed to load track details:', e)
    toast.add({
      title: 'Failed to load track details',
      description: e.message,
      color: 'red',
    })
  } finally {
    loadingTrackDetail.value = false
  }
}

const closeTrackDetail = () => {
  if (isPlaying.value && audioElement.value) {
    audioElement.value.pause()
    isPlaying.value = false
  }
  showTrackDetailModal.value = false
  selectedQueueItem.value = null
  audioPreviewUrl.value = null
  audioLoading.value = false
  moderationNotes.value = ''
}

// Audio preview
const toggleAudioPreview = () => {
  if (!audioElement.value) return

  if (isPlaying.value) {
    audioElement.value.pause()
    isPlaying.value = false
  } else {
    audioLoading.value = true
    audioElement.value.play()
      .then(() => {
        isPlaying.value = true
        audioLoading.value = false
      })
      .catch((e) => {
        console.error('Failed to play audio:', e)
        audioLoading.value = false
        toast.add({
          title: 'Failed to play audio',
          description: e.message,
          color: 'red',
        })
      })
  }
}

const handleAudioError = (e: Event) => {
  console.error('Audio error:', e)
  audioLoading.value = false
  isPlaying.value = false
  toast.add({
    title: 'Audio playback error',
    description: 'Failed to load audio file',
    color: 'red',
  })
}

// Priority menu items
const getPriorityMenuItems = (item: ModerationQueueItem) => {
  const priorities = ['urgent', 'high', 'normal'] as const
  return [priorities.filter(p => p !== item.priority).map(priority => ({
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    icon: priority === 'urgent' ? 'i-heroicons-exclamation-triangle' : priority === 'high' ? 'i-heroicons-arrow-up' : 'i-heroicons-minus',
    click: () => updatePriority(item.id, priority),
  }))]
}

const updatePriority = async (queueId: string, priority: string) => {
  try {
    await $fetch(`/api/admin/moderation-queue/${queueId}/priority`, {
      method: 'PATCH',
      body: { priority },
    })

    // Update local state
    const item = moderationQueue.value.find(i => i.id === queueId)
    if (item) {
      item.priority = priority as 'normal' | 'high' | 'urgent'
    }

    toast.add({
      title: 'Priority updated',
      color: 'green',
    })
  } catch (e: any) {
    console.error('Failed to update priority:', e)
    toast.add({
      title: 'Failed to update priority',
      description: e.message,
      color: 'red',
    })
  }
}

// Quick approve
const handleQuickApprove = async (item: ModerationQueueItem) => {
  selectedQueueItem.value = item
  await performApprove()
}

// Approve track
const handleApprove = async () => {
  await performApprove()
}

const performApprove = async () => {
  if (!selectedQueueItem.value) return

  moderationActionLoading.value = true
  try {
    await $fetch(`/api/admin/moderation-queue/${selectedQueueItem.value.id}/approve`, {
      method: 'POST',
      body: { notes: moderationNotes.value || null },
    })

    toast.add({
      title: 'Track approved',
      description: `"${selectedQueueItem.value.track?.title}" has been approved.`,
      color: 'green',
      icon: 'i-heroicons-check-circle',
    })

    // Remove from queue or update status
    moderationQueue.value = moderationQueue.value.filter(i => i.id !== selectedQueueItem.value!.id)
    closeTrackDetail()
    fetchPendingCount()
    loadModerationQueue(moderationPagination.value.page)
  } catch (e: any) {
    console.error('Failed to approve track:', e)
    toast.add({
      title: 'Failed to approve track',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    moderationActionLoading.value = false
  }
}

// Reject track
const openRejectModal = (item: ModerationQueueItem) => {
  selectedQueueItem.value = item
  moderationNotes.value = ''
  showRejectModal.value = true
}

const handleReject = () => {
  if (!moderationNotes.value.trim()) {
    showRejectModal.value = true
    return
  }
  confirmReject()
}

const confirmReject = async () => {
  if (!selectedQueueItem.value || !moderationNotes.value.trim()) return

  moderationActionLoading.value = true
  try {
    await $fetch(`/api/admin/moderation-queue/${selectedQueueItem.value.id}/reject`, {
      method: 'POST',
      body: { notes: moderationNotes.value },
    })

    toast.add({
      title: 'Track rejected',
      description: `"${selectedQueueItem.value.track?.title}" has been rejected.`,
      color: 'red',
      icon: 'i-heroicons-x-circle',
    })

    moderationQueue.value = moderationQueue.value.filter(i => i.id !== selectedQueueItem.value!.id)
    showRejectModal.value = false
    closeTrackDetail()
    fetchPendingCount()
    loadModerationQueue(moderationPagination.value.page)
  } catch (e: any) {
    console.error('Failed to reject track:', e)
    toast.add({
      title: 'Failed to reject track',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    moderationActionLoading.value = false
  }
}

// Request revision
const handleRequestRevision = () => {
  if (!moderationNotes.value.trim()) {
    showRevisionModal.value = true
    return
  }
  confirmRequestRevision()
}

const confirmRequestRevision = async () => {
  if (!selectedQueueItem.value || !moderationNotes.value.trim()) return

  moderationActionLoading.value = true
  try {
    await $fetch(`/api/admin/moderation-queue/${selectedQueueItem.value.id}/request-revision`, {
      method: 'POST',
      body: { notes: moderationNotes.value },
    })

    toast.add({
      title: 'Revision requested',
      description: `Revision requested for "${selectedQueueItem.value.track?.title}".`,
      color: 'orange',
      icon: 'i-heroicons-arrow-path',
    })

    // Update local state
    const item = moderationQueue.value.find(i => i.id === selectedQueueItem.value!.id)
    if (item) {
      item.status = 'revision_requested'
      item.notes = moderationNotes.value
    }

    showRevisionModal.value = false
    closeTrackDetail()
    fetchPendingCount()
    loadModerationQueue(moderationPagination.value.page)
  } catch (e: any) {
    console.error('Failed to request revision:', e)
    toast.add({
      title: 'Failed to request revision',
      description: e.data?.message || e.message,
      color: 'red',
    })
  } finally {
    moderationActionLoading.value = false
  }
}

// Search debounce
let moderationSearchTimeout: ReturnType<typeof setTimeout>
watch(moderationSearch, () => {
  clearTimeout(moderationSearchTimeout)
  moderationSearchTimeout = setTimeout(() => {
    loadModerationQueue(1)
  }, 300)
})

// Watch filters
watch([moderationStatusFilter, moderationPriorityFilter], () => {
  loadModerationQueue(1)
})

onMounted(() => {
  loadModerationQueue()

  // Subscribe to realtime updates for tracks table (moderation status changes)
  subscribe({
    table: 'tracks',
    onUpdate: () => loadModerationQueue(moderationPagination.value.page),
    watchFields: ['moderation_status'],
  })
})
</script>
