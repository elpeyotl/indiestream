<template>
  <div class="relative">
    <!-- Search Trigger Button -->
    <UButton
      color="gray"
      variant="ghost"
      icon="i-heroicons-magnifying-glass"
      @click="openSearch"
    />

    <!-- Search Modal -->
    <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <div class="p-4">
        <!-- Search Input -->
        <UInput
          ref="searchInput"
          v-model="query"
          placeholder="Search artists, albums, tracks, playlists..."
          size="xl"
          icon="i-heroicons-magnifying-glass"
          :loading="searching"
          autofocus
          @input="debouncedSearch"
        />

        <!-- Results -->
        <div v-if="query" class="mt-4 max-h-96 overflow-y-auto">
          <!-- Loading -->
          <div v-if="searching" class="flex items-center justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-zinc-400 animate-spin" />
          </div>

          <!-- No Results -->
          <div v-else-if="!hasResults" class="text-center py-8 text-zinc-400">
            <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No results found for "{{ query }}"</p>
          </div>

          <!-- Results List -->
          <div v-else class="space-y-4">
            <!-- Artists -->
            <div v-if="results.artists.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Artists</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="artist in results.artists"
                  :key="artist.id"
                  :to="`/${artist.slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
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
            </div>

            <!-- Albums -->
            <div v-if="results.albums.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Albums</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="album in results.albums"
                  :key="album.id"
                  :to="`/${album.band?.slug}/${album.slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
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
            </div>

            <!-- Tracks -->
            <div v-if="results.tracks.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tracks</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="track in results.tracks"
                  :key="track.id"
                  :to="`/${track.band_slug}/${track.album_slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
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
            </div>

            <!-- Playlists -->
            <div v-if="results.playlists.length > 0">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Playlists</h3>
              <div class="space-y-1">
                <NuxtLink
                  v-for="playlist in results.playlists"
                  :key="playlist.id"
                  :to="`/playlist/${playlist.id}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors"
                  @click="saveAndClose"
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
            </div>
          </div>
        </div>

        <!-- Empty State (when no query) -->
        <div v-else class="mt-4 space-y-4 max-h-96 overflow-y-auto">
          <!-- Recent Searches -->
          <div v-if="recentSearches.length > 0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent Searches</h3>
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
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors group cursor-pointer"
                @click="useRecentSearch(search.query)"
              >
                <UIcon name="i-heroicons-clock" class="w-4 h-4 text-zinc-500" />
                <span class="flex-1 text-zinc-300 truncate">{{ search.query }}</span>
                <button
                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                  @click.stop="removeRecentSearch(search.query)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            </div>
          </div>

          <!-- Trending Artists -->
          <div v-if="trendingArtists.length > 0">
            <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Trending Artists</h3>
            <div class="grid grid-cols-3 gap-3">
              <NuxtLink
                v-for="artist in trendingArtists"
                :key="artist.id"
                :to="`/${artist.slug}`"
                class="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                @click="closeSearch"
              >
                <div
                  class="w-16 h-16 rounded-full overflow-hidden shrink-0"
                  :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
                >
                  <img
                    v-if="artist.avatar_url"
                    :src="artist.avatar_url"
                    :alt="artist.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <span class="text-xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
                  </div>
                </div>
                <span class="text-sm text-zinc-300 truncate w-full text-center">{{ artist.name }}</span>
              </NuxtLink>
            </div>
          </div>

          <!-- Loading skeleton for trending -->
          <div v-else-if="loadingTrending">
            <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Trending Artists</h3>
            <div class="grid grid-cols-3 gap-3">
              <div v-for="i in 6" :key="i" class="flex flex-col items-center gap-2 p-2">
                <div class="w-16 h-16 rounded-full bg-zinc-800 animate-pulse" />
                <div class="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          </div>

          <!-- Featured Playlist -->
          <div v-if="featuredPlaylist">
            <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Featured Playlist</h3>
            <NuxtLink
              :to="`/playlist/${featuredPlaylist.id}`"
              class="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              @click="closeSearch"
            >
              <!-- Playlist cover mosaic -->
              <div class="w-14 h-14 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                <div v-if="playlistCovers.length >= 4" class="grid grid-cols-2 h-full w-full">
                  <img
                    v-for="(cover, index) in playlistCovers.slice(0, 4)"
                    :key="index"
                    :src="cover"
                    :alt="`Cover ${index + 1}`"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else-if="playlistCovers.length >= 2" class="grid grid-cols-2 h-full w-full">
                  <img
                    v-for="(cover, index) in playlistCovers.slice(0, 2)"
                    :key="index"
                    :src="cover"
                    :alt="`Cover ${index + 1}`"
                    class="w-full h-full object-cover"
                  />
                </div>
                <img
                  v-else-if="playlistCovers.length === 1"
                  :src="playlistCovers[0]"
                  :alt="featuredPlaylist.title"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center"
                >
                  <UIcon name="i-heroicons-queue-list" class="w-7 h-7 text-white/80" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-zinc-100 truncate">{{ featuredPlaylist.title }}</p>
                <p class="text-sm text-zinc-500">{{ featuredPlaylist.track_count }} tracks</p>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-600" />
            </NuxtLink>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Quick Links</h3>
            <div class="grid grid-cols-2 gap-2">
              <NuxtLink
                to="/discover"
                class="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                @click="closeSearch"
              >
                <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-violet-400" />
                <span class="text-zinc-200">Discover</span>
              </NuxtLink>
              <NuxtLink
                to="/artists"
                class="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                @click="closeSearch"
              >
                <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-fuchsia-400" />
                <span class="text-zinc-200">Artists</span>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcut Hint -->
        <div class="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Press <kbd class="px-1.5 py-0.5 bg-zinc-800 rounded">ESC</kbd> to close</span>
          <span>Press <kbd class="px-1.5 py-0.5 bg-zinc-800 rounded">⌘K</kbd> to search</span>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
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
  clearSearch,
  loadEmptyStateContent,
} = useSearch()

// Modal state
const isOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

const openSearch = () => {
  isOpen.value = true
  clearSearch()
  // Load empty state content when opening
  loadEmptyStateContent()
}

const closeSearch = () => {
  isOpen.value = false
}

// Save search query when navigating to results
const saveAndClose = () => {
  if (query.value.trim()) {
    addRecentSearch(query.value.trim())
  }
  closeSearch()
}

// Use a recent search
const useRecentSearch = (searchQuery: string) => {
  query.value = searchQuery
  performSearch()
}

// Keyboard shortcut
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})
</script>
