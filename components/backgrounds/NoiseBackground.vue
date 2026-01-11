<template>
  <div class="noise-background" />
</template>

<script setup lang="ts">
defineProps<{
  audioData?: Uint8Array | null
}>()
</script>

<style scoped>
.noise-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E");
  animation: noise 0.5s steps(5) infinite;
}

@keyframes noise {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1%, -1%); }
  20% { transform: translate(1%, 1%); }
  30% { transform: translate(-1%, 1%); }
  40% { transform: translate(1%, -1%); }
  50% { transform: translate(-1%, 0); }
  60% { transform: translate(1%, 0); }
  70% { transform: translate(0, 1%); }
  80% { transform: translate(0, -1%); }
  90% { transform: translate(1%, 1%); }
}
</style>
