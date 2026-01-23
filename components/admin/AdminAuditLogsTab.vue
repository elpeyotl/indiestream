<template>
  <div class="py-6 space-y-6">
    <!-- Filters -->
    <div class="flex flex-wrap gap-4">
      <UInput
        v-model="searchQuery"
        placeholder="Search by summary or entity name..."
        size="lg"
        class="flex-1 min-w-[300px]"
        @keyup.enter="loadLogs(1)"
      >
        <template #leading>
          <UIcon name="i-heroicons-magnifying-glass" class="w-5 h-5 text-zinc-400" />
        </template>
      </UInput>

      <USelectMenu
        v-model="entityTypeFilter"
        :options="auditEntityTypeOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="Entity Type"
        size="lg"
        class="w-40"
        @update:model-value="loadLogs(1)"
      />

      <USelectMenu
        v-model="actionFilter"
        :options="auditActionOptions"
        value-attribute="value"
        option-attribute="label"
        placeholder="Action"
        size="lg"
        class="w-40"
        @update:model-value="loadLogs(1)"
      />

      <!-- Date Range -->
      <UPopover>
        <UButton color="gray" variant="ghost" icon="i-heroicons-calendar">
          {{ dateRangeLabel }}
        </UButton>
        <template #panel>
          <div class="p-4 space-y-4">
            <UFormGroup label="Start Date">
              <UInput v-model="startDate" type="date" />
            </UFormGroup>
            <UFormGroup label="End Date">
              <UInput v-model="endDate" type="date" />
            </UFormGroup>
            <div class="flex gap-2">
              <UButton size="sm" @click="applyDateFilter">Apply</UButton>
              <UButton size="sm" color="gray" variant="ghost" @click="clearDateFilter">Clear</UButton>
            </div>
          </div>
        </template>
      </UPopover>

      <UButton color="gray" @click="loadLogs()">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
      </UButton>
    </div>

    <!-- Audit Logs List -->
    <UCard class="bg-zinc-900/50 border-zinc-800">
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
      </div>

      <div v-else-if="logs.length === 0" class="text-center py-12 text-zinc-400">
        <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No audit logs found</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="log in logs"
          :key="log.id"
          class="border-b border-zinc-800 pb-4 last:border-0"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <!-- Action Badge & Entity Type -->
              <div class="flex items-center gap-2 mb-1">
                <UBadge
                  :color="getActionColor(log.action)"
                  variant="subtle"
                  size="xs"
                >
                  {{ formatAction(log.action) }}
                </UBadge>
                <span class="text-sm text-zinc-400">
                  {{ log.entity_type }}
                </span>
                <span v-if="log.entity_name" class="text-sm text-zinc-500">
                  · {{ log.entity_name }}
                </span>
              </div>

              <!-- Summary -->
              <p class="text-zinc-100">{{ log.summary }}</p>

              <!-- Admin & Time -->
              <p class="text-sm text-zinc-500 mt-1">
                by {{ log.admin?.display_name || log.admin?.email || 'Unknown' }}
                <span class="mx-1">·</span>
                {{ formatDate(log.created_at) }}
              </p>
            </div>

            <!-- Expand Button for Details -->
            <UButton
              v-if="log.old_value || log.new_value"
              size="xs"
              color="gray"
              variant="ghost"
              @click="toggleExpand(log.id)"
            >
              <UIcon
                :name="expandedIds.has(log.id) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                class="w-4 h-4"
              />
            </UButton>
          </div>

          <!-- Expanded Details: Before/After Comparison -->
          <div
            v-if="expandedIds.has(log.id) && (log.old_value || log.new_value)"
            class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div v-if="log.old_value" class="bg-red-500/10 rounded-lg p-3">
              <p class="text-xs text-red-400 mb-2 font-medium">Before</p>
              <pre class="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">{{ formatJson(log.old_value) }}</pre>
            </div>
            <div v-if="log.new_value" class="bg-green-500/10 rounded-lg p-3">
              <p class="text-xs text-green-400 mb-2 font-medium">After</p>
              <pre class="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">{{ formatJson(log.new_value) }}</pre>
            </div>
          </div>

          <!-- Metadata if present -->
          <div
            v-if="expandedIds.has(log.id) && log.metadata && Object.keys(log.metadata).length > 0"
            class="mt-2 bg-zinc-800/50 rounded-lg p-3"
          >
            <p class="text-xs text-zinc-400 mb-2 font-medium">Additional Info</p>
            <pre class="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">{{ formatJson(log.metadata) }}</pre>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
        <p class="text-sm text-zinc-400">
          Showing {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }}
        </p>
        <div class="flex gap-2">
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="pagination.page <= 1"
            @click="loadLogs(pagination.page - 1)"
          >
            Previous
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            size="sm"
            :disabled="pagination.page >= pagination.totalPages"
            @click="loadLogs(pagination.page + 1)"
          >
            Next
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { AdminAuditLog } from '~/types/admin'
import { auditEntityTypeOptions, auditActionOptions } from '~/types/admin'
import { useAdminUtils } from '~/composables/useAdminUtils'

const { toast, formatDate } = useAdminUtils()

const logs = ref<AdminAuditLog[]>([])
const loading = ref(false)
const expandedIds = ref<Set<string>>(new Set())

// Filters
const searchQuery = ref('')
const entityTypeFilter = ref('all')
const actionFilter = ref('all')
const startDate = ref('')
const endDate = ref('')

// Pagination
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
})

const dateRangeLabel = computed(() => {
  if (startDate.value && endDate.value) {
    return `${startDate.value} - ${endDate.value}`
  }
  if (startDate.value) {
    return `From ${startDate.value}`
  }
  if (endDate.value) {
    return `Until ${endDate.value}`
  }
  return 'Date Range'
})

interface AuditLogsResponse {
  logs: AdminAuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const loadLogs = async (page = 1) => {
  loading.value = true
  try {
    const data = await $fetch<AuditLogsResponse>('/api/admin/audit-logs', {
      query: {
        page,
        limit: 50,
        entity_type: entityTypeFilter.value,
        action: actionFilter.value,
        search: searchQuery.value,
        start_date: startDate.value,
        end_date: endDate.value,
      },
    })
    logs.value = data.logs
    pagination.value = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    }
  } catch (e: any) {
    console.error('Failed to load audit logs:', e)
    toast.add({
      title: 'Failed to load audit logs',
      description: e.message,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

const toggleExpand = (id: string) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

const getActionColor = (action: string): 'red' | 'green' | 'yellow' | 'gray' => {
  if (action.includes('delete')) return 'red'
  if (action.includes('approve') || action.includes('verify') || action.includes('feature') || action.includes('publish')) return 'green'
  if (action.includes('reject') || action.includes('suspend') || action.includes('unpublish')) return 'yellow'
  return 'gray'
}

const formatAction = (action: string): string => {
  // Convert "band.suspend" to "Suspend"
  const actionPart = action.split('.').pop() || action
  return actionPart.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const formatJson = (obj: Record<string, unknown> | null): string => {
  if (!obj) return ''
  return JSON.stringify(obj, null, 2)
}

const applyDateFilter = () => {
  loadLogs(1)
}

const clearDateFilter = () => {
  startDate.value = ''
  endDate.value = ''
  loadLogs(1)
}

onMounted(() => {
  loadLogs()
})
</script>
