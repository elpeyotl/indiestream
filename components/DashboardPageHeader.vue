<template>
  <div class="mb-8">
    <NuxtLink to="/dashboard" class="text-zinc-400 hover:text-zinc-300 text-sm flex items-center gap-1 mb-4">
      <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
      Back to Dashboard
    </NuxtLink>
    <h1 class="text-3xl font-bold text-zinc-100">{{ title }}</h1>
    <p v-if="description" class="text-zinc-400 mt-2">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>
