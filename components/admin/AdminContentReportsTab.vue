<template>
  <div class="py-6 space-y-6">
    <!-- Stats - Clickable Filters on Desktop -->
    <div class="hidden md:grid grid-cols-5 gap-4">
      <button
        class="text-left transition-all rounded-lg"
        :class="reportsStatusFilter === 'all' ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="reportsStatusFilter = 'all'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-zinc-100">{{ reportsStats.total }}</p>
            <p class="text-sm text-zinc-400">Total Reports</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="reportsStatusFilter === 'pending' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="reportsStatusFilter = 'pending'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-yellow-400">{{ reportsStats.pending }}</p>
            <p class="text-sm text-zinc-400">Pending</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="reportsStatusFilter === 'investigating' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="reportsStatusFilter = 'investigating'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-blue-400">{{ reportsStats.investigating }}</p>
            <p class="text-sm text-zinc-400">Investigating</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="reportsStatusFilter === 'resolved' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="reportsStatusFilter = 'resolved'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ reportsStats.resolved }}</p>
            <p class="text-sm text-zinc-400">Resolved</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="reportsStatusFilter === 'dismissed' ? 'ring-2 ring-gray-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="reportsStatusFilter = 'dismissed'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-gray-400">{{ reportsStats.dismissed }}</p>
            <p class="text-sm text-zinc-400">Dismissed</p>
          </div>
        </UCard>
      </button>
    </div>

    <!-- Mobile Stats (non-clickable) -->
    <div class="md:hidden grid grid-cols-2 gap-4">
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-zinc-100">{{ reportsStats.total }}</p>
          <p class="text-xs text-zinc-400">Total</p>
        </div>
      </UCard>
      <UCard class="bg-zinc-900/50 border-zinc-800">
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-400">{{ reportsStats.pending }}</p>
          <p class="text-xs text-zinc-400">Pending</p>
        </div>
      </UCard>
    </div>

    <!-- Filters - Always visible -->
    <div class="flex gap-4">
      <USelectMenu
        v-model="reportsStatusFilter"
        :options="reportsStatusOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-44"
      />
      <UButton color="gray" @click="loadContentReports">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Reports Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="reportsLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="contentReports.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-flag" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No reports found</p>
        <p class="text-sm mt-1">All clear!</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Track</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Reason</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Reporter</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Submitted</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="report in contentReports"
              :key="report.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p class="font-medium text-zinc-100">{{ report.track.title }}</p>
                    <p class="text-sm text-zinc-400">
                      {{ report.track.album.band.name }} · {{ report.track.album.title }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="getReasonColor(report.reason)" variant="subtle" size="xs">
                  {{ getReasonLabel(report.reason) }}
                </UBadge>
                <p v-if="report.details" class="text-xs text-zinc-500 mt-1 max-w-xs truncate">
                  {{ report.details }}
                </p>
              </td>
              <td class="py-3 px-4 text-sm">
                <p v-if="report.reporter" class="text-zinc-300">
                  {{ report.reporter.display_name || report.reporter.email }}
                </p>
                <p v-else-if="report.reporter_email" class="text-zinc-300">
                  {{ report.reporter_email }}
                </p>
                <p v-else class="text-zinc-500">Anonymous</p>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="getReportStatusColor(report.status)" variant="subtle" size="xs">
                  {{ report.status }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-zinc-400">
                {{ formatDate(report.created_at) }}
              </td>
              <td class="py-3 px-4 text-right">
                <UButton
                  color="violet"
                  variant="ghost"
                  size="xs"
                  @click="openReportDetail(report)"
                >
                  View Details
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Report Detail Modal -->
    <UModal v-model="reportDetailOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard v-if="selectedReport" class="bg-zinc-900 border-zinc-800">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-flag" class="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-100">Report Details</h3>
                <p class="text-sm text-zinc-400">ID: {{ selectedReport.id.slice(0, 8) }}...</p>
              </div>
            </div>
            <UBadge :color="getReportStatusColor(selectedReport.status)" variant="subtle">
              {{ selectedReport.status }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Track Info -->
          <div class="p-4 bg-zinc-800/50 rounded-lg">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Reported Track</h4>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-violet-400" />
              </div>
              <div class="flex-1">
                <p class="font-medium text-zinc-100">{{ selectedReport.track.title }}</p>
                <p class="text-sm text-zinc-400">
                  {{ selectedReport.track.album.band.name }} · {{ selectedReport.track.album.title }}
                </p>
                <p v-if="selectedReport.track.isrc" class="text-xs text-zinc-500 mt-1">
                  ISRC: {{ selectedReport.track.isrc }}
                </p>
              </div>
              <UButton
                color="gray"
                variant="outline"
                size="sm"
                :to="`/${selectedReport.track.album.band.slug}/${selectedReport.track.album.slug}`"
                target="_blank"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4 mr-1" />
                View
              </UButton>
            </div>
          </div>

          <!-- Report Reason -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Reason</h4>
            <UBadge :color="getReasonColor(selectedReport.reason)" size="lg">
              {{ getReasonLabel(selectedReport.reason) }}
            </UBadge>
          </div>

          <!-- Details -->
          <div v-if="selectedReport.details">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Details from Reporter</h4>
            <p class="text-zinc-300 bg-zinc-800/50 rounded-lg p-3">{{ selectedReport.details }}</p>
          </div>

          <!-- Evidence URL -->
          <div v-if="selectedReport.evidence_url">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Evidence URL</h4>
            <a
              :href="selectedReport.evidence_url"
              target="_blank"
              class="text-violet-400 hover:text-violet-300 underline break-all"
            >
              {{ selectedReport.evidence_url }}
            </a>
          </div>

          <!-- Reporter Info -->
          <div class="p-4 bg-zinc-800/50 rounded-lg">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Reporter</h4>
            <div v-if="selectedReport.reporter" class="text-zinc-300">
              <p>{{ selectedReport.reporter.display_name || 'No display name' }}</p>
              <p class="text-sm text-zinc-500">{{ selectedReport.reporter.email }}</p>
            </div>
            <div v-else-if="selectedReport.reporter_email" class="text-zinc-300">
              <p>{{ selectedReport.reporter_email }}</p>
              <p class="text-sm text-zinc-500">(Not logged in)</p>
            </div>
            <p v-else class="text-zinc-500">Anonymous report</p>
          </div>

          <!-- Timestamps -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-zinc-500">Submitted</p>
              <p class="text-zinc-300">{{ formatDate(selectedReport.created_at) }}</p>
            </div>
            <div v-if="selectedReport.resolved_at">
              <p class="text-zinc-500">Resolved</p>
              <p class="text-zinc-300">{{ formatDate(selectedReport.resolved_at) }}</p>
            </div>
          </div>

          <!-- Resolution Notes -->
          <div v-if="selectedReport.status === 'resolved' || selectedReport.status === 'dismissed'">
            <h4 class="text-sm font-medium text-zinc-400 mb-2">Resolution Notes</h4>
            <p v-if="selectedReport.resolution_notes" class="text-zinc-300">
              {{ selectedReport.resolution_notes }}
            </p>
            <p v-else class="text-zinc-500 italic">No notes provided</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-3">
            <!-- Status Actions -->
            <div v-if="selectedReport.status === 'pending'" class="flex gap-2">
              <UButton
                color="blue"
                variant="outline"
                @click="updateReportStatus(selectedReport.id, 'investigating'); reportDetailOpen = false"
              >
                <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 mr-1" />
                Start Investigation
              </UButton>
              <UButton
                color="gray"
                variant="outline"
                @click="updateReportStatus(selectedReport.id, 'dismissed'); reportDetailOpen = false"
              >
                Dismiss
              </UButton>
            </div>

            <div v-else-if="selectedReport.status === 'investigating'" class="flex gap-2">
              <UButton
                color="red"
                @click="confirmRemoveTrack(selectedReport)"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                Remove Track
              </UButton>
              <UButton
                color="green"
                variant="outline"
                @click="updateReportStatus(selectedReport.id, 'resolved'); reportDetailOpen = false"
              >
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
                Mark Resolved
              </UButton>
              <UButton
                color="gray"
                variant="outline"
                @click="updateReportStatus(selectedReport.id, 'dismissed'); reportDetailOpen = false"
              >
                Dismiss
              </UButton>
            </div>

            <div class="flex-1" />

            <UButton color="gray" variant="ghost" @click="reportDetailOpen = false">
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Confirm Remove Track Modal -->
    <UModal v-model="confirmRemoveTrackOpen">
      <UCard class="bg-zinc-900 border-zinc-800">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-zinc-100">Remove Track</h3>
              <p class="text-sm text-zinc-400">This action cannot be undone</p>
            </div>
          </div>
        </template>

        <div v-if="selectedReport" class="space-y-4">
          <p class="text-zinc-300">
            Are you sure you want to remove <strong class="text-zinc-100">{{ selectedReport.track.title }}</strong>
            by <strong class="text-zinc-100">{{ selectedReport.track.album.band.name }}</strong>?
          </p>
          <p class="text-sm text-zinc-500">
            The track will be permanently deleted from the platform. The artist will be notified.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="confirmRemoveTrackOpen = false">
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="removingTrack"
              @click="removeReportedTrack"
            >
              Remove Track
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ContentReport } from '~/types/admin'
import { reportsStatusOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const emit = defineEmits<{
  updatePendingCount: [count: number]
}>()

const { toast, formatDate, getReasonColor, getReasonLabel } = useAdminUtils()

// State
const contentReports = ref<ContentReport[]>([])
const reportsLoading = ref(false)
const reportsStatusFilter = ref('pending')
const reportsStats = ref({
  total: 0,
  pending: 0,
  investigating: 0,
  resolved: 0,
  dismissed: 0,
})

// Report Detail Modal
const reportDetailOpen = ref(false)
const selectedReport = ref<ContentReport | null>(null)
const confirmRemoveTrackOpen = ref(false)
const removingTrack = ref(false)

const getReportStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'yellow',
    investigating: 'blue',
    resolved: 'green',
    dismissed: 'gray',
  }
  return colors[status] || 'gray'
}

const loadContentReports = async () => {
  reportsLoading.value = true
  try {
    const data = await $fetch<{
      reports: ContentReport[]
      count: number
      stats: typeof reportsStats.value
    }>('/api/admin/reports', {
      query: {
        status: reportsStatusFilter.value,
        limit: 100,
      },
    })
    contentReports.value = data.reports
    reportsStats.value = data.stats

    // Emit pending count for tab badge
    emit('updatePendingCount', data.stats.pending)
  } catch (e) {
    console.error('Failed to load reports:', e)
    toast.add({ title: 'Failed to load reports', color: 'red' })
  } finally {
    reportsLoading.value = false
  }
}

const updateReportStatus = async (reportId: string, status: string, resolutionNotes?: string) => {
  try {
    await $fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: { status, resolution_notes: resolutionNotes },
    })
    toast.add({ title: 'Report updated', color: 'green' })
    await loadContentReports()
  } catch (e) {
    console.error('Failed to update report:', e)
    toast.add({ title: 'Failed to update report', color: 'red' })
  }
}

