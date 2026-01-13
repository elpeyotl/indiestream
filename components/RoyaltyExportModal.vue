<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-zinc-100">Export Royalty Report</h3>
            <p class="text-sm text-zinc-400">Download stream data for PRO reporting</p>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Date Range Presets -->
        <UFormGroup label="Report Period">
          <div class="flex flex-wrap gap-2 mb-3">
            <UButton
              v-for="preset in datePresets"
              :key="preset.value"
              size="sm"
              :color="selectedPreset === preset.value ? 'violet' : 'gray'"
              :variant="selectedPreset === preset.value ? 'solid' : 'ghost'"
              @click="applyPreset(preset.value)"
            >
              {{ preset.label }}
            </UButton>
          </div>

          <!-- Custom Date Range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-zinc-500 mb-1 block">Start Date</label>
              <UInput v-model="startDate" type="date" size="sm" />
            </div>
            <div>
              <label class="text-xs text-zinc-500 mb-1 block">End Date</label>
              <UInput v-model="endDate" type="date" size="sm" />
            </div>
          </div>
        </UFormGroup>

        <!-- Format Selection -->
        <UFormGroup label="Export Format">
          <div class="flex gap-4">
            <URadio v-model="format" value="csv" label="CSV (spreadsheet)" />
            <URadio v-model="format" value="json" label="JSON (data)" />
          </div>
          <p class="text-xs text-zinc-500 mt-2">
            {{ format === 'csv' ? 'Best for Excel, Google Sheets, and manual PRO submissions' : 'Best for automated systems and integrations' }}
          </p>
        </UFormGroup>

        <!-- Help Section -->
        <UAccordion :items="helpItems" :ui="{ wrapper: 'border border-zinc-800 rounded-lg' }">
          <template #default="{ item, open }">
            <UButton
              color="gray"
              variant="ghost"
              class="w-full"
              :ui="{ padding: { sm: 'px-4 py-3' } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-question-mark-circle" class="w-5 h-5 text-zinc-400" />
              </template>
              <span class="text-sm">{{ item.label }}</span>
              <template #trailing>
                <UIcon
                  name="i-heroicons-chevron-down"
                  class="w-4 h-4 transition-transform"
                  :class="{ 'rotate-180': open }"
                />
              </template>
            </UButton>
          </template>

          <template #how-to-report>
            <div class="px-4 pb-4 text-sm text-zinc-300 space-y-4">
              <div>
                <h4 class="font-medium text-zinc-100 mb-2">What's a PRO?</h4>
                <p class="text-zinc-400">
                  A Performing Rights Organization collects royalties when your music is publicly performed, including on streaming platforms.
                </p>
              </div>

              <div>
                <h4 class="font-medium text-zinc-100 mb-2">Common PROs</h4>
                <ul class="list-disc list-inside text-zinc-400 space-y-1">
                  <li><strong>Germany:</strong> <a href="https://www.gema.de" target="_blank" class="text-violet-400 hover:underline">GEMA</a></li>
                  <li><strong>Switzerland:</strong> <a href="https://www.suisa.ch" target="_blank" class="text-violet-400 hover:underline">SUISA</a></li>
                  <li><strong>USA:</strong> <a href="https://www.ascap.com" target="_blank" class="text-violet-400 hover:underline">ASCAP</a>, <a href="https://www.bmi.com" target="_blank" class="text-violet-400 hover:underline">BMI</a>, SESAC</li>
                  <li><strong>UK:</strong> <a href="https://www.prsformusic.com" target="_blank" class="text-violet-400 hover:underline">PRS for Music</a></li>
                </ul>
              </div>

              <div>
                <h4 class="font-medium text-zinc-100 mb-2">How to Submit</h4>
                <ol class="list-decimal list-inside text-zinc-400 space-y-1">
                  <li>Download your report using the button below</li>
                  <li>Log into your PRO's member portal</li>
                  <li>Find "Report Usage" or "Submit Streams"</li>
                  <li>Upload your CSV or enter data manually</li>
                  <li>Most PROs accept quarterly reports</li>
                </ol>
              </div>
            </div>
          </template>

          <template #whats-included>
            <div class="px-4 pb-4 text-sm text-zinc-300 space-y-3">
              <ul class="space-y-2 text-zinc-400">
                <li><strong class="text-zinc-200">ISRC:</strong> International Standard Recording Code - identifies your recording</li>
                <li><strong class="text-zinc-200">ISWC:</strong> International Standard Musical Work Code - identifies the composition</li>
                <li><strong class="text-zinc-200">Play Count:</strong> Number of completed streams (30+ seconds)</li>
                <li><strong class="text-zinc-200">Territory:</strong> Country where the stream occurred</li>
                <li><strong class="text-zinc-200">Duration:</strong> Total listening time in seconds</li>
              </ul>

              <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
                <p class="text-amber-200 text-xs">
                  <strong>Note:</strong> Only streams from paying subscribers are included. Free plays don't generate royalties and are excluded from this report.
                </p>
              </div>
            </div>
          </template>

          <template #important-notes>
            <div class="px-4 pb-4 text-sm text-zinc-400 space-y-3">
              <ul class="space-y-2">
                <li>You must be a registered member of a PRO to collect royalties</li>
                <li>Indiestream does NOT automatically report to PROs - you are responsible for this</li>
                <li>Keep records of your submissions for your tax records</li>
                <li>Consider reporting quarterly to ensure timely payments</li>
              </ul>
            </div>
          </template>
        </UAccordion>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <p v-if="totalStreams !== null" class="text-sm text-zinc-400">
            {{ totalStreams }} streams in selected period
          </p>
          <div v-else></div>
          <div class="flex gap-3">
            <UButton color="gray" variant="ghost" @click="isOpen = false">
              Cancel
            </UButton>
            <UButton
              color="violet"
              :loading="exporting"
              :disabled="!startDate || !endDate"
              @click="exportReport"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-1" />
              Download {{ format.toUpperCase() }}
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  bandId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const startDate = ref('')
const endDate = ref('')
const format = ref<'csv' | 'json'>('csv')
const selectedPreset = ref('last-month')
const exporting = ref(false)
const totalStreams = ref<number | null>(null)

