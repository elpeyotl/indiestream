<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="opacity-0 -translate-y-2"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="!isOnline"
      class="bg-amber-900/80 text-amber-200 text-sm px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-sm"
    >
      <UIcon name="i-heroicons-cloud-arrow-down" class="w-4 h-4" />
      <span>You're offline — playing from your downloads</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isOnline } = useNetworkStatus()
</script>
