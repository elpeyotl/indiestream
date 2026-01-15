<script setup lang="ts">
const router = useRouter()
const route = useRoute()

// Simpler approach: show on all pages except these
const hideOnRoutes = [
  '/',
  '/discover',
  '/library',
  '/artists',
  '/dashboard',
  '/dashboard/settings',
  '/dashboard/listening',
  '/dashboard/my-impact',
  '/login',
  '/register',
  '/pricing',
  '/about',
  '/contact',
  '/for-artists',
  '/terms',
  '/privacy'
]

const showBack = computed(() => {
  // Normalize path (remove trailing slash)
  const normalizedPath = route.path.endsWith('/') && route.path !== '/'
    ? route.path.slice(0, -1)
    : route.path
  return !hideOnRoutes.includes(normalizedPath)
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <Transition name="fade">
    <button
      v-if="showBack"
      @click="goBack"
      class="inline-flex items-center gap-1.5 px-2 py-1.5 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 active:scale-95"
      aria-label="Go back"
    >
      <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
      <span class="text-sm font-medium hidden sm:inline">Back</span>
    </button>
  </Transition>
</template>
