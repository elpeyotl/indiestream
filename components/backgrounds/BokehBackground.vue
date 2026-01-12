<template>
  <canvas v-if="!isMobile" ref="canvasRef" class="bokeh-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
const isMobile = ref(false)
let animationId: number
let bokehLights: BokehLight[] = []

// Check if device is mobile (width < 768px or touch device)
const checkMobile = () => {
  if (import.meta.server) return false
  return window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

interface BokehLight {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
  pulse: number
  pulseSpeed: number
}

const LIGHT_COUNT = 15
const colors = ['#8B5CF6', '#A78BFA', '#D946EF', '#E879F9', '#06B6D4']

const createLight = (canvas: HTMLCanvasElement): BokehLight => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 80 + 40,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.15 + 0.05,
    color: colors[Math.floor(Math.random() * colors.length)],
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.02 + 0.01,
  }
}

const initLights = (canvas: HTMLCanvasElement) => {
  bokehLights = []
  for (let i = 0; i < LIGHT_COUNT; i++) {
    bokehLights.push(createLight(canvas))
  }
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 139, g: 92, b: 246 }
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

  for (const light of bokehLights) {
    light.x += light.speedX
    light.y += light.speedY
    light.pulse += light.pulseSpeed

    if (light.x < -light.size) light.x = canvas.width + light.size
    if (light.x > canvas.width + light.size) light.x = -light.size
    if (light.y < -light.size) light.y = canvas.height + light.size
    if (light.y > canvas.height + light.size) light.y = -light.size

    const pulseFactor = 1 + Math.sin(light.pulse) * 0.2
    const size = light.size * pulseFactor * (1 + audioIntensity * 0.3)
    const opacity = light.opacity * (1 + audioIntensity * 0.5)

    const rgb = hexToRgb(light.color)
    const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, size)
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`)
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.5})`)
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`)

    ctx.beginPath()
    ctx.arc(light.x, light.y, size, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  animationId = requestAnimationFrame(animate)
}

const handleResize = () => {
  // Re-check mobile on resize
  isMobile.value = checkMobile()

  if (isMobile.value) {
    // Stop animation if switched to mobile
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = 0
    }
    return
  }

  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initLights(canvas)

  // Restart animation if not running
  if (!animationId) {
    animate()
  }
}

onMounted(() => {
  if (import.meta.server) return

  // Check if mobile device
  isMobile.value = checkMobile()
  if (isMobile.value) return

  // Wait for next tick to ensure canvas is rendered
  nextTick(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initLights(canvas)
    animate()
  })

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.bokeh-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
