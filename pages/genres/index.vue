<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-zinc-100 mb-2">Browse by Genre</h1>
      <p class="text-zinc-400">Explore music across different styles and sounds</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div v-for="i in 15" :key="i" class="h-24 skeleton rounded-xl" />
    </div>

    <!-- Genre Grid -->
    <div v-else-if="genres.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <NuxtLink
        v-for="genre in genres"
        :key="genre.slug"
        :to="`/genres/${genre.slug}`"
        class="group relative h-24 rounded-xl overflow-hidden"
        :style="{ background: getGenreGradient(genre.name) }"
      >
        <div class="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
        <div class="relative h-full flex flex-col justify-end p-4">
          <h3 class="font-bold text-white text-lg">{{ genre.name }}</h3>
          <p class="text-white/70 text-sm">{{ genre.artistCount }} {{ genre.artistCount === 1 ? 'artist' : 'artists' }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else
      icon="i-heroicons-musical-note"
      title="No Genres Yet"
      description="Artists haven't added genres to their profiles yet"
    />
  </div>
</template>

<script setup lang="ts">
interface Genre {
  name: string
  slug: string
  artistCount: number
}

const loading = ref(true)
const genres = ref<Genre[]>([])

// Generate consistent gradient colors based on genre name
const getGenreGradient = (name: string): string => {
  const gradients = [
    'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', // violet-pink
    'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', // cyan-violet
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', // amber-red
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)', // emerald-cyan
    'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)', // pink-amber
    'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', // blue-violet
    'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)', // red-pink
    'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)', // violet-cyan
  ]

  // Use hash of name to pick consistent gradient
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

onMounted(async () => {
  try {
    const data = await $fetch('/api/genres')
    genres.value = data.genres
  } catch (e) {
    console.error('Failed to load genres:', e)
  } finally {
    loading.value = false
  }
})
</script>
