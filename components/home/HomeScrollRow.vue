<template>
  <div class="relative -mx-4 md:mx-0">
    <!-- Horizontal scroll on mobile, grid on desktop -->
    <div
      class="flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:overflow-visible md:px-0 md:pb-0"
      :class="gridCols"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  cols?: 4 | 5 | 6
}

const props = withDefaults(defineProps<Props>(), {
  cols: 5,
})

const gridCols = computed(() => {
  switch (props.cols) {
    case 4:
      return 'md:grid-cols-4'
    case 5:
      return 'md:grid-cols-4 lg:grid-cols-5'
    case 6:
      return 'md:grid-cols-4 lg:grid-cols-6'
    default:
      return 'md:grid-cols-4 lg:grid-cols-5'
  }
})
</script>

<style scoped>
/* Hide scrollbar but allow scrolling */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
