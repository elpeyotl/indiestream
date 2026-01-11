<template>
  <canvas ref="canvasRef" class="constellation-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number
let stars: Star[] = []

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinkleSpeed: number
  twinklePhase: number
}

const STAR_COUNT = 80
const CONNECTION_DISTANCE = 120

const createStar = (canvas: HTMLCanvasElement): Star => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.3,
    twinkleSpeed: Math.random() * 0.03 + 0.01,
    twinklePhase: Math.random() * Math.PI * 2,
  }
}

const initStars = (canvas: HTMLCanvasElement) => {
  stars = []
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(createStar(canvas))
  }
}

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let audioIntensity = 0
  if (props.audioData && props.audioData.length > 0) {
    const bassEnd = Math.floor(props.audioData.length / 4)
    let sum = 0
    for (let i = 0; i < bassEnd; i++) {
      sum += props.audioData[i]
    }
    audioIntensity = sum / bassEnd / 255
  }

  // Draw connections
  ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 + audioIntensity * 0.1})`
  ctx.lineWidth = 0.5

  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x
      const dy = stars[i].y - stars[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < CONNECTION_DISTANCE) {
        const opacity = (1 - distance / CONNECTION_DISTANCE) * 0.3
        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
        ctx.beginPath()
        ctx.moveTo(stars[i].x, stars[i].y)
        ctx.lineTo(stars[j].x, stars[j].y)
        ctx.stroke()
      }
    }
  }

  // Draw stars
  for (const star of stars) {
    star.twinklePhase += star.twinkleSpeed
    const twinkle = 0.5 + Math.sin(star.twinklePhase) * 0.5
    const opacity = star.opacity * twinkle * (1 + audioIntensity * 0.5)
    const size = star.size * (1 + audioIntensity * 0.5)

    ctx.beginPath()
    ctx.arc(star.x, star.y, size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(196, 181, 253, ${opacity})`
    ctx.fill()
  }

  animationId = requestAnimationFrame(animate)
}

const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initStars(canvas)
}

onMounted(() => {
  if (import.meta.server) return
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initStars(canvas)
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.constellation-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
