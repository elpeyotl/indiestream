<template>
  <NuxtLink v-if="to" :to="to" class="flex items-center gap-2 group">
    <img src="/logo.svg" alt="Fairtune" :class="iconSizeClass" />
    <div v-if="showText" :class="textSizeClass" class="font-bold">
      <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Fair</span><span class="text-zinc-100">tune</span>
    </div>
  </NuxtLink>
  <div v-else class="flex items-center gap-2 group">
    <img src="/logo.svg" alt="Fairtune" :class="iconSizeClass" />
    <div v-if="showText" :class="textSizeClass" class="font-bold">
      <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Fair</span><span class="text-zinc-100">tune</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  to?: string
}>(), {
  size: 'md',
  showText: true,
  to: '/',
})

const iconSizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }
  return sizes[props.size]
})

const textSizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }
  return sizes[props.size]
})
</script>
