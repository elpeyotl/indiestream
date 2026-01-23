<template>
  <UButton
    :color="color"
    :variant="variant"
    :size="size"
    @click="showTipModal = true"
  >
    <UIcon name="i-heroicons-heart" class="w-4 h-4 mr-1.5" />
    Tip {{ artistName }}
  </UButton>

  <TipModal
    v-model="showTipModal"
    :band="band"
    :artist-name="artistName"
    :avatar-url="avatarUrl"
  />
</template>

<script setup lang="ts">
import type { ButtonColor, ButtonVariant, ButtonSize } from '#ui/types'

interface Props {
  band: {
    id: string
    name: string
    slug: string
  }
  artistName?: string
  avatarUrl?: string | null
  color?: ButtonColor
  variant?: ButtonVariant
  size?: ButtonSize
}

const props = withDefaults(defineProps<Props>(), {
  color: 'pink',
  variant: 'soft',
  size: 'sm',
})

const artistName = computed(() => props.artistName || props.band.name)

const showTipModal = ref(false)
</script>
