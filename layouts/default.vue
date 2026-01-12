<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-50">
    <!-- Bokeh Background -->
    <BokehBackground :audio-data="audioData" />

    <!-- Header -->
    <header
      class="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <div
              class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
            >
              <span class="text-white font-bold text-sm">IS</span>
            </div>
            <div class="text-xl font-bold">
              <span
                class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                >Indie</span
              ><span class="text-zinc-100">stream</span>
            </div>
          </NuxtLink>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-6">
            <NuxtLink
              to="/discover"
              class="text-zinc-400 hover:text-violet-400 transition-colors"
            >
              Discover
            </NuxtLink>
            <NuxtLink
              to="/artists"
              class="text-zinc-400 hover:text-violet-400 transition-colors"
            >
              Artists
            </NuxtLink>
            <NuxtLink
              v-if="user"
              to="/library"
              class="text-zinc-400 hover:text-violet-400 transition-colors"
            >
              Library
            </NuxtLink>
            <NuxtLink
              to="/pricing"
              class="text-zinc-400 hover:text-violet-400 transition-colors"
            >
              Pricing
            </NuxtLink>
          </nav>

          <!-- Auth / User Menu -->
          <div class="flex items-center gap-3">
            <!-- Global Search -->
            <GlobalSearch />

            <!-- Logged Out -->
            <template v-if="!user">
              <UButton color="gray" variant="ghost" to="/login">
                Login
              </UButton>
              <UButton color="violet" to="/register"> Sign Up </UButton>
            </template>

            <!-- Logged In -->
            <template v-else>
              <UDropdown
                :items="userMenuItems"
                :popper="{ placement: 'bottom-end' }"
              >
                <UButton
                  color="gray"
                  variant="ghost"
                  class="flex items-center gap-2"
                >
                  <UAvatar
                    :src="user.user_metadata?.avatar_url"
                    :alt="displayName"
                    size="xs"
                  />
                  <span class="hidden sm:inline">{{ displayName }}</span>
                  <UIcon
                    name="i-heroicons-chevron-down-20-solid"
                    class="w-4 h-4"
                  />
                </UButton>
              </UDropdown>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pb-20 md:pb-24">
      <slot />
    </main>

    <!-- Global Audio Player -->
    <AudioPlayer />

    <!-- Footer -->
    <footer class="mt-20 border-t border-zinc-800 bg-zinc-950">
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center"
              >
                <span class="text-white font-bold text-sm">IS</span>
              </div>
              <div class="text-xl font-bold">
                <span
                  class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                  >Indie</span
                ><span class="text-zinc-100">stream</span>
              </div>
            </div>
            <p class="text-zinc-400 max-w-md">Stream Fair. Support Direct.</p>
            <p class="text-zinc-500 text-sm mt-2">
              The streaming platform where your subscription directly supports
              the artists you listen to.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h3 class="font-semibold mb-3 text-zinc-200">Platform</h3>
            <ul class="space-y-2 text-zinc-400">
              <li>
                <NuxtLink
                  to="/about"
                  class="hover:text-violet-400 transition-colors"
                  >About</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/how-it-works"
                  class="hover:text-violet-400 transition-colors"
                  >How It Works</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/pricing"
                  class="hover:text-violet-400 transition-colors"
                  >Pricing</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/for-artists"
                  class="hover:text-violet-400 transition-colors"
                  >For Artists</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/changelog"
                  class="hover:text-violet-400 transition-colors"
                  >Changelog</NuxtLink
                >
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold mb-3 text-zinc-200">Legal</h3>
            <ul class="space-y-2 text-zinc-400">
              <li>
                <NuxtLink
                  to="/terms"
                  class="hover:text-violet-400 transition-colors"
                  >Terms</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/privacy"
                  class="hover:text-violet-400 transition-colors"
                  >Privacy</NuxtLink
                >
              </li>
              <li>
                <NuxtLink
                  to="/contact"
                  class="hover:text-violet-400 transition-colors"
                  >Contact</NuxtLink
                >
              </li>
            </ul>
          </div>
        </div>

        <div
          class="mt-8 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-sm"
        >
          <p>
            &copy; 2026 Indiestream. ❤️ Built for independent artists. Designed
            for fans.
          </p>
          <NuxtLink
            to="/changelog"
            class="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full transition-colors"
          >
            <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
            <span class="text-zinc-400">v{{ APP_VERSION }}</span>
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import BokehBackground from "~/components/backgrounds/BokehBackground.vue";
import { APP_VERSION } from "~/utils/version";

const user = useSupabaseUser();
const { signOut } = useAuth();
const { audioData } = usePlayer();
const toast = useToast();

const displayName = computed(() => {
  if (!user.value) return "";
  return (
    user.value.user_metadata?.display_name ||
    user.value.email?.split("@")[0] ||
    "User"
  );
});

const handleSignOut = async () => {
  try {
    await signOut();
  } catch (e: any) {
    toast.add({
      title: "Sign out failed",
      description: e.message || "Please try again",
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
  }
};

const userMenuItems = [
  [
    {
      label: "Dashboard",
      icon: "i-heroicons-home",
      to: "/dashboard",
    },
    {
      label: "Library",
      icon: "i-heroicons-heart",
      to: "/library",
    },
    {
      label: "My Listening",
      icon: "i-heroicons-musical-note",
      to: "/dashboard/listening",
    },
    {
      label: "Settings",
      icon: "i-heroicons-cog-6-tooth",
      to: "/dashboard/settings",
    },
  ],
  [
    {
      label: "Sign out",
      icon: "i-heroicons-arrow-right-on-rectangle",
      click: handleSignOut,
    },
  ],
];
</script>
