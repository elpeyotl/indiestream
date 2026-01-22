<template>
  <div class="min-h-screen bg-zinc-950">
    <!-- Sticky Search Header (below main layout header) -->
    <div class="sticky top-[57px] z-30 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800/50 safe-area-top">
      <div class="container mx-auto px-4 py-3 space-y-3">
        <!-- Back Button and Title -->
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="inline-flex items-center gap-1 p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 active:scale-95"
            aria-label="Go back"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-5 h-5" />
          </button>
          <h1 class="text-lg font-semibold text-zinc-100">Search</h1>
        </div>
        <!-- Search Input -->
        <UInput
          v-model="query"
          placeholder="Search artists, albums, tracks..."
          size="lg"
          icon="i-heroicons-magnifying-glass"
          :loading="searching"
          autofocus
          @input="debouncedSearch"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div class="container mx-auto px-4 py-4 pb-40">
      <!-- Empty State (no query) -->
      <template v-if="!query.trim()">
        <!-- Recent Searches -->
        <section v-if="recentSearches.length > 0" class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recent Searches</h2>
            <button
              class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              @click="clearRecentSearches"
            >
              Clear
            </button>
          </div>
          <div class="space-y-1">
            <div
              v-for="search in recentSearches"
              :key="search.query"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group cursor-pointer active:scale-[0.98]"
              @click="useRecentSearch(search.query)"
            >
              <UIcon name="i-heroicons-clock" class="w-5 h-5 text-zinc-500 shrink-0" />
              <span class="flex-1 text-zinc-300 truncate">{{ search.query }}</span>
              <button
                class="p-2 hover:bg-zinc-700 rounded-lg transition-all"
                @click.stop="removeRecentSearch(search.query)"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </section>

        <!-- Trending Artists -->
        <section v-if="trendingArtists.length > 0" class="mb-8">
          <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Trending Artists</h2>
          <div class="grid grid-cols-2 gap-3">
            <ArtistCard
              v-for="artist in trendingArtists"
              :key="artist.id"
              :artist="artist"
            />
          </div>
        </section>

        <!-- Loading skeleton for trending -->
        <section v-else-if="loadingTrending" class="mb-8">
          <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Trending Artists</h2>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 6" :key="i" class="aspect-square rounded-xl bg-zinc-800/50 animate-pulse" />
          </div>
        </section>

        <!-- Featured Playlist -->
        <section v-if="featuredPlaylist">
          <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Featured Playlist</h2>
          <PlaylistCard
            :playlist="featuredPlaylist"
            :covers="playlistCovers"
            overlay
          />
        </section>
      </template>

      <!-- Results State -->
      <template v-else>
        <!-- Loading -->
        <div v-if="searching" class="flex items-center justify-center py-12">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-zinc-400 animate-spin" />
        </div>

        <!-- No Results -->
        <div v-else-if="!hasResults" class="text-center py-12 text-zinc-400">
          <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p class="text-lg">No results found</p>
          <p class="text-sm text-zinc-500 mt-1">Try a different search term</p>
        </div>

        <!-- Results List -->
        <div v-else class="space-y-6">
          <!-- Artists -->
          <section v-if="results.artists.length > 0">
            <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Artists</h2>
            <div class="space-y-1">
              <NuxtLink
                v-for="artist in results.artists"
                :key="artist.id"
                :to="`/${artist.slug}`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors active:scale-[0.98]"
                @click="saveSearch"
              >
                <div
                  class="w-12 h-12 rounded-full overflow-hidden shrink-0"
                  :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
                >
                  <img
                    v-if="artist.avatar_url"
                    :src="artist.avatar_url"
                    :alt="artist.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="text-lg font-bold text-white">{{ artist.name.charAt(0) }}</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-zinc-100 truncate">{{ artist.name }}</p>
                  <p class="text-sm text-zinc-500">Artist</p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-600" />
              </NuxtLink>
            </div>
          </section>

          <!-- Albums -->
          <section v-if="results.albums.length > 0">
            <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Albums</h2>
            <div class="space-y-1">
              <NuxtLink
                v-for="album in results.albums"
                :key="album.id"
                :to="`/${album.band?.slug}/${album.slug}`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors active:scale-[0.98]"
                @click="saveSearch"
              >
                <div class="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                  <img
                    v-if="album.cover_url"
                    :src="album.cover_url"
                    :alt="album.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-zinc-600" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-zinc-100 truncate">{{ album.title }}</p>
                  <p class="text-sm text-zinc-500 truncate">{{ album.band?.name }}</p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-600" />
              </NuxtLink>
            </div>
          </section>

          <!-- Tracks -->
          <section v-if="results.tracks.length > 0">
            <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Tracks</h2>
            <div class="space-y-1">
              <NuxtLink
                v-for="track in results.tracks"
                :key="track.id"
                :to="`/${track.band_slug}/${track.album_slug}`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors active:scale-[0.98]"
                @click="saveSearch"
              >
                <div class="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                  <img
                    v-if="track.cover_url"
                    :src="track.cover_url"
                    :alt="track.album_title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-zinc-600" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-zinc-100 truncate">{{ track.title }}</p>
                  <p class="text-sm text-zinc-500 truncate">{{ track.band_name }} · {{ track.album_title }}</p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-600" />
              </NuxtLink>
            </div>
          </section>

          <!-- Playlists -->
          <section v-if="results.playlists.length > 0">
            <h2 class="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Playlists</h2>
            <div class="space-y-1">
              <NuxtLink
                v-for="playlist in results.playlists"
                :key="playlist.id"
                :to="`/playlist/${playlist.id}`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors active:scale-[0.98]"
                @click="saveSearch"
              >
                <!-- Mini playlist cover mosaic -->
                <div class="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                  <!-- 4 covers: 2x2 grid -->
                  <div v-if="playlist.covers?.length >= 4" class="grid grid-cols-2 h-full w-full">
                    <img
                      v-for="(cover, index) in playlist.covers.slice(0, 4)"
                      :key="index"
                      :src="cover"
                      :alt="`Cover ${index + 1}`"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <!-- 2-3 covers: show first 2 side by side -->
                  <div v-else-if="playlist.covers?.length >= 2" class="grid grid-cols-2 h-full w-full">
                    <img
                      v-for="(cover, index) in playlist.covers.slice(0, 2)"
                      :key="index"
                      :src="cover"
                      :alt="`Cover ${index + 1}`"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <!-- 1 cover: full image -->
                  <img
                    v-else-if="playlist.covers?.length === 1"
                    :src="playlist.covers[0]"
                    :alt="playlist.title"
                    class="w-full h-full object-cover"
                  />
                  <!-- No covers: gradient fallback -->
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center"
                  >
                    <UIcon name="i-heroicons-queue-list" class="w-6 h-6 text-white/80" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-zinc-100 truncate">{{ playlist.title }}</p>
                  <p class="text-sm text-zinc-500">{{ playlist.track_count }} tracks · {{ playlist.owner_name || 'Unknown' }}</p>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-600" />
              </NuxtLink>
            </div>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Search - Fairtune',
})

const router = useRouter()
const recentActivityStore = useRecentActivityStore()
const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = recentActivityStore

// Use shared search composable
const {
  query,
  searching,
  results,
  hasResults,
  trendingArtists,
  featuredPlaylist,
  playlistCovers,
  loadingTrending,
  performSearch,
  debouncedSearch,
  loadEmptyStateContent,
} = useSearch()

// Navigation
const goBack = () => {
  router.back()
}

// Save search query when navigating to results
const saveSearch = () => {
  if (query.value.trim()) {
    addRecentSearch(query.value.trim())
  }
}

// Use a recent search
const useRecentSearch = (searchQuery: string) => {
  query.value = searchQuery
  performSearch()
}

// Load empty state content on mount
onMounted(() => {
  loadEmptyStateContent()
})
</script>
