<template>
  <div>
    <div v-if="album && band">
    <!-- Owner/Admin Status Banner -->
    <div v-if="isOwnerOrAdmin && albumStatus !== 'live'" class="container mx-auto px-4 pt-6">
      <!-- Not Published (Draft) -->
      <div v-if="!album.is_published" class="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-amber-400">Draft Release</p>
            <p class="text-sm text-zinc-400 mt-1">
              This release is not published yet. Complete the upload to make it available for review.
            </p>
          </div>
        </div>
      </div>

      <!-- Pending Moderation -->
      <div v-else-if="pendingTracksCount > 0" class="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-orange-400">Pending Review</p>
            <p class="text-sm text-zinc-400 mt-1">
              {{ pendingTracksCount === album.tracks?.length
                ? 'All tracks are pending review by our moderation team.'
                : `${pendingTracksCount} of ${album.tracks?.length} tracks are pending review.`
              }}
              This usually takes 24-48 hours. You'll be notified once approved.
            </p>
          </div>
        </div>
      </div>

      <!-- Some tracks rejected -->
      <div v-else-if="rejectedTracksCount > 0" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-red-400">Some Tracks Rejected</p>
            <p class="text-sm text-zinc-400 mt-1">
              {{ rejectedTracksCount }} track{{ rejectedTracksCount > 1 ? 's were' : ' was' }} rejected by our moderation team.
              Please review and re-upload or remove the affected tracks.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Album Header -->
    <div class="container mx-auto px-4 py-12">
      <!-- Back Button (Desktop only - mobile shows in header) -->
      <div class="hidden md:block mb-4">
        <BackButton />
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        <!-- Cover Art -->
        <div class="w-full md:w-80 shrink-0">
          <div class="aspect-square rounded-xl overflow-hidden shadow-2xl bg-zinc-800 relative">
            <!-- Skeleton placeholder until image loads -->
            <USkeleton
              v-if="!imageLoaded"
              class="absolute inset-0 rounded-none"
            />
            <NuxtImg
              v-if="coverUrl"
              :src="coverUrl"
              :alt="album.title"
              :width="320"
              :height="320"
              format="webp"
              class="w-full h-full object-cover transition-opacity duration-300"
              :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
              @load="imageLoaded = true"
            />
          </div>
        </div>

        <!-- Album Info -->
        <div class="flex-1">
          <p class="text-sm text-zinc-400 uppercase tracking-wider mb-2">
            {{ releaseTypeLabel }}
          </p>
          <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 mb-4">
            {{ album.title }}
          </h1>

          <NuxtLink
            :to="`/${band.slug}`"
            class="inline-flex items-center gap-2 text-lg text-violet-400 hover:text-violet-300 mb-6"
          >
            {{ band.name }}
            <UIcon v-if="band.is_verified" name="i-heroicons-check-badge" class="w-5 h-5" />
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6">
            <span v-if="album.release_date" class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              {{ formatDate(album.release_date) }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-musical-note" class="w-4 h-4" />
              {{ album.tracks?.length || 0 }} tracks
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              {{ formatDuration(album.total_duration_seconds || 0) }}
            </span>
          </div>

          <p v-if="album.description" class="text-zinc-300 mb-8 max-w-xl">
            {{ album.description }}
          </p>

          <!-- Actions -->
          <div class="flex gap-3">
            <PlayAllButton :loading="loadingPlay" @click="playAll" />
            <UButton
              :color="isAlbumSaved(album.id) ? 'violet' : 'gray'"
              :variant="isAlbumSaved(album.id) ? 'solid' : 'outline'"
              size="lg"
              :loading="savingAlbum"
              @click="handleSaveAlbum"
            >
              <UIcon
                :name="isAlbumSaved(album.id) ? 'i-heroicons-check' : 'i-heroicons-plus'"
                class="w-5 h-5 mr-1"
              />
              {{ isAlbumSaved(album.id) ? 'Saved' : 'Save' }}
            </UButton>
            <UButton color="gray" variant="ghost" size="lg">
              <UIcon name="i-heroicons-share" class="w-5 h-5" />
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Purchase / Download Section -->
    <div v-if="album.purchasable && !isOwnerOrAdmin" class="container mx-auto px-4 pb-8">
      <div class="max-w-md">
        <!-- Download Panel (if owned) -->
        <AlbumDownloadPanel
          v-if="purchaseStatus?.owned"
          :album-id="album.id"
          :purchase="purchaseStatus.purchase"
        />
        <!-- Purchase Card (if not owned) -->
        <AlbumPurchaseCard
          v-else
          :album="{
            id: album.id,
            title: album.title,
            price_cents: album.price_cents,
            pay_what_you_want: album.pay_what_you_want,
            minimum_price_cents: album.minimum_price_cents,
          }"
          :owned="purchaseStatus?.owned || false"
          @purchased="handlePurchaseComplete"
        />
      </div>
    </div>

    <!-- Track List -->
    <div class="container mx-auto px-4 pb-12">
      <div class="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
        <table class="w-full">
          <thead class="border-b border-zinc-800">
            <tr class="text-left text-sm text-zinc-400">
              <th class="px-4 py-3 w-12">#</th>
              <th class="px-4 py-3">Title</th>
              <th class="px-4 py-3 w-24 hidden sm:table-cell">Plays</th>
              <th class="px-4 py-3 w-20 text-right">
                <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              </th>
              <th class="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="track in album.tracks" :key="track.id">
              <tr
                class="border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                :class="{ 'bg-violet-500/10': isTrackPlaying(track), 'border-b-0': expandedTrack === track.id }"
                @click="playTrack(track)"
              >
                <td class="px-4 py-4">
                  <span v-if="loadingTrackId === track.id" class="text-violet-400">
                    <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                  </span>
                  <span v-else-if="isTrackPlaying(track)" class="text-violet-400">
                    <UIcon name="i-heroicons-speaker-wave" class="w-4 h-4 animate-pulse" />
                  </span>
                  <template v-else>
                    <span class="text-zinc-400 group-hover:hidden">{{ track.track_number }}</span>
                    <UIcon name="i-heroicons-play" class="w-4 h-4 text-violet-400 hidden group-hover:block" />
                  </template>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <div>
                      <p class="font-medium" :class="isTrackPlaying(track) ? 'text-violet-400' : 'text-zinc-100'">
                        {{ track.title }}
                      </p>
                      <div class="flex items-center gap-1 mt-1">
                        <UBadge v-if="track.is_explicit" color="gray" size="xs">E</UBadge>
                        <UBadge v-if="track.is_cover" color="amber" size="xs">Cover</UBadge>
                      </div>
                    </div>
                    <!-- Credits toggle button -->
                    <UButton
                      v-if="hasCredits(track.id)"
                      color="gray"
                      variant="ghost"
                      size="xs"
                      class="ml-2 opacity-0 group-hover:opacity-60"
                      @click.stop="toggleCredits(track.id)"
                    >
                      <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
                    </UButton>
                  </div>
                </td>
                <td class="px-4 py-4 text-zinc-400 hidden sm:table-cell">
                  {{ formatNumber(track.stream_count || 0) }}
                </td>
                <td class="px-4 py-4 text-zinc-400 text-right">
                  {{ formatTrackDuration(track.duration_seconds) }}
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <!-- Heart button (always visible when liked) -->
                    <UButton
                      :color="isTrackLiked(track.id) ? 'red' : 'gray'"
                      variant="ghost"
                      size="xs"
                      :icon="isTrackLiked(track.id) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                      :class="isTrackLiked(track.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'"
                      @click.stop="handleLikeTrack(track.id)"
                    />
                    <!-- Desktop: Dropdown menu -->
                    <TrackActionsMenu
                      :track="getPlayerTrack(track)"
                      :show-on-hover="true"
                      class="hidden md:block"
                    />
                    <!-- Mobile: Opens bottom sheet -->
                    <UButton
                      color="gray"
                      variant="ghost"
                      size="xs"
                      icon="i-heroicons-ellipsis-vertical"
                      class="md:hidden"
                      @click.stop="openActionsSheet(track)"
                    />
                  </div>
                </td>
              </tr>
              <!-- Expanded Credits Row -->
              <tr v-if="expandedTrack === track.id" class="border-b border-zinc-800/50 bg-zinc-900/50">
                <td colspan="5" class="px-4 py-3">
                  <div class="pl-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div v-if="track.isrc" class="text-zinc-400">
                      <span class="text-zinc-500">ISRC:</span> {{ track.isrc }}
                    </div>
                    <div v-if="track.iswc" class="text-zinc-400">
                      <span class="text-zinc-500">ISWC:</span> {{ track.iswc }}
                    </div>
                    <div v-for="credit in trackCredits[track.id]" :key="credit.id" class="text-zinc-400">
                      <span class="text-zinc-500 capitalize">{{ credit.role }}:</span> {{ credit.name }}
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Rights Footer -->
        <div v-if="album.p_line || album.c_line" class="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
          <p v-if="album.p_line">{{ album.p_line }}</p>
          <p v-if="album.c_line">{{ album.c_line }}</p>
        </div>
      </div>
    </div>

    <!-- More from Artist -->
    <div v-if="otherAlbums.length > 0" class="container mx-auto px-4 pb-12">
      <h2 class="text-xl font-semibold text-zinc-100 mb-6">More from {{ band.name }}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <NuxtLink
          v-for="otherAlbum in otherAlbums"
          :key="otherAlbum.id"
          :to="`/${band.slug}/${otherAlbum.slug}`"
          class="group"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2">
            <NuxtImg
              v-if="otherAlbumCovers[otherAlbum.id]"
              :src="otherAlbumCovers[otherAlbum.id]"
              :alt="otherAlbum.title"
              :width="192"
              :height="192"
              format="webp"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-zinc-600" />
            </div>
          </div>
          <p class="text-sm font-medium text-zinc-100 truncate group-hover:text-violet-400">
            {{ otherAlbum.title }}
          </p>
          <p class="text-xs text-zinc-400">
            {{ otherAlbum.release_type }}
          </p>
        </NuxtLink>
      </div>
    </div>
  </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading" class="container mx-auto px-4 py-12">
      <!-- Back Button placeholder -->
      <div class="hidden md:block mb-4">
        <USkeleton class="h-10 w-24 rounded-lg" />
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        <!-- Cover Art Skeleton -->
        <div class="w-full md:w-80 shrink-0">
          <USkeleton class="aspect-square rounded-xl" />
        </div>

        <!-- Album Info Skeleton -->
        <div class="flex-1">
          <USkeleton class="h-4 w-16 mb-2" />
          <USkeleton class="h-12 w-3/4 mb-4" />
          <USkeleton class="h-6 w-32 mb-6" />
          <div class="flex gap-4 mb-6">
            <USkeleton class="h-5 w-24" />
            <USkeleton class="h-5 w-20" />
            <USkeleton class="h-5 w-16" />
          </div>
          <USkeleton class="h-16 w-full max-w-xl mb-8" />
          <div class="flex gap-3">
            <USkeleton class="h-11 w-28 rounded-lg" />
            <USkeleton class="h-11 w-24 rounded-lg" />
            <USkeleton class="h-11 w-11 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- Track List Skeleton -->
      <div class="mt-12 bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
        <div class="border-b border-zinc-800 px-4 py-3">
          <div class="flex gap-4">
            <USkeleton class="h-4 w-8" />
            <USkeleton class="h-4 w-32" />
          </div>
        </div>
        <div v-for="i in 5" :key="i" class="px-4 py-4 border-b border-zinc-800/50">
          <div class="flex items-center gap-4">
            <USkeleton class="h-4 w-6" />
            <USkeleton class="h-5 w-48" />
            <USkeleton class="h-4 w-12 ml-auto" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
          <UIcon name="i-heroicons-musical-note" class="w-10 h-10 text-zinc-500" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 mb-2">Album Not Found</h1>
        <p class="text-zinc-400 mb-6">This album doesn't exist or has been removed.</p>
        <UButton color="violet" to="/">
          Back to Home
        </UButton>
      </div>
    </div>

    <!-- Mobile Track Actions Sheet -->
    <TrackActionsSheet
      v-if="selectedTrack"
      v-model="showActionsSheet"
      :track="selectedTrack"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Album, Track, TrackCredit } from '~/stores/album'
