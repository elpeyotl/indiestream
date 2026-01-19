<template>
  <canvas ref="canvasRef" class="inferno-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number

interface Ember {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  life: number
  maxLife: number
  color: string
}

const embers: Ember[] = []
const MAX_EMBERS = 80

// Dark metal color palette - reds, oranges, deep purples
const colors = [
  '#ff4500', // orange red
  '#ff6b35', // flame orange
  '#dc143c', // crimson
  '#8b0000', // dark red
  '#4a0e0e', // blood
  '#2d0a0a', // deep blood
  '#ff2400', // scarlet
  '#cc0000', // pure red
]

const createEmber = (canvas: HTMLCanvasElement, intensity: number): Ember => {
  const fromBottom = Math.random() > 0.3
  return {
    x: Math.random() * canvas.width,
    y: fromBottom ? canvas.height + 10 : Math.random() * canvas.height,
    size: Math.random() * 4 + 1 + intensity * 3,
    speedY: -(Math.random() * 2 + 1 + intensity * 2),
    speedX: (Math.random() - 0.5) * 2,
    life: 0,
    maxLife: Math.random() * 100 + 50,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Calculate audio intensity (focus on bass and mids for metal)
  let bassIntensity = 0
  let midIntensity = 0
  if (props.audioData && props.audioData.length > 0) {
    // Bass frequencies (first quarter)
    const bassEnd = Math.floor(props.audioData.length / 4)
    let bassSum = 0
    for (let i = 0; i < bassEnd; i++) {
      bassSum += props.audioData[i]
    }
    bassIntensity = bassSum / bassEnd / 255

    // Mid frequencies (second quarter - guitars, vocals)
    const midStart = bassEnd
    const midEnd = Math.floor(props.audioData.length / 2)
    let midSum = 0
    for (let i = midStart; i < midEnd; i++) {
      midSum += props.audioData[i]
    }
    midIntensity = midSum / (midEnd - midStart) / 255
  }

  const totalIntensity = (bassIntensity * 0.6 + midIntensity * 0.4)

  // Clear canvas (transparent - parent provides background)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Spawn new embers based on intensity
  const spawnRate = Math.floor(2 + totalIntensity * 6)
  for (let i = 0; i < spawnRate && embers.length < MAX_EMBERS; i++) {
    embers.push(createEmber(canvas, totalIntensity))
  }

  // Update and draw embers
  for (let i = embers.length - 1; i >= 0; i--) {
    const ember = embers[i]

    // Update position with turbulence
    ember.y += ember.speedY * (1 + totalIntensity)
    ember.x += ember.speedX + Math.sin(ember.life * 0.1) * 0.5
    ember.life++

    // Flicker effect
    const flicker = 0.7 + Math.random() * 0.3

    // Calculate opacity based on life
    const lifeRatio = ember.life / ember.maxLife
    const opacity = Math.sin(lifeRatio * Math.PI) * flicker

    // Draw ember with glow
    const glowSize = ember.size * (2 + totalIntensity * 2)

    // Outer glow
    const gradient = ctx.createRadialGradient(
      ember.x, ember.y, 0,
      ember.x, ember.y, glowSize
    )
    gradient.addColorStop(0, `${ember.color}`)
    gradient.addColorStop(0.4, `${ember.color}88`)
    gradient.addColorStop(1, 'transparent')

    ctx.globalAlpha = opacity * 0.6
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(ember.x, ember.y, glowSize, 0, Math.PI * 2)
    ctx.fill()

    // Core
    ctx.globalAlpha = opacity
    ctx.fillStyle = ember.color
    ctx.beginPath()
    ctx.arc(ember.x, ember.y, ember.size * flicker, 0, Math.PI * 2)
    ctx.fill()

    // Remove dead embers
    if (ember.life >= ember.maxLife || ember.y < -20) {
      embers.splice(i, 1)
    }
  }

  // Add occasional lightning/flash on heavy beats
  if (bassIntensity > 0.7 && Math.random() > 0.85) {
    ctx.globalAlpha = bassIntensity * 0.15
    ctx.fillStyle = '#ff4500'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
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

  handleResize()
  animationId = requestAnimationFrame(animate)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
  embers.length = 0
})
</script>

<style scoped>
.inferno-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
