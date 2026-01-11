<template>
  <canvas ref="canvasRef" class="vinyl-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number
let rotation = 0

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const centerX = canvas.width * 0.85
  const centerY = canvas.height * 0.7
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.6

  let audioIntensity = 0
  if (props.audioData && props.audioData.length > 0) {
    const bassEnd = Math.floor(props.audioData.length / 4)
    let sum = 0
    for (let i = 0; i < bassEnd; i++) {
      sum += props.audioData[i]
    }
    audioIntensity = sum / bassEnd / 255
  }

  // Rotate based on audio
  rotation += 0.002 + audioIntensity * 0.01

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)

  // Draw grooves
  const grooveCount = 40
  for (let i = 0; i < grooveCount; i++) {
    const radius = (i / grooveCount) * maxRadius + 50
    const opacity = 0.03 + (i / grooveCount) * 0.05 + audioIntensity * 0.02

    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
    ctx.lineWidth = 1 + audioIntensity * 2
    ctx.stroke()
  }

  // Center label
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60)
  gradient.addColorStop(0, 'rgba(217, 70, 239, 0.15)')
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)')

  ctx.beginPath()
  ctx.arc(0, 0, 60, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.restore()

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
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.vinyl-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
