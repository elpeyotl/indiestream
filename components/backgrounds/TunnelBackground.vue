<template>
  <canvas ref="canvasRef" class="tunnel-background" />
</template>

<script setup lang="ts">
const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const canvasRef = ref<HTMLCanvasElement>()
let animationId: number
let time = 0
let hueShift = 0
let tunnelOffset = 0

const RING_COUNT = 25
const SEGMENTS = 12

const animate = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.max(width, height) * 0.8

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

  // Speed based on audio (slow, dreamy)
  const speed = 0.001 + bassIntensity * 0.001
  time += speed
  hueShift += 0.02 + midIntensity * 0.05
  tunnelOffset += 0.001 + bassIntensity * 0.0015

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  ctx.save()
  ctx.translate(centerX, centerY)

  // Tunnel rotation (slow)
  const tunnelRotation = time * 0.01
  ctx.rotate(tunnelRotation)

  // Draw tunnel rings from back to front
  for (let ring = RING_COUNT; ring >= 0; ring--) {
    // Calculate ring depth (0 = closest, RING_COUNT = furthest)
    const depthPhase = (ring / RING_COUNT + tunnelOffset) % 1
    const depth = depthPhase

    // Rings get smaller as they go "into" the tunnel
    const scale = 0.1 + (1 - depth) * 0.9
    const radius = maxRadius * scale

    // Skip if too small
    if (radius < 5) continue

    // Color based on depth and hue shift
    const hue = (hueShift + depth * 180) % 360
    const saturation = 70 + midIntensity * 30
    const lightness = 30 + (1 - depth) * 40 + highIntensity * 20
    const alpha = 0.3 + (1 - depth) * 0.5

    // Wobble effect
    const wobbleAmount = 10 + bassIntensity * 30
    const wobbleSpeed = time * 2 + ring * 0.5

    // Draw segmented ring
    ctx.beginPath()
    for (let seg = 0; seg <= SEGMENTS; seg++) {
      const angle = (seg / SEGMENTS) * Math.PI * 2
      const wobble = Math.sin(wobbleSpeed + seg * 0.8) * wobbleAmount * (1 - depth)
      const r = radius + wobble
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r

      if (seg === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    // Gradient stroke for depth
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
    ctx.lineWidth = 2 + (1 - depth) * 4 + bassIntensity * 3
    ctx.stroke()

    // Inner glow on closer rings
    if (depth < 0.5) {
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${(0.5 - depth) * 0.5})`
      ctx.shadowBlur = 20 + bassIntensity * 30
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Draw connecting lines between segments for web effect
    if (ring % 3 === 0 && depth < 0.8) {
      const nextDepthPhase = ((ring - 3) / RING_COUNT + tunnelOffset) % 1
      const nextScale = 0.1 + (1 - nextDepthPhase) * 0.9
      const nextRadius = maxRadius * nextScale

      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`
      ctx.lineWidth = 1

      for (let seg = 0; seg < SEGMENTS; seg += 2) {
        const angle = (seg / SEGMENTS) * Math.PI * 2
        const wobble1 = Math.sin(wobbleSpeed + seg * 0.8) * wobbleAmount * (1 - depth)
        const wobble2 = Math.sin(time * 2 + (ring - 3) * 0.5 + seg * 0.8) * wobbleAmount * (1 - nextDepthPhase)

        const x1 = Math.cos(angle) * (radius + wobble1)
        const y1 = Math.sin(angle) * (radius + wobble1)
        const x2 = Math.cos(angle) * (nextRadius + wobble2)
        const y2 = Math.sin(angle) * (nextRadius + wobble2)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    }
  }

  // Flying particles coming toward viewer
  const particleCount = 30
  for (let p = 0; p < particleCount; p++) {
    const particlePhase = (p / particleCount + tunnelOffset * 2) % 1
    const particleDepth = particlePhase

    const angle = (p / particleCount) * Math.PI * 2 + time * 0.5
    const radius = maxRadius * (0.1 + (1 - particleDepth) * 0.7)
    const wobble = Math.sin(time * 3 + p) * 20

    const x = Math.cos(angle) * (radius + wobble)
    const y = Math.sin(angle) * (radius + wobble)

    const size = 2 + (1 - particleDepth) * 6 + highIntensity * 4
    const hue = (hueShift + p * 30 + particleDepth * 60) % 360
    const alpha = 0.4 + (1 - particleDepth) * 0.6

    // Particle with glow
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha})`
    ctx.fill()

    // Trail
    for (let t = 1; t < 4; t++) {
      const trailDepth = Math.min(1, particleDepth + t * 0.05)
      const trailRadius = maxRadius * (0.1 + (1 - trailDepth) * 0.7)
      const tx = Math.cos(angle) * (trailRadius + wobble)
      const ty = Math.sin(angle) * (trailRadius + wobble)
      const trailSize = size * (1 - t * 0.25)

      ctx.beginPath()
      ctx.arc(tx, ty, Math.max(1, trailSize), 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha * (1 - t * 0.3)})`
      ctx.fill()
    }
  }

  ctx.restore()

  // Central bright point (vanishing point)
  const centerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100)
  centerGlow.addColorStop(0, `hsla(${hueShift % 360}, 80%, 80%, ${0.3 + bassIntensity * 0.3})`)
  centerGlow.addColorStop(0.5, `hsla(${(hueShift + 60) % 360}, 70%, 50%, 0.1)`)
  centerGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = centerGlow
  ctx.fillRect(centerX - 100, centerY - 100, 200, 200)

  // Flash on heavy bass
  if (bassIntensity > 0.7) {
    ctx.fillStyle = `hsla(${hueShift % 360}, 100%, 80%, ${(bassIntensity - 0.7) * 0.3})`
    ctx.fillRect(0, 0, width, height)
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
.tunnel-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