import type { PlayerTrack } from '~/stores/player'
import type { PurchaseStatus } from '~/stores/purchase'

const route = useRoute()
const albumStore = useAlbumStore()
const { getAlbumBySlug, getAlbumBySlugForOwner, getBandAlbums, getCachedCoverUrl, getCreditsForTracks, getStreamUrl } = albumStore
const bandStore = useBandStore()
const { getBandBySlug } = bandStore
const playerStore = usePlayerStore()
const { currentTrack, isPlaying, isLoading: playerLoading } = storeToRefs(playerStore)
const { playAlbum, playTrack: playerPlayTrack } = playerStore
const libraryStore = useLibraryStore()
const { isAlbumSaved, toggleAlbumSave, checkAlbumSaved, isTrackLiked, toggleTrackLike, fetchLikedTrackIds } = libraryStore
const userProfileStore = useUserProfileStore()
const { isAdmin } = storeToRefs(userProfileStore)
const purchaseStore = usePurchaseStore()
const { fetchPurchaseStatus } = purchaseStore
const user = useSupabaseUser()

// Purchase status
const purchaseStatus = ref<PurchaseStatus | null>(null)

const otherAlbums = ref<Album[]>([])
const coverUrl = ref<string | null>(null)
const imageLoaded = ref(false)
const savingAlbum = ref(false)
const loadingPlay = ref(false)
const loadingTrackId = ref<string | null>(null)
const trackCredits = ref<Record<string, TrackCredit[]>>({})
const expandedTrack = ref<string | null>(null)
const showActionsSheet = ref(false)
const selectedTrack = ref<PlayerTrack | null>(null)
const otherAlbumCovers = ref<Record<string, string>>({})

