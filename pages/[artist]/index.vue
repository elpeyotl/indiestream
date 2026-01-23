<template>
  <div>
    <div v-if="band">
    <!-- Pending Approval Banner (only visible to owner) -->
    <div
      v-if="band.status === 'pending' && isOwner"
      class="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3"
    >
      <div class="container mx-auto flex items-center gap-3">
        <UIcon name="i-heroicons-clock" class="w-5 h-5 text-amber-400 shrink-0" />
        <div class="flex-1">
          <p class="text-amber-200 font-medium">Pending Approval</p>
          <p class="text-amber-300/70 text-sm">
            Your artist profile is being reviewed. It will be visible to others once approved.
          </p>
        </div>
        <NuxtLink to="/dashboard" class="shrink-0">
          <UButton color="amber" variant="soft" size="sm">
            Go to Dashboard
          </UButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Suspended Banner (only visible to owner) -->
    <div
      v-if="band.status === 'suspended' && isOwner"
      class="bg-red-500/10 border-b border-red-500/30 px-4 py-3"
    >
      <div class="container mx-auto flex items-center gap-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0" />
        <div class="flex-1">
          <p class="text-red-200 font-medium">Account Suspended</p>
          <p class="text-red-300/70 text-sm">
            This artist profile has been suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    </div>

    <!-- Hero Banner -->
    <div class="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden">
      <!-- Banner Image -->
      <div
        v-if="band.banner_url"
        class="absolute inset-0 bg-cover bg-center scale-105"
        :style="{ backgroundImage: `url(${band.banner_url})` }"
      />
      <!-- Fallback: Large gradient with theme color -->
      <div
        v-else
        class="absolute inset-0"
        :style="{ background: `radial-gradient(ellipse at top, ${band.theme_color}30 0%, transparent 50%), linear-gradient(180deg, ${band.theme_color}20 0%, #09090b 100%)` }"
      />
      <!-- Overlay gradients for readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
      <div class="absolute inset-0 bg-gradient-to-r from-zinc-950/50 via-transparent to-zinc-950/50" />
    </div>

    <!-- Profile Info -->
    <div class="container mx-auto px-4 -mt-32 md:-mt-40 relative z-10">
      <!-- Back Button (Desktop only - mobile shows in header) -->
      <div class="hidden md:block mb-4">
        <BackButton />
      </div>

      <div class="flex flex-col md:flex-row gap-6 items-start">
        <!-- Avatar -->
        <div
          class="w-36 h-36 md:w-48 md:h-48 rounded-2xl shadow-2xl overflow-hidden shrink-0 ring-4 ring-zinc-950 relative"
          :style="{ background: `linear-gradient(135deg, ${band.theme_color} 0%, #c026d3 100%)` }"
        >
          <!-- Skeleton placeholder until image loads -->
          <USkeleton
            v-if="band.avatar_url && !avatarLoaded"
            class="absolute inset-0 rounded-none"
          />
          <NuxtImg
            v-if="band.avatar_url"
            ref="avatarImgRef"
            :src="band.avatar_url"
            :alt="band.name"
            :width="192"
            :height="192"
            format="webp"
            class="w-full h-full object-cover transition-opacity duration-300"
            :class="avatarLoaded ? 'opacity-100' : 'opacity-0'"
            @load="avatarLoadedUrl = band.avatar_url"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-5xl font-bold text-white">
              {{ band.name.charAt(0).toUpperCase() }}
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 pt-4">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl md:text-4xl font-bold text-zinc-100">{{ band.name }}</h1>
            <UIcon
              v-if="band.is_verified"
              name="i-heroicons-check-badge"
              class="w-7 h-7 text-violet-400"
            />
          </div>

          <div class="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-4">
            <span v-if="band.location" class="flex items-center gap-1">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
              {{ band.location }}
            </span>
            <NuxtLink
              :to="`/${band.slug}?tab=followers`"
              class="flex items-center gap-1 hover:text-violet-400 transition-colors cursor-pointer"
              @click="fetchFollowers"
            >
              <UIcon name="i-heroicons-heart" class="w-4 h-4" />
              {{ formatNumber(band.follower_count || 0) }} followers
            </NuxtLink>
          </div>

          <!-- Genres -->
          <div v-if="band.genres?.length" class="flex flex-wrap gap-2 mb-4">
            <UBadge
              v-for="genre in band.genres"
              :key="genre"
              color="violet"
              variant="soft"
            >
              {{ genre }}
            </UBadge>
          </div>

          <!-- Tagline -->
          <p v-if="band.tagline" class="text-zinc-300 max-w-2xl mb-6">
            {{ band.tagline }}
          </p>

          <!-- Actions -->
          <div class="flex flex-wrap gap-3 items-center">
            <PlayAllButton :loading="loadingPlayAll" @click="handlePlayAll" />
            <UButton
              :color="isFollowing ? 'violet' : 'gray'"
              :variant="isFollowing ? 'solid' : 'outline'"
              size="lg"
              :loading="loadingFollow"
              @click="handleFollow"
            >
              <UIcon
                :name="isFollowing ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                class="w-5 h-5 mr-1"
              />
              {{ isFollowing ? 'Following' : 'Follow' }}
            </UButton>
            <!-- Tip Button -->
            <TipButton
              v-if="!isOwner"
              :band="{ id: band.id, name: band.name, slug: band.slug }"
              :avatar-url="band.avatar_url"
              size="lg"
            />
            <!-- Social Links -->
            <div v-if="hasAnySocialLink || band.website" class="flex gap-1">
              <UButton
                v-if="band.website"
                color="gray"
                variant="ghost"
                size="lg"
                :to="band.website"
                target="_blank"
              >
                <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.instagram"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.instagram, 'instagram')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-instagram" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.spotify"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.spotify, 'spotify')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-spotify" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.youtube"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.youtube, 'youtube')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-youtube" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.soundcloud"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.soundcloud, 'soundcloud')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-soundcloud" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.bandcamp"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.bandcamp, 'bandcamp')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-bandcamp" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.twitter"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.twitter, 'twitter')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-x" class="w-5 h-5" />
              </UButton>
              <UButton
                v-if="band.tiktok"
                color="gray"
                variant="ghost"
                size="lg"
                :to="formatSocialUrl(band.tiktok, 'tiktok')"
                target="_blank"
              >
                <UIcon name="i-simple-icons-tiktok" class="w-5 h-5" />
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Tabs -->
    <div class="container mx-auto px-4 py-12">
      <PillTabs v-model="selectedTabIndex" :tabs="tabs">
        <template #releases>
            <!-- Loading skeleton for albums -->
            <div v-if="loadingAlbums" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <div v-for="i in 5" :key="`album-skeleton-${i}`" class="space-y-3">
                <div class="aspect-square rounded-lg skeleton"></div>
                <div class="h-5 skeleton w-3/4"></div>
                <div class="h-4 skeleton w-1/2"></div>
              </div>
            </div>
            <!-- Album grid -->
            <div v-else-if="albums && albums.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <AlbumCard
                v-for="album in albums"
                :key="album.id"
                :album="{ ...album, band: { id: band!.id, name: band!.name, slug: band!.slug } }"
                :cover-url="albumCovers[album.id]"
                show-release-type
              />
            </div>
            <!-- Empty state -->
            <div v-else class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-zinc-500" />
              </div>
              <h3 class="text-lg font-medium text-zinc-200 mb-2">No releases yet</h3>
              <p class="text-zinc-400 text-sm">Check back soon for new music from {{ band?.name }}</p>
            </div>
        </template>

        <template #about>
          <div class="max-w-2xl">
            <h3 class="text-lg font-semibold text-zinc-100 mb-4">About {{ band.name }}</h3>
            <p v-if="band.bio" class="text-zinc-300 whitespace-pre-line">{{ band.bio }}</p>
            <p v-else class="text-zinc-400">No bio available.</p>

            <div v-if="band.location || band.website" class="mt-6 space-y-3">
              <div v-if="band.location" class="flex items-center gap-2 text-zinc-400">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
                <span>{{ band.location }}</span>
              </div>
              <div v-if="band.website" class="flex items-center gap-2">
                <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-zinc-400" />
                <a :href="band.website" target="_blank" class="text-violet-400 hover:text-violet-300">
                  {{ band.website }}
                </a>
              </div>
            </div>

            <!-- Social Links -->
            <div v-if="hasAnySocialLink" class="mt-6">
              <h4 class="text-sm font-semibold text-zinc-400 mb-3">Connect</h4>
              <div class="flex flex-wrap gap-2">
                <a
                  v-if="band.instagram"
                  :href="formatSocialUrl(band.instagram, 'instagram')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-instagram" class="w-4 h-4" />
                  <span class="text-sm">Instagram</span>
                </a>
                <a
                  v-if="band.spotify"
                  :href="formatSocialUrl(band.spotify, 'spotify')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-spotify" class="w-4 h-4" />
                  <span class="text-sm">Spotify</span>
                </a>
                <a
                  v-if="band.youtube"
                  :href="formatSocialUrl(band.youtube, 'youtube')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-youtube" class="w-4 h-4" />
                  <span class="text-sm">YouTube</span>
                </a>
                <a
                  v-if="band.soundcloud"
                  :href="formatSocialUrl(band.soundcloud, 'soundcloud')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-soundcloud" class="w-4 h-4" />
                  <span class="text-sm">SoundCloud</span>
                </a>
                <a
                  v-if="band.bandcamp"
                  :href="formatSocialUrl(band.bandcamp, 'bandcamp')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-bandcamp" class="w-4 h-4" />
                  <span class="text-sm">Bandcamp</span>
                </a>
                <a
                  v-if="band.twitter"
                  :href="formatSocialUrl(band.twitter, 'twitter')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-x" class="w-4 h-4" />
                  <span class="text-sm">X / Twitter</span>
                </a>
                <a
                  v-if="band.tiktok"
                  :href="formatSocialUrl(band.tiktok, 'tiktok')"
                  target="_blank"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  <UIcon name="i-simple-icons-tiktok" class="w-4 h-4" />
                  <span class="text-sm">TikTok</span>
                </a>
              </div>
            </div>
          </div>
        </template>

        <template #followers>
            <!-- Loading state -->
            <div v-if="followersLoading" class="flex items-center justify-center py-12">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-zinc-400" />
            </div>

            <!-- Followers grid -->
            <div v-else-if="followers.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <NuxtLink
                v-for="follower in followers"
                :key="follower.id"
                :to="`/user/${follower.id}`"
                class="group flex flex-col items-center text-center p-4 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                <!-- Avatar -->
                <div class="w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-zinc-800 group-hover:ring-violet-500 transition-all">
                  <NuxtImg
                    v-if="follower.avatarUrl"
                    :src="follower.avatarUrl"
                    :alt="follower.displayName || 'User'"
                    :width="80"
                    :height="80"
                    format="webp"
                    loading="lazy"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-violet-500 text-white font-semibold text-xl"
                  >
                    {{ follower.displayName ? follower.displayName.charAt(0).toUpperCase() : '?' }}
                  </div>
                </div>

                <!-- Name -->
                <p class="font-medium text-zinc-100 truncate w-full group-hover:text-violet-400 transition-colors">
                  {{ follower.displayName || 'Anonymous User' }}
                </p>

                <!-- Followed date -->
                <p class="text-xs text-zinc-500 mt-1">
                  Followed {{ new Date(follower.followedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }}
                </p>
              </NuxtLink>
            </div>

            <!-- Empty state -->
            <div v-else class="text-center py-12 text-zinc-400">
              <UIcon name="i-heroicons-user-group" class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No followers yet</p>
              <p class="text-sm mt-2">Be the first to follow {{ band.name }}!</p>
            </div>
        </template>
      </PillTabs>
    </div>
  </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading">
      <!-- Hero Banner Skeleton -->
      <div class="relative h-72 md:h-96 lg:h-[28rem] overflow-hidden">
        <USkeleton class="absolute inset-0 rounded-none" />
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
      </div>

      <!-- Profile Info Skeleton -->
      <div class="container mx-auto px-4 -mt-32 md:-mt-40 relative z-10">
        <!-- Back Button placeholder -->
        <div class="hidden md:block mb-4">
          <USkeleton class="h-10 w-24 rounded-lg" />
        </div>

        <div class="flex flex-col md:flex-row gap-6 items-start">
          <!-- Avatar Skeleton -->
          <USkeleton class="w-36 h-36 md:w-48 md:h-48 rounded-2xl shrink-0" />

          <!-- Info Skeleton -->
          <div class="flex-1 pt-4">
            <USkeleton class="h-10 w-64 mb-4" />
            <div class="flex gap-4 mb-4">
              <USkeleton class="h-5 w-24" />
              <USkeleton class="h-5 w-20" />
            </div>
            <div class="flex gap-2 mb-4">
              <USkeleton class="h-6 w-16 rounded-full" />
              <USkeleton class="h-6 w-20 rounded-full" />
              <USkeleton class="h-6 w-14 rounded-full" />
            </div>
            <USkeleton class="h-16 w-full max-w-xl mb-6" />
            <div class="flex gap-3">
              <USkeleton class="h-11 w-28 rounded-lg" />
              <USkeleton class="h-11 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Tabs Skeleton -->
        <div class="mt-8">
          <div class="flex gap-4 border-b border-zinc-800 pb-2">
            <USkeleton class="h-8 w-20" />
            <USkeleton class="h-8 w-16" />
            <USkeleton class="h-8 w-24" />
          </div>
        </div>

        <!-- Album Grid Skeleton -->
        <div class="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          <div v-for="i in 5" :key="i" class="space-y-3">
            <USkeleton class="aspect-square rounded-lg" />
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
          <UIcon name="i-heroicons-user" class="w-10 h-10 text-zinc-500" />
        </div>
        <h1 class="text-2xl font-bold text-zinc-100 mb-2">Artist Not Found</h1>
        <p class="text-zinc-400 mb-6">This artist profile doesn't exist or has been removed.</p>
        <UButton color="violet" to="/">
          Back to Home
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'
import type { Album } from '~/stores/album'

const route = useRoute()
const user = useSupabaseUser()
const toast = useToast()
const bandStore = useBandStore()
const { getBandBySlug } = bandStore
const albumStore = useAlbumStore()
const { getBandAlbums, getCachedCoverUrl } = albumStore
const playerStore = usePlayerStore()
const { playAlbum } = playerStore

// Track avatar loaded state per URL to handle navigation between artists
const avatarLoadedUrl = ref<string | null>(null)
const avatarImgRef = ref<HTMLImageElement | null>(null)
const loadingPlayAll = ref(false)
const isFollowing = ref(false)
const loadingFollow = ref(false)
const albumCovers = ref<Record<string, string>>({})

// Fetch artist data using useLazyAsyncData
// Note: server: false is required because RLS policies check auth.uid() which is NULL during SSR
// Without this, pending bands (awaiting approval) won't be visible on hard reload for owners
const { data: band, pending, status, refresh: refreshBand } = await useLazyAsyncData(
  `artist-${route.params.artist}`,
  async () => {
    const slug = route.params.artist as string
    const result = await getBandBySlug(slug)
    if (!result) {
      throw createError({ statusCode: 404, statusMessage: 'Artist not found' })
    }
    return result
  },
  {
    watch: [() => route.params.artist],
    server: false, // Client-only to ensure user session is available for RLS
  }
)

// Show loading when fetch is pending OR when status is 'idle' (server: false means no SSR fetch)
const loading = computed(() => pending.value || status.value === 'idle')

const avatarLoaded = computed(() => avatarLoadedUrl.value === band.value?.avatar_url)

// Fetch albums using useLazyAsyncData (depends on band)
const { data: albums, pending: loadingAlbums, refresh: refreshAlbums } = await useLazyAsyncData(
  `artist-albums-${route.params.artist}`,
  async () => {
    if (!band.value) return []
    const albumList = await getBandAlbums(band.value.id)

    // Load cover URLs for albums in parallel (cached)
    await Promise.all(
      albumList.map(async (album) => {
        if (album.cover_key) {
          const coverUrl = await getCachedCoverUrl(album.cover_key)
          if (coverUrl) albumCovers.value[album.id] = coverUrl
        } else if (album.cover_url) {
          albumCovers.value[album.id] = album.cover_url
        }
      })
    )

    return albumList
  },
  {
    watch: [band],
    server: false,
  }
)

// Check if current user is the owner of this artist profile
const isOwner = computed(() => {
  return !!user.value && !!band.value && user.value.id === band.value.owner_id
})

const tabs = [
  { slot: 'releases', label: 'Releases', icon: 'i-heroicons-musical-note' },
  { slot: 'about', label: 'About', icon: 'i-heroicons-information-circle' },
  { slot: 'followers', label: 'Followers', icon: 'i-heroicons-user-group' },
]

// Initialize tab from URL query
const getInitialTab = () => {
  const tabSlot = (route.query.tab as string) || 'releases'
  const index = tabs.findIndex(t => t.slot === tabSlot)
  return index >= 0 ? index : 0
}

const selectedTabIndex = ref(getInitialTab())

// Update URL when tab changes (without scrolling)
watch(selectedTabIndex, (index) => {
  const tab = tabs[index]
  if (tab && process.client) {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab.slot)
    window.history.replaceState({}, '', url.toString())
  }
})

