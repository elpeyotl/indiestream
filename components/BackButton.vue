<script setup lang="ts">
const router = useRouter()
const route = useRoute()

// Determine if we should show the back button
const showBack = computed(() => {
  // Don't show on top-level pages
  const topLevelRoutes = ['/', '/discover', '/library', '/artists', '/login', '/register', '/pricing', '/about', '/contact', '/for-artists', '/terms', '/privacy']

  // Show back button if:
  // 1. Not on a top-level route
  // 2. Has navigation history
  return !topLevelRoutes.includes(route.path) && window.history.length > 1
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <button
    v-if="showBack"
    @click="goBack"
    class="fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-200 active:scale-95 shadow-lg md:top-6 md:left-6"
    aria-label="Go back"
  >
    <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
  </button>
</template>