// Fetch album data using useLazyAsyncData
const { data: albumData, pending: loading, refresh: refreshAlbum } = await useLazyAsyncData(
  `album-${route.params.artist}-${route.params.album}`,
  async () => {
    const artistSlug = route.params.artist as string
    const albumSlug = route.params.album as string

    // First load the band to check ownership
    const bandResult = await getBandBySlug(artistSlug)
    if (!bandResult) return null

    // Check if current user is owner or admin
    const isOwner = user.value && bandResult.owner_id === user.value.id
    const isOwnerOrAdminFlag = isOwner || isAdmin.value

    // Load album - use owner view if user is owner/admin to see unpublished albums
    let albumResult: Album | null = null
    if (isOwnerOrAdminFlag) {
      albumResult = await getAlbumBySlugForOwner(artistSlug, albumSlug)
    } else {
      albumResult = await getAlbumBySlug(artistSlug, albumSlug)
    }

    if (!albumResult) return null

    // Load cover URL if exists (cached)
    let cover: string | null = null
    if (albumResult.cover_key) {
      cover = await getCachedCoverUrl(albumResult.cover_key)
    } else if (albumResult.cover_url) {
      cover = albumResult.cover_url
    }

    return {
      album: albumResult,
      band: bandResult,
      coverUrl: cover,
      isOwnerOrAdmin: isOwnerOrAdminFlag,
    }
  },
  {
    watch: [() => route.params.artist, () => route.params.album],
  }
)