// Followers state
const followers = ref<Array<{ id: string; displayName: string | null; avatarUrl: string | null; followedAt: string }>>([])
const followersLoading = ref(false)
const followersLoaded = ref(false)

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Social links helpers
const hasAnySocialLink = computed(() => {
  return !!(band.value?.instagram || band.value?.twitter || band.value?.youtube ||
            band.value?.spotify || band.value?.soundcloud || band.value?.bandcamp || band.value?.tiktok)
})

const formatSocialUrl = (value: string, platform: string): string => {
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const username = value.replace(/^@/, '')
  switch (platform) {
    case 'instagram': return `https://instagram.com/${username}`
    case 'twitter': return `https://x.com/${username}`
    case 'youtube': return `https://youtube.com/${username}`
    case 'spotify': return value // Usually full URLs
    case 'soundcloud': return `https://soundcloud.com/${username}`
    case 'bandcamp': return value // Usually full URLs
    case 'tiktok': return `https://tiktok.com/@${username}`
    default: return value
  }
}

// Check follow status when band loads
watch(band, async (newBand) => {
  if (!newBand || !user.value) {
    isFollowing.value = false
    return
  }

  try {
    const { isFollowing: status } = await $fetch('/api/follows/status', {
      query: { bandId: newBand.id },
    })
    isFollowing.value = status
  } catch (e) {
    console.error('Failed to check follow status:', e)
  }
}, { immediate: true })

