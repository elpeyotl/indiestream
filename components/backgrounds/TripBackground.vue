<template>
  <canvas ref="canvasRef" class="trip-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number
let time = 0
let hueShift = 0

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = height / 2

  // Calculate audio intensity
  let bassIntensity = 0
  let midIntensity = 0
  let highIntensity = 0

  if (props.audioData && props.audioData.length > 0) {
    const len = props.audioData.length
    // Bass
    let bassSum = 0
    for (let i = 0; i < len / 4; i++) bassSum += props.audioData[i]
    bassIntensity = bassSum / (len / 4) / 255

    // Mids
    let midSum = 0
    for (let i = Math.floor(len / 4); i < len / 2; i++) midSum += props.audioData[i]
    midIntensity = midSum / (len / 4) / 255

    // Highs
    let highSum = 0
    for (let i = Math.floor(len / 2); i < len; i++) highSum += props.audioData[i]
    highIntensity = highSum / (len / 2) / 255
  } else {
    // Idle animation
    bassIntensity = 0.3 + Math.sin(time * 0.5) * 0.2
    midIntensity = 0.3 + Math.sin(time * 0.7) * 0.2
    highIntensity = 0.3 + Math.sin(time * 0.9) * 0.2
  }

  time += 0.02 + bassIntensity * 0.03
  hueShift += 0.5 + midIntensity * 2

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Number of kaleidoscope segments
  const segments = 8
  const angleStep = (Math.PI * 2) / segments

  ctx.save()
  ctx.translate(centerX, centerY)

  // Draw swirling patterns
  for (let s = 0; s < segments; s++) {
    ctx.save()
    ctx.rotate(s * angleStep)

    // Spiral arms
    const spiralCount = 3
    for (let spiral = 0; spiral < spiralCount; spiral++) {
      const spiralOffset = (spiral / spiralCount) * Math.PI * 2

      for (let i = 0; i < 30; i++) {
        const distance = 20 + i * 15 + bassIntensity * 50
        const angle = time + i * 0.2 + spiralOffset
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance * 0.5

        const size = 5 + Math.sin(time + i * 0.3) * 3 + highIntensity * 10
        const hue = (hueShift + i * 12 + spiral * 40) % 360
        const saturation = 70 + midIntensity * 30
        const lightness = 50 + highIntensity * 20

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.6 - i * 0.015})`
        ctx.fill()
      }
    }

    ctx.restore()
  }

  // Central pulsing mandala
  const mandalaLayers = 5
  for (let layer = mandalaLayers; layer >= 0; layer--) {
    const layerRadius = 30 + layer * 25 + bassIntensity * 40
    const points = 6 + layer * 2
    const rotation = time * (layer % 2 === 0 ? 1 : -1) * 0.3

    ctx.beginPath()
    for (let p = 0; p <= points; p++) {
      const angle = (p / points) * Math.PI * 2 + rotation
      const wobble = Math.sin(time * 3 + p) * (5 + midIntensity * 15)
      const r = layerRadius + wobble
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r

      if (p === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    const hue = (hueShift + layer * 30) % 360
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.7 - layer * 0.1})`
    ctx.lineWidth = 2 + bassIntensity * 3
    ctx.stroke()

    // Fill with gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius)
    gradient.addColorStop(0, `hsla(${(hue + 60) % 360}, 70%, 50%, ${0.1 + bassIntensity * 0.1})`)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fill()
  }

  // Floating particles that orbit
  const particleCount = 20
  for (let p = 0; p < particleCount; p++) {
    const orbitRadius = 150 + Math.sin(time * 0.5 + p) * 100
    const orbitSpeed = 0.3 + (p % 3) * 0.2
    const angle = time * orbitSpeed + (p / particleCount) * Math.PI * 2
    const x = Math.cos(angle) * orbitRadius
    const y = Math.sin(angle) * orbitRadius * 0.6
    const z = Math.sin(angle + time) // fake depth

    const size = 3 + z * 3 + highIntensity * 5
    const hue = (hueShift + p * 18) % 360
    const alpha = 0.5 + z * 0.3

    ctx.beginPath()
    ctx.arc(x, y, Math.max(1, size), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha})`
    ctx.fill()

    // Particle trail
    for (let t = 1; t < 5; t++) {
      const trailAngle = angle - t * 0.1
      const tx = Math.cos(trailAngle) * orbitRadius
      const ty = Math.sin(trailAngle) * orbitRadius * 0.6
      ctx.beginPath()
      ctx.arc(tx, ty, size * (1 - t * 0.2), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha * (1 - t * 0.2)})`
      ctx.fill()
    }
  }

  ctx.restore()

  // Chromatic aberration / RGB split effect on heavy bass
  if (bassIntensity > 0.5) {
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = (bassIntensity - 0.5) * 0.3

    // Red shift
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
    ctx.fillRect(3, 0, width, height)

    // Blue shift
    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)'
    ctx.fillRect(-3, 0, width, height)

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

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
.trip-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
