<script setup lang="ts">
interface Props {
  pullDistance: number
  isRefreshing: boolean
  threshold: number
}

const props = defineProps<Props>()

// Calculate rotation for spinner based on pull distance
const rotation = computed(() => {
  if (props.isRefreshing) return 360
  return Math.min((props.pullDistance / props.threshold) * 360, 360)
})

// Calculate opacity based on pull distance
const opacity = computed(() => {
  return Math.min(props.pullDistance / props.threshold, 1)
})

// Scale animation for threshold reached
const scale = computed(() => {
  if (props.pullDistance >= props.threshold) return 1.1
  return Math.min(0.6 + (props.pullDistance / props.threshold) * 0.4, 1)
})
</script>

<template>
  <div
    v-if="pullDistance > 0 || isRefreshing"
    class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none md:hidden"
    :style="{
      transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
      transition: isRefreshing ? 'transform 0.3s ease-out' : 'none'
    }"
  >
    <div
      class="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/90 backdrop-blur-lg shadow-lg"
      :style="{
        opacity,
        transform: `scale(${scale})`,
        transition: 'transform 0.2s ease-out, opacity 0.2s ease-out'
      }"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-5 h-5 text-white"
        :class="{ 'animate-spin': isRefreshing }"
        :style="{
          transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
          transition: isRefreshing ? 'none' : 'transform 0.1s linear'
        }"
      />
    </div>
  </div>
</template>