// Handle follow/unfollow
const handleFollow = async () => {
  if (!band.value) return

  if (!user.value) {
    toast.add({
      title: 'Sign in required',
      description: 'Create an account to follow artists',
      color: 'yellow',
    })
    return navigateTo('/auth/login')
  }

  loadingFollow.value = true
  try {
    if (isFollowing.value) {
      await $fetch('/api/follows/unfollow', {
        method: 'POST',
        body: { bandId: band.value.id },
      })
      isFollowing.value = false
      if (band.value.follower_count > 0) {
        band.value.follower_count--
      }
      toast.add({
        title: 'Unfollowed',
        description: `You unfollowed ${band.value.name}`,
        color: 'gray',
      })
    } else {
      await $fetch('/api/follows/follow', {
        method: 'POST',
        body: { bandId: band.value.id },
      })
      isFollowing.value = true
      band.value.follower_count = (band.value.follower_count || 0) + 1
      toast.add({
        title: 'Following',
        description: `You're now following ${band.value.name}`,
        color: 'green',
      })
    }
  } catch (e) {
    console.error('Failed to update follow status:', e)
    toast.add({
      title: 'Error',
      description: 'Failed to update follow status',
      color: 'red',
    })
  } finally {
    loadingFollow.value = false
  }
}

// Play all tracks from first album with tracks
const handlePlayAll = async () => {
  if (!albums.value?.length || !band.value) return

  loadingPlayAll.value = true
  try {
    // Find first album with tracks
    for (const albumItem of albums.value) {
      if (albumItem.tracks && albumItem.tracks.length > 0) {
        const coverUrl = albumCovers.value[albumItem.id] || null
        // Add band info to album for player display
        const albumWithBand = {
          ...albumItem,
          band: {
            id: band.value.id,
            name: band.value.name,
            slug: band.value.slug,
          },
        }
        await playAlbum(albumWithBand, coverUrl, 0)
        break
      }
    }
  } catch (e) {
    console.error('Failed to play all:', e)
  } finally {
    loadingPlayAll.value = false
  }
}