// Computed accessors
const album = computed(() => albumData.value?.album ?? null)
const band = computed(() => albumData.value?.band ?? null)
const isOwnerOrAdmin = computed(() => albumData.value?.isOwnerOrAdmin ?? false)

// Sync cover URL when data loads
watch(albumData, (data) => {
  if (data?.coverUrl) {
    coverUrl.value = data.coverUrl
    imageLoaded.value = false // Reset image loaded state for new album
  }
}, { immediate: true })

const releaseTypeLabel = computed(() => {
  const types: Record<string, string> = {
    album: 'Album',
    ep: 'EP',
    single: 'Single',
  }
  return types[album.value?.release_type || 'album'] || 'Album'
})

// Moderation status for owner view
const pendingTracksCount = computed(() => {
  if (!album.value?.tracks) return 0
  return album.value.tracks.filter(t => t.moderation_status === 'pending').length
})

const rejectedTracksCount = computed(() => {
  if (!album.value?.tracks) return 0
  return album.value.tracks.filter(t => t.moderation_status === 'rejected').length
})

const albumStatus = computed(() => {
  if (!album.value) return 'unknown'
  if (!album.value.is_published) return 'draft'
  if (pendingTracksCount.value > 0) return 'pending'
  if (rejectedTracksCount.value > 0) return 'rejected'
  return 'live'
})

// Format helpers
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }
  return `${minutes} min`
}

const formatTrackDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Player actions
const playAll = async () => {
  if (!album.value || loadingPlay.value) return
  loadingPlay.value = true
  try {
    await playAlbum(album.value, coverUrl.value, 0)
  } finally {
    loadingPlay.value = false
  }
}

const playTrack = async (track: Track) => {
  if (!album.value || loadingTrackId.value) return
  loadingTrackId.value = track.id
  try {
    // Find track index
    const index = album.value.tracks?.findIndex(t => t.id === track.id) || 0
    await playAlbum(album.value, coverUrl.value, index)
  } finally {
    loadingTrackId.value = null
  }
}

