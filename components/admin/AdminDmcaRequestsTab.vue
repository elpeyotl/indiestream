<template>
  <div class="py-6 space-y-6">
    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        class="text-left transition-all rounded-lg"
        :class="dmcaStatusFilter === 'all' ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="dmcaStatusFilter = 'all'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-zinc-100">{{ dmcaStats.total }}</p>
            <p class="text-sm text-zinc-400">Total</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="dmcaStatusFilter === 'pending' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="dmcaStatusFilter = 'pending'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-yellow-400">{{ dmcaStats.pending }}</p>
            <p class="text-sm text-zinc-400">Pending</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="dmcaStatusFilter === 'processing' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="dmcaStatusFilter = 'processing'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-blue-400">{{ dmcaStats.processing }}</p>
            <p class="text-sm text-zinc-400">Processing</p>
          </div>
        </UCard>
      </button>
      <button
        class="text-left transition-all rounded-lg"
        :class="dmcaStatusFilter === 'content_removed' ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-zinc-950' : 'hover:ring-2 hover:ring-zinc-600 hover:ring-offset-2 hover:ring-offset-zinc-950'"
        @click="dmcaStatusFilter = 'content_removed'"
      >
        <UCard class="bg-zinc-900/50 border-zinc-800 h-full">
          <div class="text-center">
            <p class="text-3xl font-bold text-green-400">{{ dmcaStats.removed }}</p>
            <p class="text-sm text-zinc-400">Removed</p>
          </div>
        </UCard>
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <USelectMenu
        v-model="dmcaStatusFilter"
        :options="dmcaStatusOptions"
        value-attribute="value"
        option-attribute="label"
        size="lg"
        class="w-44"
      />
      <UButton color="gray" @click="loadDmcaRequests">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- DMCA Requests Table -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="dmcaLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="dmcaRequests.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-shield-exclamation" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No DMCA requests found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Claimant</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Infringing URL</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-zinc-400">Submitted</th>
              <th class="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="request in dmcaRequests"
              :key="request.id"
              class="border-b border-zinc-800/50 hover:bg-zinc-800/30"
            >
              <td class="py-3 px-4">
                <p class="font-medium text-zinc-100">{{ request.claimant_name }}</p>
                <p class="text-sm text-zinc-400">{{ request.claimant_email }}</p>
              </td>
              <td class="py-3 px-4">
                <a
                  :href="request.infringing_url"
                  target="_blank"
                  class="text-violet-400 hover:text-violet-300 text-sm truncate block max-w-xs"
                >
                  {{ request.infringing_url }}
                </a>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="getDmcaStatusColor(request.status)" variant="subtle" size="xs">
                  {{ request.status.replace('_', ' ') }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-sm text-zinc-400">
                {{ formatDate(request.created_at) }}
              </td>
              <td class="py-3 px-4 text-right">
                <UButton
                  color="violet"
                  variant="ghost"
                  size="xs"
                  @click="openDmcaDetail(request)"
                >
                  View Details
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- DMCA Detail Modal -->
    <UModal v-model="dmcaDetailOpen" :ui="{ width: 'sm:max-w-3xl' }">
      <UCard v-if="selectedDmca" class="bg-zinc-900 border-zinc-800">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-zinc-100">DMCA Request Details</h3>
                <p class="text-sm text-zinc-400">ID: {{ selectedDmca.id.slice(0, 8) }}...</p>
              </div>
            </div>
            <UBadge :color="getDmcaStatusColor(selectedDmca.status)" variant="subtle">
              {{ selectedDmca.status.replace('_', ' ') }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Claimant Info -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Claimant Information</h4>
            <div class="grid grid-cols-2 gap-4 bg-zinc-800/30 rounded-lg p-4">
              <div>
                <p class="text-zinc-500 text-sm">Name</p>
                <p class="text-zinc-100">{{ selectedDmca.claimant_name }}</p>
              </div>
              <div>
                <p class="text-zinc-500 text-sm">Email</p>
                <p class="text-zinc-100">{{ selectedDmca.claimant_email }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-zinc-500 text-sm">Address</p>
                <p class="text-zinc-100">{{ selectedDmca.claimant_address }}</p>
              </div>
              <div v-if="selectedDmca.claimant_phone">
                <p class="text-zinc-500 text-sm">Phone</p>
                <p class="text-zinc-100">{{ selectedDmca.claimant_phone }}</p>
              </div>
            </div>
          </div>

          <!-- Content Info -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Copyright Claim</h4>
            <div class="space-y-4 bg-zinc-800/30 rounded-lg p-4">
              <div>
                <p class="text-zinc-500 text-sm">Copyrighted Work Description</p>
                <p class="text-zinc-100 whitespace-pre-wrap">{{ selectedDmca.copyrighted_work_description }}</p>
              </div>
              <div>
                <p class="text-zinc-500 text-sm">Infringing URL</p>
                <a
                  :href="selectedDmca.infringing_url"
                  target="_blank"
                  class="text-violet-400 hover:text-violet-300 break-all"
                >
                  {{ selectedDmca.infringing_url }}
                </a>
              </div>
            </div>
          </div>

          <!-- Statements -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Legal Statements</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="selectedDmca.good_faith_statement ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="selectedDmca.good_faith_statement ? 'text-green-400' : 'text-red-400'"
                  class="w-5 h-5"
                />
                <span class="text-zinc-300 text-sm">Good faith statement confirmed</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon
                  :name="selectedDmca.accuracy_statement ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="selectedDmca.accuracy_statement ? 'text-green-400' : 'text-red-400'"
                  class="w-5 h-5"
                />
                <span class="text-zinc-300 text-sm">Accuracy/perjury statement confirmed</span>
              </div>
            </div>
          </div>

          <!-- Signature -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Electronic Signature</h4>
            <div class="bg-zinc-800/30 rounded-lg p-4">
              <p class="text-zinc-100 italic">"{{ selectedDmca.signature }}"</p>
              <p class="text-zinc-500 text-sm mt-1">Signed: {{ formatDate(selectedDmca.signature_date || selectedDmca.created_at) }}</p>
            </div>
          </div>

          <!-- Admin Notes -->
          <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-3">Admin Notes</h4>
            <UTextarea
              v-model="dmcaAdminNotes"
              placeholder="Add notes about this request..."
              :rows="3"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-3">
            <!-- Status Actions -->
            <div v-if="selectedDmca.status === 'pending'" class="flex gap-2">
              <UButton
                color="blue"
                variant="outline"
                :loading="dmcaUpdating"
                @click="updateDmcaStatus('processing')"
              >
                <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 mr-1" />
                Start Processing
              </UButton>
              <UButton
                color="gray"
                variant="outline"
                :loading="dmcaUpdating"
                @click="updateDmcaStatus('rejected')"
              >
                Reject
              </UButton>
            </div>

            <div v-else-if="selectedDmca.status === 'processing'" class="flex gap-2">
              <UButton
                color="red"
                :loading="dmcaUpdating"
                @click="updateDmcaStatus('content_removed')"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                Mark Content Removed
              </UButton>
              <UButton
                color="gray"
                variant="outline"
                :loading="dmcaUpdating"
                @click="updateDmcaStatus('rejected')"
              >
                Reject
              </UButton>
            </div>

            <div v-else-if="selectedDmca.status === 'content_removed'" class="flex gap-2">
              <UButton
                color="green"
                variant="outline"
                :loading="dmcaUpdating"
                @click="updateDmcaStatus('resolved')"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Mark Resolved
              </UButton>
            </div>

            <UButton
              v-if="dmcaAdminNotes !== (selectedDmca.admin_notes || '')"
              color="violet"
              variant="soft"
              :loading="dmcaUpdating"
              @click="saveDmcaNotes"
            >
              Save Notes
            </UButton>

            <div class="flex-1" />

            <UButton color="gray" variant="ghost" @click="dmcaDetailOpen = false">
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { DmcaRequest } from '~/types/admin'
import { dmcaStatusOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'
import { useAdminRealtime } from '~/composables/useAdminRealtime'

const emit = defineEmits<{
  updatePendingCount: [count: number]
}>()

const { toast, formatDate, getStatusColor } = useAdminUtils()
const { subscribe } = useAdminRealtime()

// State
const dmcaRequests = ref<DmcaRequest[]>([])
const dmcaLoading = ref(false)
const dmcaStatusFilter = ref('all')
const dmcaDetailOpen = ref(false)
const selectedDmca = ref<DmcaRequest | null>(null)
const dmcaAdminNotes = ref('')
const dmcaUpdating = ref(false)

const dmcaStats = computed(() => {
  const all = dmcaRequests.value
  return {
    total: all.length,
    pending: all.filter(r => r.status === 'pending').length,
    processing: all.filter(r => r.status === 'processing').length,
    removed: all.filter(r => r.status === 'content_removed').length,
  }
})

const getDmcaStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'yellow',
    processing: 'blue',
    content_removed: 'green',
    counter_notice: 'orange',
    resolved: 'gray',
    rejected: 'red',
  }
  return colors[status] || 'gray'
}

const loadDmcaRequests = async () => {
  dmcaLoading.value = true
  try {
    const data = await $fetch<{ requests: DmcaRequest[]; total: number }>('/api/admin/dmca', {
      query: {
        status: dmcaStatusFilter.value === 'all' ? undefined : dmcaStatusFilter.value,
        limit: 100,
      },
    })
    dmcaRequests.value = data.requests
    const pendingCount = data.requests.filter(r => r.status === 'pending').length
    emit('updatePendingCount', pendingCount)
  } catch (e) {
    console.error('Failed to load DMCA requests:', e)
    toast.add({ title: 'Failed to load DMCA requests', color: 'red' })
  } finally {
    dmcaLoading.value = false
  }
}

const openDmcaDetail = (request: DmcaRequest) => {
  selectedDmca.value = request
  dmcaAdminNotes.value = request.admin_notes || ''
  dmcaDetailOpen.value = true
}

const updateDmcaStatus = async (status: string) => {
  if (!selectedDmca.value) return

  dmcaUpdating.value = true
  try {
    await $fetch(`/api/admin/dmca/${selectedDmca.value.id}`, {
      method: 'PATCH',
      body: {
        status,
        admin_notes: dmcaAdminNotes.value || undefined,
      },
    })
    toast.add({ title: 'DMCA request updated', color: 'green' })
    dmcaDetailOpen.value = false
    selectedDmca.value = null
    await loadDmcaRequests()
  } catch (e) {
    console.error('Failed to update DMCA request:', e)
    toast.add({ title: 'Failed to update DMCA request', color: 'red' })
  } finally {
    dmcaUpdating.value = false
  }
}

const saveDmcaNotes = async () => {
  if (!selectedDmca.value) return

  dmcaUpdating.value = true
  try {
    await $fetch(`/api/admin/dmca/${selectedDmca.value.id}`, {
      method: 'PATCH',
      body: { admin_notes: dmcaAdminNotes.value },
    })
    toast.add({ title: 'Notes saved', color: 'green' })
    await loadDmcaRequests()
  } catch (e) {
    console.error('Failed to save notes:', e)
    toast.add({ title: 'Failed to save notes', color: 'red' })
  } finally {
    dmcaUpdating.value = false
  }
}

// Watch filter changes
watch(dmcaStatusFilter, () => {
  loadDmcaRequests()
})

onMounted(() => {
  loadDmcaRequests()

  // Subscribe to realtime updates for dmca_requests table
  subscribe({
    table: 'dmca_requests',
    onUpdate: loadDmcaRequests,
  })
})
</script>
