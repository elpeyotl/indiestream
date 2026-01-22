<template>
  <div class="relative w-full pb-[100%] rounded-lg overflow-hidden shadow-lg">
    <div class="absolute inset-0">
      <!-- 4 covers: 2x2 grid -->
      <div v-if="covers.length >= 4" class="grid grid-cols-2 h-full w-full">
        <NuxtImg
          v-for="(cover, index) in covers.slice(0, 4)"
          :key="index"
          :src="cover"
          :alt="`Cover ${index + 1}`"
          :width="160"
          :height="160"
          format="webp"
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </div>
      <!-- 2-3 covers: show first 2 side by side, stretched vertically -->
      <div v-else-if="covers.length >= 2" class="grid grid-cols-2 h-full w-full">
        <NuxtImg
          v-for="(cover, index) in covers.slice(0, 2)"
          :key="index"
          :src="cover"
          :alt="`Cover ${index + 1}`"
          :width="160"
          :height="320"
          format="webp"
          loading="lazy"
          class="w-full h-full object-cover"
        />
      </div>
      <!-- 1 cover: full image -->
      <NuxtImg
        v-else-if="covers.length === 1"
        :src="covers[0]"
        alt="Playlist cover"
        :width="320"
        :height="320"
        format="webp"
        loading="lazy"
        class="w-full h-full object-cover"
      />
      <!-- No covers: gradient fallback -->
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center"
      >
        <UIcon :name="icon" class="w-16 h-16 text-white/80" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  covers: string[]
  icon?: string
}>(), {
  icon: 'i-heroicons-musical-note'
})
</script>
