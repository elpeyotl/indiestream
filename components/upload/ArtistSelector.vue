<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <h2 class="text-lg font-semibold text-zinc-100">Select Artist Profile</h2>
    </template>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
    </div>

    <div v-else-if="bands.length === 0" class="text-center py-8">
      <p class="text-zinc-400 mb-4">You need an approved artist profile to upload music.</p>
      <p class="text-sm text-zinc-500 mb-4">If your profile is pending approval, please wait for an admin to review it.</p>
      <UButton color="violet" to="/dashboard/artist/new">
        Create Artist Profile
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <button
        v-for="band in bands"
        :key="band.id"
        class="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
        @click="$emit('select', band)"
      >
        <div
          class="w-12 h-12 rounded-lg overflow-hidden shrink-0"
          :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
        >
          <img v-if="band.avatar_url" :src="band.avatar_url" :alt="band.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-lg font-bold text-white">{{ band.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-zinc-100">{{ band.name }}</h3>
          <p class="text-sm text-zinc-400">{{ band.slug }}</p>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-500" />
      </button>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'

defineProps<{
  bands: Band[]
  loading: boolean
}>()

defineEmits<{
  select: [band: Band]
}>()
</script>