const openReportDetail = (report: ContentReport) => {
  selectedReport.value = report
  reportDetailOpen.value = true
}

const confirmRemoveTrack = (report: ContentReport | null) => {
  if (!report) return
  selectedReport.value = report
  confirmRemoveTrackOpen.value = true
}

const removeReportedTrack = async () => {
  if (!selectedReport.value) return

  removingTrack.value = true
  try {
    // Delete the track with reason for email notification
    const params = new URLSearchParams({
      reason: selectedReport.value.reason,
      ...(selectedReport.value.details && { details: selectedReport.value.details }),
    })
    await $fetch(`/api/admin/tracks/${selectedReport.value.track.id}?${params.toString()}`, {
      method: 'DELETE',
    })

    // Update report status to resolved
    await updateReportStatus(
      selectedReport.value.id,
      'resolved',
      'Track removed by admin',
    )

    toast.add({
      title: 'Track Removed',
      description: `"${selectedReport.value.track.title}" has been removed from the platform. The artist has been notified.`,
      color: 'green',
    })

    confirmRemoveTrackOpen.value = false
    reportDetailOpen.value = false
    selectedReport.value = null
  } catch (e: any) {
    console.error('Failed to remove track:', e)
    toast.add({
      title: 'Failed to Remove Track',
      description: e.data?.message || 'Something went wrong',
      color: 'red',
    })
  } finally {
    removingTrack.value = false
  }
}

// Watch for filter changes
watch(reportsStatusFilter, () => {
  loadContentReports()
})

onMounted(() => {
  loadContentReports()
})
</script>
