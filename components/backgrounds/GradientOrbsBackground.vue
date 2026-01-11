<template>
  <div class="gradient-orbs-background">
    <div
      v-for="orb in orbs"
      :key="orb.id"
      class="orb"
      :style="orb.style"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

interface Orb {
  id: number
  style: Record<string, string>
}

const orbs = ref<Orb[]>([])

const colors = [
  'rgba(139, 92, 246, 0.3)',  // violet
  'rgba(217, 70, 239, 0.25)', // fuchsia
  'rgba(167, 139, 250, 0.2)', // violet-400
  'rgba(6, 182, 212, 0.2)',   // cyan
]

const createOrbs = () => {
  orbs.value = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`,
      width: `${Math.random() * 300 + 200}px`,
      height: `${Math.random() * 300 + 200}px`,
      background: colors[i % colors.length],
      animationDuration: `${Math.random() * 10 + 15}s`,
      animationDelay: `${Math.random() * -10}s`,
    },
  }))
}

onMounted(() => {
  createOrbs()
})
</script>

<style scoped>
.gradient-orbs-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float linear infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -30px) scale(1.1);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  75% {
    transform: translate(-30px, -20px) scale(1.05);
  }
}
</style>
