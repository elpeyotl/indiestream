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

  // Position record slightly off-center and lower right
  const centerX = canvas.width * 0.65
  const centerY = canvas.height * 0.55
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.5

  // Calculate audio intensity
  let bassIntensity = 0
  let midIntensity = 0
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
  } else {
    // Idle - still spinning slowly
    bassIntensity = 0.2
    midIntensity = 0.2
  }

  // Vinyl rotates at ~33 RPM = 0.55 rotations per second
  // At 60fps, that's about 0.058 radians per frame
  const baseSpeed = 0.015 // Slower for visual effect
  rotation += baseSpeed + bassIntensity * 0.02

  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)

  // Outer vinyl edge (slightly glossy)
  const vinylGradient = ctx.createRadialGradient(0, 0, maxRadius * 0.85, 0, 0, maxRadius)
  vinylGradient.addColorStop(0, 'rgba(20, 20, 25, 0.9)')
  vinylGradient.addColorStop(1, 'rgba(10, 10, 15, 0.95)')

  ctx.beginPath()
  ctx.arc(0, 0, maxRadius, 0, Math.PI * 2)
  ctx.fillStyle = vinylGradient
  ctx.fill()

  // Vinyl grooves - many thin circles with varying opacity
  const grooveCount = 80
  const grooveStart = maxRadius * 0.25 // Start after label
  const grooveEnd = maxRadius * 0.95

  for (let i = 0; i < grooveCount; i++) {
    const ratio = i / grooveCount
    const radius = grooveStart + ratio * (grooveEnd - grooveStart)

    // Grooves shimmer based on angle (light reflection)
    const shimmerAngle = rotation * 2 + ratio * 10
    const shimmer = 0.5 + Math.sin(shimmerAngle) * 0.3

    // Audio makes grooves pulse
    const audioBoost = ratio > 0.3 && ratio < 0.8 ? midIntensity * 0.15 : 0

    const baseOpacity = 0.08 + shimmer * 0.12 + audioBoost

    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(60, 60, 70, ${baseOpacity})`
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Add highlight grooves every few lines
    if (i % 8 === 0) {
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(100, 100, 120, ${baseOpacity * 0.5})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // Light reflection arc (the shiny part that moves as record spins)
  const reflectionAngle = rotation * 0.5
  ctx.beginPath()
  ctx.arc(0, 0, maxRadius * 0.6, reflectionAngle, reflectionAngle + Math.PI * 0.4)
  const reflectionGradient = ctx.createLinearGradient(
    Math.cos(reflectionAngle) * maxRadius * 0.3,
    Math.sin(reflectionAngle) * maxRadius * 0.3,
    Math.cos(reflectionAngle + Math.PI * 0.4) * maxRadius * 0.6,
    Math.sin(reflectionAngle + Math.PI * 0.4) * maxRadius * 0.6
  )
  reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  reflectionGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.06)')
  reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.strokeStyle = reflectionGradient
  ctx.lineWidth = maxRadius * 0.5
  ctx.stroke()

  // Center label
  const labelRadius = maxRadius * 0.22

  // Label background
  const labelGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, labelRadius)
  labelGradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)')
  labelGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.25)')
  labelGradient.addColorStop(1, 'rgba(100, 60, 180, 0.3)')

  ctx.beginPath()
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2)
  ctx.fillStyle = labelGradient
  ctx.fill()

  // Label ring
  ctx.beginPath()
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Center spindle hole
  ctx.beginPath()
  ctx.arc(0, 0, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fill()

  // Audio reactive glow from label
  if (bassIntensity > 0.3) {
    const glowRadius = labelRadius + bassIntensity * 30
    const glowGradient = ctx.createRadialGradient(0, 0, labelRadius, 0, 0, glowRadius)
    glowGradient.addColorStop(0, `rgba(139, 92, 246, ${bassIntensity * 0.3})`)
    glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)')

    ctx.beginPath()
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2)
    ctx.fillStyle = glowGradient
    ctx.fill()
  }

  ctx.restore()

  // Tonearm (static, doesn't rotate with record)
  drawTonearm(ctx, centerX, centerY, maxRadius, bassIntensity)

  animationId = requestAnimationFrame(animate)
}

const drawTonearm = (ctx: CanvasRenderingContext2D, vinylX: number, vinylY: number, vinylRadius: number, intensity: number) => {
  // Tonearm pivot point (top right of vinyl)
  const pivotX = vinylX + vinylRadius * 0.6
  const pivotY = vinylY - vinylRadius * 0.6

  // Shorter tonearm
  const armLength = vinylRadius * 0.55
  const armAngle = Math.PI * 0.6
  const endX = pivotX + Math.cos(armAngle) * armLength
  const endY = pivotY + Math.sin(armAngle) * armLength

  // Slight vibration on bass
  const vibration = intensity > 0.4 ? Math.sin(Date.now() * 0.05) * intensity * 1.5 : 0

  ctx.save()

  // Tonearm base/pivot (circular mount)
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, 10, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(60, 60, 70, 0.7)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(40, 40, 50, 0.8)'
  ctx.fill()

  // Tonearm tube
  ctx.beginPath()
  ctx.moveTo(pivotX, pivotY)
  ctx.lineTo(endX + vibration, endY + vibration)
  ctx.strokeStyle = 'rgba(90, 90, 100, 0.6)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.stroke()

  // Headshell - angled rectangular shape
  const headshellAngle = armAngle + Math.PI * 0.15
  const headshellLength = 18
  const headshellX = endX + vibration
  const headshellY = endY + vibration

  ctx.save()
  ctx.translate(headshellX, headshellY)
  ctx.rotate(headshellAngle)

  // Headshell body (rectangular with rounded end)
  ctx.beginPath()
  ctx.roundRect(-4, -5, headshellLength, 10, 2)
  ctx.fillStyle = 'rgba(70, 70, 80, 0.7)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(100, 100, 110, 0.5)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Cartridge (smaller rectangle on headshell)
  ctx.beginPath()
  ctx.roundRect(4, -3, 10, 6, 1)
  ctx.fillStyle = 'rgba(50, 50, 60, 0.8)'
  ctx.fill()

  // Stylus (small triangle/point at the end)
  ctx.beginPath()
  ctx.moveTo(headshellLength - 4, 0)
  ctx.lineTo(headshellLength + 2, -2)
  ctx.lineTo(headshellLength + 2, 2)
  ctx.closePath()
  ctx.fillStyle = 'rgba(80, 80, 90, 0.8)'
  ctx.fill()

  ctx.restore()

  // Stylus glow when playing
  if (intensity > 0.1) {
    const glowX = headshellX + Math.cos(headshellAngle) * (headshellLength - 2)
    const glowY = headshellY + Math.sin(headshellAngle) * (headshellLength - 2)
    ctx.beginPath()
    ctx.arc(glowX, glowY, 2 + intensity * 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(139, 92, 246, ${0.4 + intensity * 0.4})`
    ctx.fill()
  }

  ctx.restore()
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
