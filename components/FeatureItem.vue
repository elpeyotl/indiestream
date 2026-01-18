<template>
  <div class="flex items-start gap-3">
    <UIcon :name="icon" class="w-6 h-6 mt-0.5" :class="iconColorClass" />
    <div>
      <p class="text-zinc-100 font-medium">{{ title }}</p>
      <p v-if="description" class="text-zinc-400 text-sm">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string
  title: string
  description?: string
  color?: 'green' | 'violet' | 'red' | 'gray'
}>()

const iconColorClass = computed(() => {
  const colors: Record<string, string> = {
    green: 'text-green-400',
    violet: 'text-violet-400',
    red: 'text-red-400',
    gray: 'text-zinc-400',
  }
  return colors[props.color || 'green']
})
</script>
