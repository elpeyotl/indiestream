<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="opacity-0 -translate-y-2"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <!-- Back online banner -->
    <div
      v-if="showBackOnline"
      class="bg-emerald-900/80 text-emerald-200 text-sm px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-sm cursor-pointer"
      @click="goBackOnline"
    >
      <UIcon name="i-heroicons-wifi" class="w-4 h-4" />
      <span>Du bist wieder online</span>
      <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isOnline } = useNetworkStatus()
const router = useRouter()
const route = useRoute()

const wasOffline = ref(false)
const showBackOnline = ref(false)

watch(isOnline, (online) => {
  if (!online) {
    wasOffline.value = true
    // Redirect to /offline when going offline
    if (route.path !== '/offline') {
      navigateTo('/offline')
    }
  } else if (wasOffline.value) {
    // Came back online after being offline
    wasOffline.value = false
    showBackOnline.value = true
    // Auto-hide after 5 seconds
    setTimeout(() => {
      showBackOnline.value = false
    }, 5000)
  }
})

const goBackOnline = () => {
  showBackOnline.value = false
  navigateTo('/discover')
}
</script>