// Check if track is currently playing
const isTrackPlaying = (track: Track) => {
  return currentTrack.value?.id === track.id && isPlaying.value
}

// Library actions
const handleSaveAlbum = async () => {
  if (!album.value) return
  savingAlbum.value = true
  await toggleAlbumSave(album.value.id, album.value.title)
  savingAlbum.value = false
}

const handleLikeTrack = async (trackId: string) => {
  await toggleTrackLike(trackId)
}

// Convert track to PlayerTrack format for menus
const getPlayerTrack = (track: Track): PlayerTrack => {
  return {
    id: track.id,
    title: track.title,
    artist: band.value?.name || 'Unknown Artist',
    artistSlug: band.value?.slug || '',
    albumTitle: album.value?.title || '',
    albumSlug: album.value?.slug || '',
    coverUrl: coverUrl.value,
    audioUrl: '', // Will be fetched lazily when needed
    audioKey: track.audio_key || undefined,
    duration: track.duration_seconds,
  }
}

// Open mobile actions sheet
const openActionsSheet = async (track: Track) => {
  // Build PlayerTrack with audio URL
  const playerTrack = getPlayerTrack(track)
  if (track.audio_key) {
    try {
      playerTrack.audioUrl = await getStreamUrl(track.audio_key)
    } catch (e) {
      console.error('Failed to get stream URL:', e)
    }
  }
  selectedTrack.value = playerTrack
  showActionsSheet.value = true
}

// Credits helpers
const hasCredits = (trackId: string): boolean => {
  const track = album.value?.tracks?.find(t => t.id === trackId)
  return Boolean(
    (trackCredits.value[trackId] && trackCredits.value[trackId].length > 0) ||
    track?.isrc ||
    track?.iswc
  )
}

const toggleCredits = (trackId: string) => {
  if (expandedTrack.value === trackId) {
    expandedTrack.value = null
  } else {
    expandedTrack.value = trackId
  }
}

// Set page meta
useHead(() => ({
  title: album.value && band.value
    ? `${album.value.title} by ${band.value.name} | Fairtune`
    : 'Album | Fairtune',
  meta: [
    {
      name: 'description',
      content: album.value?.description || `Listen to ${album.value?.title || 'this album'} on Fairtune`,
    },
  ],
}))

// Load other albums from artist (lazy, in background)
const loadOtherAlbums = async (bandId: string, currentAlbumId: string) => {
  try {
    const allAlbums = await getBandAlbums(bandId)
    const filtered = allAlbums.filter(a => a.id !== currentAlbumId).slice(0, 6)
    otherAlbums.value = filtered

    // Load cover URLs for each album
    for (const albumItem of filtered) {
      if (albumItem.cover_key) {
        getCachedCoverUrl(albumItem.cover_key).then(url => {
          if (url) {
            otherAlbumCovers.value[albumItem.id] = url
          }
        })
      }
    }
  } catch (e) {
    console.error('Failed to load other albums:', e)
  }
}

// Load track credits and liked status (lazy, in background)
const loadTrackMetadata = async (trackIds: string[]) => {
  // Run in parallel
  await Promise.all([
    fetchLikedTrackIds(trackIds),
    getCreditsForTracks(trackIds).then(credits => {
      trackCredits.value = credits
    }).catch(e => {
      console.error('Failed to load track credits:', e)
    })
  ])
}

// Load secondary data when album data is available
watch(albumData, async (data) => {
  if (data?.album && data?.band) {
    // Load secondary data in background (don't block rendering)
    loadOtherAlbums(data.band.id, data.album.id)
    checkAlbumSaved(data.album.id)

    // Fetch liked status and credits for all tracks
    if (data.album.tracks?.length) {
      const trackIds = data.album.tracks.map(t => t.id)
      loadTrackMetadata(trackIds)
    }

    // Fetch purchase status if album is purchasable and user is logged in
    if (data.album.purchasable && user.value && !data.isOwnerOrAdmin) {
      purchaseStatus.value = await fetchPurchaseStatus(data.album.id)
    }
  }
}, { immediate: true })

// Handle successful purchase
const handlePurchaseComplete = async () => {
  if (album.value) {
    // Refresh purchase status
    purchaseStatus.value = await fetchPurchaseStatus(album.value.id, true)
  }
}

// Check for purchase query param (redirected from Stripe)
onMounted(() => {
  if (route.query.purchased === 'true' && album.value) {
    // Payment completed via redirect, fetch updated status
    handlePurchaseComplete()
  }
})
</script>
