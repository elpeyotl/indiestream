<script setup lang="ts">
interface Props {
  src: string
  alt: string
  class?: string
  aspectRatio?: string
}

const props = defineProps<Props>()

const loaded = ref(false)
const error = ref(false)

const handleLoad = () => {
  loaded.value = true
}

const handleError = () => {
  error.value = true
  loaded.value = true
}
</script>

<template>
  <div class="relative" :class="aspectRatio ? 'w-full' : ''">
    <!-- Skeleton while loading -->
    <div
      v-if="!loaded"
      class="absolute inset-0 skeleton"
      :style="aspectRatio ? { paddingBottom: aspectRatio } : {}"
    />

    <!-- Image with fade-in -->
    <img
      :src="src"
      :alt="alt"
      :class="[
        'transition-opacity duration-500',
        loaded ? 'opacity-100' : 'opacity-0',
        props.class
      ]"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>
