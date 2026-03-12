<template>
  <div v-if="storageQuota > 0" class="space-y-1">
    <div class="flex items-center justify-between text-xs text-zinc-400">
      <span>{{ formatBytes(totalStorageUsed) }} used</span>
      <span>{{ formatBytes(storageQuota) }} available</span>
    </div>
    <div class="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="usagePercent > 80 ? 'bg-amber-500' : 'bg-violet-500'"
        :style="{ width: `${Math.min(usagePercent, 100)}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const offlineStore = useOfflineStore()

const totalStorageUsed = computed(() => offlineStore.totalStorageUsed)
const storageQuota = computed(() => offlineStore.storageQuota)

const usagePercent = computed(() => {
  if (!storageQuota.value) return 0
  return (totalStorageUsed.value / storageQuota.value) * 100
})

const formatBytes = offlineStore.formatBytes
</script>
