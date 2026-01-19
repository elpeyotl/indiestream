<template>
  <NuxtLink :to="`/playlist/${playlist.id}`" class="group">
    <div
      class="relative mb-3 transition-all duration-300 rounded-lg overflow-hidden"
      :class="overlay ? 'group-hover:scale-[1.02]' : 'group-hover:shadow-xl group-hover:shadow-violet-500/20'"
    >
      <PlaylistCover
        :covers="covers"
        :icon="icon"
      />

      <!-- Overlay style (library) - info inside card -->
      <div
        v-if="overlay"
        class="absolute inset-0 rounded-lg bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4"
      >
        <!-- Top badges -->
        <div class="flex items-center gap-2">
          <UIcon
            v-if="isPublic"
            name="i-heroicons-globe-alt"
            class="w-4 h-4 text-white/70"
          />
          <UBadge
            v-if="role && role !== 'owner'"
            :color="role === 'editor' ? 'yellow' : 'gray'"
            variant="soft"
            size="xs"
          >
            {{ role }}
          </UBadge>
        </div>
        <!-- Bottom info and play button -->
        <div class="flex items-end justify-between">
          <div class="min-w-0 flex-1 mr-2">
            <h3 class="font-semibold text-white text-lg truncate">{{ title }}</h3>
            <p class="text-white/70 text-sm">{{ trackCount }} {{ trackCount === 1 ? 'track' : 'tracks' }}</p>
          </div>
          <UButton
            v-if="trackCount > 0"
            color="violet"
            size="lg"
            :ui="{ rounded: 'rounded-full' }"
            :loading="loading"
            :class="loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            class="transition-opacity shadow-lg shrink-0"
            @click.prevent.stop="$emit('play', playlist)"
          >
            <UIcon v-if="!loading" name="i-heroicons-play-solid" class="w-6 h-6" />
          </UButton>
        </div>
      </div>

      <!-- Simple style (discover) - just badges and play button overlay -->
      <template v-else>
        <!-- Staff Pick badge -->
        <div v-if="isCurated" class="absolute top-2 left-2">
          <UBadge color="violet" variant="solid" size="xs" class="shadow-md">
            <UIcon name="i-heroicons-star" class="w-3 h-3 mr-1" />
            Staff Pick
          </UBadge>
        </div>
        <!-- Play button overlay -->
        <div
          v-if="trackCount > 0"
          class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div class="absolute bottom-2 right-2">
            <UButton
              color="violet"
              size="lg"
              :ui="{ rounded: 'rounded-full' }"
              :loading="loading"
              class="shadow-lg"
              @click.prevent.stop="$emit('play', playlist)"
            >
              <UIcon v-if="!loading" name="i-heroicons-play-solid" class="w-6 h-6" />
            </UButton>
          </div>
        </div>
      </template>
    </div>

    <!-- Info below card (only for simple style) -->
    <template v-if="!overlay">
      <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ title }}</p>
      <p class="text-sm text-zinc-400 truncate">{{ trackCount }} tracks</p>
      <p v-if="ownerName" class="text-xs text-zinc-500 truncate">
        By {{ ownerName }}
      </p>
    </template>
  </NuxtLink>
</template>

<script setup lang="ts">
interface PlaylistData {
  id: string
  title?: string
  track_count?: number
  is_public?: boolean
  is_curated?: boolean
  role?: string
  owner?: {
    display_name?: string | null
  } | null
}

const props = defineProps<{
  playlist: PlaylistData
  covers: string[]
  loading?: boolean
  overlay?: boolean // Use overlay style (library) vs simple style (discover)
  icon?: string
}>()

defineEmits<{
  play: [playlist: PlaylistData]
}>()

// Derive values from playlist data
const title = computed(() => props.playlist.title ?? 'Untitled')
const trackCount = computed(() => props.playlist.track_count ?? 0)
const isPublic = computed(() => props.playlist.is_public ?? false)
const isCurated = computed(() => props.playlist.is_curated ?? false)
const role = computed(() => props.playlist.role)
const ownerName = computed(() => props.playlist.owner?.display_name)
</script>
