<template>
  <NuxtLink
    :to="albumUrl"
    class="group card-interactive"
  >
    <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl group-hover:shadow-violet-500/20 transition-all duration-300">
      <div class="absolute inset-0">
        <NuxtImg
          v-if="coverUrl"
          :src="coverUrl"
          :alt="album.title"
          :width="256"
          :height="256"
          format="webp"
          loading="lazy"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
        </div>
      </div>

      <!-- Owned Badge -->
      <div v-if="isOwned" class="absolute top-2 right-2 z-10">
        <UBadge color="green" size="xs">
          <UIcon name="i-heroicons-check" class="w-3 h-3 mr-1" />
          Owned
        </UBadge>
      </div>

      <!-- Play button overlay -->
      <div
        v-if="showPlayButton"
        class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div class="absolute bottom-2 right-2">
          <UButton
            color="violet"
            size="lg"
            :icon="loading ? undefined : 'i-heroicons-play-solid'"
            :loading="loading"
            :ui="{ rounded: 'rounded-full', padding: { lg: 'p-3' } }"
            class="shadow-lg"
            @click.prevent.stop="$emit('play', album)"
          />
        </div>
      </div>
    </div>

    <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">
      {{ album.title }}
    </p>
    <p class="text-sm text-zinc-400 truncate">
      {{ artistName }}
    </p>
    <p v-if="showReleaseType" class="text-xs text-zinc-500">
      {{ releaseTypeLabel }}
    </p>
  </NuxtLink>
</template>

<script setup lang="ts" generic="T extends { id: string; title: string; slug: string; release_type?: string; band_id?: string; band?: { id?: string; name: string; slug: string } }">
interface AlbumCardProps<T> {
  album: T
  coverUrl?: string | null
  loading?: boolean
  showPlayButton?: boolean
  showReleaseType?: boolean
}

const props = withDefaults(defineProps<AlbumCardProps<T>>(), {
  coverUrl: null,
  loading: false,
  showPlayButton: true,
  showReleaseType: true,
})

defineEmits<{
  play: [album: T]
}>()

const purchaseStore = usePurchaseStore()
const { purchasedAlbumIds } = storeToRefs(purchaseStore)
const user = useSupabaseUser()

const albumUrl = computed(() => {
  const artistSlug = props.album.band?.slug || ''
  return `/${artistSlug}/${props.album.slug}`
})

const artistName = computed(() => props.album.band?.name || '')

const releaseTypeLabel = computed(() => {
  switch (props.album.release_type) {
    case 'ep': return 'EP'
    case 'single': return 'Single'
    default: return 'Album'
  }
})

// Only show owned badge for logged-in users who own the album
const isOwned = computed(() => user.value && purchasedAlbumIds.value.has(props.album.id))
</script>
