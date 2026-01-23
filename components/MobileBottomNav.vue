<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800"
    :style="{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }"
  >
    <div class="flex items-center justify-around px-2 pt-2">
      <!-- Logged-in Navigation -->
      <template v-if="user">
        <!-- 1. Discover -->
        <NuxtLink
          to="/discover"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/discover') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/discover') ? 'i-heroicons-home-solid' : 'i-heroicons-home'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Discover</span>
        </NuxtLink>

        <!-- 2. My Impact -->
        <NuxtLink
          to="/dashboard/stats"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/dashboard/stats') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/dashboard/stats') ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Impact</span>
        </NuxtLink>

        <!-- 3. Search -->
        <NuxtLink
          to="/search"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/search') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/search') ? 'i-heroicons-magnifying-glass-solid' : 'i-heroicons-magnifying-glass'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Search</span>
        </NuxtLink>

        <!-- 4. Library -->
        <NuxtLink
          to="/library"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/library') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/library') ? 'i-heroicons-squares-2x2-solid' : 'i-heroicons-squares-2x2'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Library</span>
        </NuxtLink>
      </template>

      <!-- Guest Navigation -->
      <template v-else>
        <!-- 1. Discover -->
        <NuxtLink
          to="/discover"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/discover') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/discover') ? 'i-heroicons-home-solid' : 'i-heroicons-home'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Discover</span>
        </NuxtLink>

        <!-- 2. Charts -->
        <NuxtLink
          to="/charts"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/charts') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/charts') ? 'i-heroicons-chart-bar-solid' : 'i-heroicons-chart-bar'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Charts</span>
        </NuxtLink>

        <!-- 3. Genres -->
        <NuxtLink
          to="/genres"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/genres') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/genres') ? 'i-heroicons-musical-note-solid' : 'i-heroicons-musical-note'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Genres</span>
        </NuxtLink>

        <!-- 4. Search -->
        <NuxtLink
          to="/search"
          class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
          :class="isActive('/search') ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-100'"
        >
          <UIcon
            :name="isActive('/search') ? 'i-heroicons-magnifying-glass-solid' : 'i-heroicons-magnifying-glass'"
            class="w-6 h-6"
          />
          <span class="text-xs font-medium">Search</span>
        </NuxtLink>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const route = useRoute()

const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
nav {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
</style>
