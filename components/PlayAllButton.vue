<template>
  <button
    class="px-6 py-3 bg-fuchsia-600 text-white font-bold uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all inline-flex items-center gap-2 disabled:opacity-50"
    :disabled="loading"
    @click="$emit('click')"
  >
    <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
    <UIcon v-else name="i-heroicons-play" class="w-5 h-5" />
    Play All
  </button>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

defineEmits<{
  click: []
}>()
</script>
