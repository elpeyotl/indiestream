<template>
  <button
    class="px-6 py-3 font-bold uppercase tracking-tight transition-all inline-flex items-center gap-2"
    :class="buttonClasses"
    @click="showTipModal = true"
  >
    <UIcon name="i-heroicons-heart" class="w-5 h-5" />
    Tip {{ artistName }}
  </button>

  <TipModal
    v-model="showTipModal"
    :band="band"
    :artist-name="artistName"
    :avatar-url="avatarUrl"
  />
</template>

<script setup lang="ts">
interface Props {
  band: {
    id: string
    name: string
    slug: string
  }
  artistName?: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'outline',
})

const artistName = computed(() => props.artistName || props.band.name)

const showTipModal = ref(false)

const buttonClasses = computed(() => {
  if (props.variant === 'solid') {
    return 'bg-pink-600 text-white shadow-[2px_2px_0px_0px_rgba(236,72,153,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(236,72,153,0.5)]'
  }
  return 'border-2 border-pink-500/50 text-pink-500 hover:border-pink-500 hover:bg-pink-500/10'
})
</script>
