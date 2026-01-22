<template>
  <NuxtLink v-if="to" :to="to" class="flex items-center group">
    <!-- Mobile: Icon only -->
    <img src="/logo.png" alt="Fairtune" :class="[iconSizeClass, 'lg:hidden']" />
    <!-- Desktop: Logo with tagline -->
    <img src="/logo-text.svg" alt="Fairtune - Heavy Riffs. Fair Pay. No Bullshit." :class="[textLogoSizeClass, 'hidden lg:block']" />
  </NuxtLink>
  <div v-else class="flex items-center group">
    <!-- Logo with tagline (always visible) -->
    <img src="/logo-text.svg" alt="Fairtune - Heavy Riffs. Fair Pay. No Bullshit." :class="textLogoSizeClass" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl'
    to?: string
  }>(),
  {
    size: 'md',
    to: '/',
  },
)

const iconSizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-14 w-auto',
  }
  return sizes[props.size]
})

const textLogoSizeClass = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
    xl: 'h-16',
  }
  return sizes[props.size]
})
</script>
