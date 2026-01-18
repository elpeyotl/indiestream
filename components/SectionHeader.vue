<template>
  <div :class="[centered ? 'text-center' : '', marginClass]">
    <h2 :class="titleClass">{{ title }}</h2>
    <p v-if="description" :class="descriptionClass">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  description?: string
  centered?: boolean
  size?: 'sm' | 'md' | 'lg'
  margin?: 'sm' | 'md' | 'lg'
}>()

const titleClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'text-xl md:text-2xl font-bold mb-2',
    md: 'text-2xl md:text-3xl font-bold mb-3',
    lg: 'text-3xl md:text-4xl font-bold mb-4',
  }
  return sizes[props.size || 'lg']
})

const descriptionClass = computed(() => {
  const base = 'text-zinc-400'
  return props.centered ? `${base} max-w-xl mx-auto` : base
})

const marginClass = computed(() => {
  const margins: Record<string, string> = {
    sm: 'mb-6',
    md: 'mb-12',
    lg: 'mb-16',
  }
  return margins[props.margin || 'lg']
})
</script>
