<template>
  <component
    :is="backgroundComponent"
    v-if="backgroundComponent"
    :key="`${currentEffect}-${componentKey}`"
    :audio-data="audioData"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent, type Component } from 'vue'

// Lazy-load all background components to reduce initial bundle size
const ParticleBackground = defineAsyncComponent(() => import('~/components/ParticleBackground.vue'))
const GradientOrbsBackground = defineAsyncComponent(() => import('~/components/backgrounds/GradientOrbsBackground.vue'))
const NoiseBackground = defineAsyncComponent(() => import('~/components/backgrounds/NoiseBackground.vue'))
const BokehBackground = defineAsyncComponent(() => import('~/components/backgrounds/BokehBackground.vue'))
const ConstellationBackground = defineAsyncComponent(() => import('~/components/backgrounds/ConstellationBackground.vue'))
const VinylGroovesBackground = defineAsyncComponent(() => import('~/components/backgrounds/VinylGroovesBackground.vue'))
const EqualizerBackground = defineAsyncComponent(() => import('~/components/backgrounds/EqualizerBackground.vue'))
const TripBackground = defineAsyncComponent(() => import('~/components/backgrounds/TripBackground.vue'))
const TunnelBackground = defineAsyncComponent(() => import('~/components/backgrounds/TunnelBackground.vue'))

const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const { currentEffect } = useBackgroundEffect()

// Force component key to update when effect changes
const componentKey = ref(0)
watch(currentEffect, () => {
  componentKey.value++
}, { flush: 'sync' })

const backgroundComponent = computed<Component | null>(() => {
  switch (currentEffect.value) {
    case 'particles':
      return ParticleBackground
    case 'gradient-orbs':
      return GradientOrbsBackground
    case 'noise':
      return NoiseBackground
    case 'bokeh':
      return BokehBackground
    case 'constellation':
      return ConstellationBackground
    case 'vinyl':
      return VinylGroovesBackground
    case 'equalizer':
      return EqualizerBackground
    case 'trip':
      return TripBackground
    case 'tunnel':
      return TunnelBackground
    case 'none':
    default:
      return null
  }
})
</script>
