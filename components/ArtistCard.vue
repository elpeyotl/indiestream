<template>
  <NuxtLink :to="`/${artist.slug}`" class="group">
    <div
      class="relative w-full pb-[100%] overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300"
      :class="rounded ? 'rounded-xl' : 'rounded-lg'"
    >
      <div class="absolute inset-0">
        <img
          v-if="artist.avatar_url"
          v-fade-image
          :src="artist.avatar_url"
          :alt="artist.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center"
          :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
        >
          <span :class="large ? 'text-5xl' : 'text-4xl'" class="font-bold text-white">
            {{ artist.name.charAt(0) }}
          </span>
        </div>
      </div>
      <!-- Play button overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div class="absolute bottom-2 right-2">
          <UButton
            color="violet"
            :size="large ? 'lg' : 'md'"
            :icon="loading ? undefined : 'i-heroicons-play-solid'"
            :loading="loading"
            :ui="{ rounded: 'rounded-full', padding: { sm: 'p-2', md: 'p-2.5', lg: 'p-3' } }"
            class="shadow-lg"
            @click.prevent.stop="$emit('play', artist)"
          />
        </div>
      </div>
    </div>
    <h3
      class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors"
      :class="large ? 'font-semibold' : ''"
    >
      {{ artist.name }}
    </h3>
    <div class="flex items-center gap-2 text-sm text-zinc-500">
      <span>Artist</span>
      <UIcon
        v-if="artist.is_verified"
        name="i-heroicons-check-badge"
        class="w-4 h-4 text-violet-400"
      />
    </div>
    <div v-if="showGenres && artist.genres?.length" class="flex flex-wrap gap-1 mt-2">
      <UBadge
        v-for="genre in artist.genres.slice(0, 2)"
        :key="genre"
        color="gray"
        variant="soft"
        size="xs"
      >
        {{ genre }}
      </UBadge>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'

defineProps<{
  artist: Band
  loading?: boolean
  large?: boolean
  rounded?: boolean
  showGenres?: boolean
}>()

defineEmits<{
  play: [artist: Band]
}>()
</script>
