<template>
  <component
    :is="backgroundComponent"
    v-if="backgroundComponent"
    :audio-data="audioData"
  />
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import ParticleBackground from '~/components/ParticleBackground.vue'
import GradientOrbsBackground from '~/components/backgrounds/GradientOrbsBackground.vue'
import NoiseBackground from '~/components/backgrounds/NoiseBackground.vue'
import BokehBackground from '~/components/backgrounds/BokehBackground.vue'
import ConstellationBackground from '~/components/backgrounds/ConstellationBackground.vue'
import VinylGroovesBackground from '~/components/backgrounds/VinylGroovesBackground.vue'
import EqualizerBackground from '~/components/backgrounds/EqualizerBackground.vue'
import TripBackground from '~/components/backgrounds/TripBackground.vue'
import TunnelBackground from '~/components/backgrounds/TunnelBackground.vue'

const props = defineProps<{
  audioData?: Uint8Array | null
}>()

const { currentEffect } = useBackgroundEffect()

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
