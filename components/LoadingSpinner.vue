<template>
  <div class="flex items-center justify-center" :class="paddingClass">
    <UIcon name="i-heroicons-arrow-path" :class="[sizeClass, 'text-zinc-400 animate-spin']" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  size?: 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}>()

const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  return sizes[props.size || 'md']
})

const paddingClass = computed(() => {
  const paddings: Record<string, string> = {
    none: '',
    sm: 'py-8',
    md: 'py-20',
    lg: 'py-32',
  }
  return paddings[props.padding || 'md']
})
</script>
