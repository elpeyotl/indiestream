<script setup lang="ts">
const router = useRouter()
const route = useRoute()

// Simpler approach: show on all pages except these
const hideOnRoutes = [
  '/',
  '/discover',
  '/library',
  '/artists',
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
  return !hideOnRoutes.includes(route.path)
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
