<template>
  <NuxtLink
    :to="`/genres/${genre.slug}`"
    class="group relative h-40 rounded-xl overflow-hidden"
  >
    <!-- Background: Image or gradient fallback -->
    <div class="absolute inset-0">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="genre.name"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div v-else class="h-full w-full" :style="{ background: gradient }" />
    </div>

    <!-- Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/70 transition-colors" />

    <!-- Content -->
    <div class="relative h-full flex flex-col justify-end p-4">
      <h3 class="font-bold text-white text-lg drop-shadow-lg">{{ genre.name }}</h3>
      <p v-if="genre.artistCount" class="text-white/80 text-sm drop-shadow">
        {{ genre.artistCount }} {{ genre.artistCount === 1 ? 'artist' : 'artists' }}
      </p>
    </div>

    <!-- Play button (optional) -->
    <button
      v-if="showPlayButton"
      class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg hover:bg-violet-400 hover:scale-105"
      @click.prevent.stop="$emit('play', genre)"
    >
      <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-5 h-5 text-white animate-spin" />
      <UIcon v-else name="i-heroicons-play-solid" class="w-5 h-5 text-white ml-0.5" />
    </button>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Genre {
  slug: string
  name: string
  artistCount?: number
  avatarKeys?: string[]
}

interface Props {
  genre: Genre
  avatarUrl?: string | null
  showPlayButton?: boolean
  loading?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  play: [genre: Genre]
}>()

// Generate consistent gradient based on genre name
const gradient = computed(() => {
  const gradients = [
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
  ]

  let hash = 0
  for (let i = 0; i < props.genre.name.length; i++) {
    hash = props.genre.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
})
</script>
