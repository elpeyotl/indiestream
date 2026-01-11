<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Global app setup
useHead({
  htmlAttrs: {
    lang: 'en',
    class: 'dark', // Force dark mode
  },
})
</script>