// Fetch followers
const fetchFollowers = async () => {
  if (!band.value || followersLoaded.value) return

  followersLoading.value = true
  try {
    const data = await $fetch<{ followers: Array<{ id: string; displayName: string | null; avatarUrl: string | null; followedAt: string }> }>(`/api/artist/${band.value.slug}/followers`)
    followers.value = data.followers
    followersLoaded.value = true
  } catch (e) {
    console.error('Failed to fetch followers:', e)
    toast.add({
      title: 'Error',
      description: 'Failed to load followers',
      color: 'red',
    })
  } finally {
    followersLoading.value = false
  }
}

// Watch for tab changes to load followers when needed
watch(() => route.query.tab, (newTab) => {
  if (newTab === 'followers' && !followersLoaded.value && band.value) {
    fetchFollowers()
  }
}, { immediate: true })

// Check if avatar image is already cached/complete when URL changes
watch(() => band.value?.avatar_url, async (newUrl) => {
  if (newUrl) {
    // Wait for next tick so the img element is rendered with new src
    await nextTick()
    if (avatarImgRef.value?.complete && avatarImgRef.value?.naturalHeight > 0) {
      avatarLoadedUrl.value = newUrl
    }
  }
}, { immediate: true })

// Set page meta based on band
useHead(() => ({
  title: band.value ? `${band.value.name} | Fairtune` : 'Artist | Fairtune',
  meta: [
    {
      name: 'description',
      content: band.value?.bio || `Listen to ${band.value?.name || 'this artist'} on Fairtune`,
    },
  ],
}))

// Pull to refresh
const refreshAll = async () => {
  albumCovers.value = {}
  await Promise.all([refreshBand(), refreshAlbums()])
}

usePullToRefresh(refreshAll)
</script>