const datePresets = [
  { label: 'Last Month', value: 'last-month' },
  { label: 'Last Quarter', value: 'last-quarter' },
  { label: 'Year to Date', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
]

const helpItems = [
  { label: 'How to report to your PRO', slot: 'how-to-report' },
  { label: 'What\'s included in the export', slot: 'whats-included' },
  { label: 'Important notes', slot: 'important-notes' },
]

const applyPreset = (preset: string) => {
  selectedPreset.value = preset
  const now = new Date()

  switch (preset) {
    case 'last-month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      startDate.value = lastMonth.toISOString().split('T')[0]
      endDate.value = lastMonthEnd.toISOString().split('T')[0]
      break
    }
    case 'last-quarter': {
      const quarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      const quarterEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      startDate.value = quarterStart.toISOString().split('T')[0]
      endDate.value = quarterEnd.toISOString().split('T')[0]
      break
    }
    case 'ytd': {
      const yearStart = new Date(now.getFullYear(), 0, 1)
      startDate.value = yearStart.toISOString().split('T')[0]
      endDate.value = now.toISOString().split('T')[0]
      break
    }
    case 'custom':
      // Keep current values
      break
  }
}

// Initialize with last month
onMounted(() => {
  applyPreset('last-month')
})

const exportReport = async () => {
  if (!startDate.value || !endDate.value) {
    toast.add({ title: 'Please select a date range', color: 'red' })
    return
  }

  exporting.value = true

  try {
    const response = await $fetch('/api/analytics/export', {
      method: 'POST',
      body: {
        bandId: props.bandId,
        startDate: startDate.value,
        endDate: endDate.value,
        format: format.value,
      },
    })

    if (format.value === 'csv') {
      // Download CSV file
      const blob = new Blob([response as string], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `royalty-report-${startDate.value}-to-${endDate.value}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.add({ title: 'Report downloaded', description: 'CSV file saved to your downloads', color: 'green', icon: 'i-heroicons-check-circle' })
    } else {
      // Download JSON file
      const jsonData = response as object
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `royalty-report-${startDate.value}-to-${endDate.value}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show total streams from JSON response
      totalStreams.value = (jsonData as any).totals?.playCount || 0

      toast.add({ title: 'Report downloaded', description: 'JSON file saved to your downloads', color: 'green', icon: 'i-heroicons-check-circle' })
    }

    isOpen.value = false
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
</script>
