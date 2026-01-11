<template>
  <canvas ref="canvasRef" class="particle-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number
let particles: Particle[] = []

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}

const PARTICLE_COUNT = 60
const colors = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#D946EF', '#E879F9']

const createParticle = (canvas: HTMLCanvasElement): Particle => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 3 + 1.5,
    speedX: (Math.random() - 0.5) * 0.4,
    speedY: (Math.random() - 0.5) * 0.4,
    opacity: Math.random() * 0.5 + 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

const initParticles = (canvas: HTMLCanvasElement) => {
  particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle(canvas))
  }
}

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Calculate audio intensity for reactivity
  let audioIntensity = 0
  if (props.audioData && props.audioData.length > 0) {
    const bassEnd = Math.floor(props.audioData.length / 4)
    let sum = 0
    for (let i = 0; i < bassEnd; i++) {
      sum += props.audioData[i]
    }
    audioIntensity = sum / bassEnd / 255
  }

  // Update and draw particles
  for (const particle of particles) {
    // Move particle
    particle.x += particle.speedX * (1 + audioIntensity * 2)
    particle.y += particle.speedY * (1 + audioIntensity * 2)

    // Wrap around edges
    if (particle.x < 0) particle.x = canvas.width
    if (particle.x > canvas.width) particle.x = 0
    if (particle.y < 0) particle.y = canvas.height
    if (particle.y > canvas.height) particle.y = 0

    // Draw particle with audio-reactive size and opacity
    const size = particle.size * (1 + audioIntensity * 1.5)
    const opacity = particle.opacity * (1 + audioIntensity * 0.5)

    ctx.beginPath()
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2)
    ctx.fillStyle = particle.color
    ctx.globalAlpha = opacity
    ctx.fill()
  }

  ctx.globalAlpha = 1
  animationId = requestAnimationFrame(animate)
}

const handleResize = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initParticles(canvas)
}

onMounted(() => {
  if (import.meta.server) return

  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initParticles(canvas)
  animate()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
