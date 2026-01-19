<template>
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

<script setup lang="ts">
import { useAdminUtils } from '~/composables/useAdminUtils'

const { toast } = useAdminUtils()

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

// Apply default preset on mount
onMounted(() => {
  applyPreset('last-quarter')
})
</script>
