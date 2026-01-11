<template>
  <canvas ref="canvasRef" class="equalizer-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number
let barHeights: number[] = []

const BAR_COUNT = 64
const colors = ['#8B5CF6', '#A78BFA', '#D946EF', '#E879F9']

const initBars = () => {
  barHeights = Array(BAR_COUNT).fill(0).map(() => Math.random() * 20 + 5)
}

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const barWidth = canvas.width / BAR_COUNT
  const maxHeight = canvas.height * 0.3

  for (let i = 0; i < BAR_COUNT; i++) {
    let targetHeight = 5

    if (props.audioData && props.audioData.length > 0) {
      const dataIndex = Math.floor((i / BAR_COUNT) * props.audioData.length)
      targetHeight = (props.audioData[dataIndex] / 255) * maxHeight
    }

    // Smooth animation
    barHeights[i] += (targetHeight - barHeights[i]) * 0.1

    // Idle animation when no audio
    if (!props.audioData || props.audioData.length === 0) {
      barHeights[i] = 5 + Math.sin(Date.now() * 0.002 + i * 0.2) * 10
    }

    const height = Math.max(3, barHeights[i])
    const x = i * barWidth
    const y = canvas.height - height

    const gradient = ctx.createLinearGradient(x, y, x, canvas.height)
    gradient.addColorStop(0, colors[i % colors.length])
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)')

    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.4
    ctx.fillRect(x + 1, y, barWidth - 2, height)
  }

  ctx.globalAlpha = 1
  animationId = requestAnimationFrame(animate)
}

const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

onMounted(() => {
  if (import.meta.server) return
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initBars()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.equalizer-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
