<template>
  <nav
    v-if="user"
    class="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800"
    :style="{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }"
  >
    <div class="flex items-center justify-around px-2 pt-2">
      <!-- Discover -->
      <NuxtLink
        to="/discover"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
        :class="isActive('/discover') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
      >
        <UIcon
          :name="isActive('/discover') ? 'i-heroicons-home-solid' : 'i-heroicons-home'"
          class="w-6 h-6"
        />
        <span class="text-xs font-medium">Discover</span>
      </NuxtLink>

      <!-- Library -->
      <NuxtLink
        to="/library"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
        :class="isActive('/library') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
      >
        <UIcon
          :name="isActive('/library') ? 'i-heroicons-squares-2x2-solid' : 'i-heroicons-squares-2x2'"
          class="w-6 h-6"
        />
        <span class="text-xs font-medium">Library</span>
      </NuxtLink>

      <!-- My Listening -->
      <NuxtLink
        to="/dashboard/listening"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
        :class="isActive('/dashboard/listening') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
      >
        <UIcon
          :name="isActive('/dashboard/listening') ? 'i-heroicons-chart-bar-solid' : 'i-heroicons-chart-bar'"
          class="w-6 h-6"
        />
        <span class="text-xs font-medium">Listening</span>
      </NuxtLink>

      <!-- My Impact (Subscribers) / Search (Non-subscribers) -->
      <NuxtLink
        v-if="isSubscribed"
        to="/dashboard/my-impact"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
        :class="isActive('/dashboard/my-impact') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
      >
        <UIcon
          :name="isActive('/dashboard/my-impact') ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
          class="w-6 h-6"
        />
        <span class="text-xs font-medium">Impact</span>
      </NuxtLink>

      <!-- Search (Non-subscribers) -->
      <button
        v-else
        @click="openSearch"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 text-zinc-400 hover:text-zinc-100"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-6 h-6" />
        <span class="text-xs font-medium">Search</span>
      </button>

      <!-- Now Playing (only when music is playing) -->
      <button
        v-if="currentTrack"
        @click="expandPlayer"
        class="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-violet-400"
      >
        <UIcon name="i-heroicons-musical-note-solid" class="w-6 h-6 animate-pulse" />
        <span class="text-xs font-medium">Playing</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const route = useRoute()
const { currentTrack } = usePlayer()
const { isSubscribed } = useSubscription()

// Check if current route is active
const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Open search modal/page
const openSearch = () => {
  // Trigger global search (Cmd+K)
  // You can emit an event or use a global state to open the search modal
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    metaKey: true,
    bubbles: true
  })
  document.dispatchEvent(event)
}

// Expand audio player (if you have an expandable player)
const expandPlayer = () => {
  // Emit event or call method to expand player
  // This depends on your AudioPlayer implementation
  // For now, just scroll to player
  const player = document.querySelector('[data-audio-player]')
  if (player) {
    player.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}
</script>

<style scoped>
/* Ensure safe area insets for iPhone notch */
nav {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
