<template>
  <div class="min-h-screen bg-black text-white relative">
    <!-- SVG Noise Overlay -->
    <div class="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] mix-blend-overlay">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.80"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>

    <!-- Toast Notifications -->
    <UNotifications />

    <!-- Global Pull to Refresh Indicator -->
    <PullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-refreshing="isRefreshing"
      :threshold="threshold"
    />

    <!-- Header -->
    <header class="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b-2 border-zinc-800 safe-area-header">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Back Button or Logo -->
          <div class="flex items-center gap-4">
            <BackButton class="lg:hidden" />
            <!-- Logo -->
            <NuxtLink to="/" class="flex items-center gap-2">
              <span class="text-2xl font-black uppercase tracking-tighter text-fuchsia-500">FAIRTUNE</span>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="hidden lg:flex items-center gap-6">
            <!-- Logged-in navigation -->
            <template v-if="user">
              <NuxtLink
                to="/discover"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Discover
              </NuxtLink>
              <NuxtLink
                to="/zine"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Zine
              </NuxtLink>
              <NuxtLink
                to="/genres"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Genres
              </NuxtLink>
              <NuxtLink
                to="/artists"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Artists
              </NuxtLink>
              <NuxtLink
                to="/library"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Library
              </NuxtLink>
              <NuxtLink
                to="/dashboard/stats"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                My Impact
              </NuxtLink>
            </template>

            <!-- Logged-out navigation -->
            <template v-else>
              <NuxtLink
                to="/discover"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Discover
              </NuxtLink>
              <NuxtLink
                to="/zine"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Zine
              </NuxtLink>
              <NuxtLink
                to="/genres"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Genres
              </NuxtLink>
              <NuxtLink
                to="/artists"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Artists
              </NuxtLink>
              <NuxtLink
                to="/pricing"
                class="font-bold text-sm uppercase tracking-tight text-zinc-400 hover:text-fuchsia-500 transition-colors"
              >
                Pricing
              </NuxtLink>
            </template>
          </nav>

          <!-- Auth / User Menu -->
          <div class="flex items-center gap-3">
            <!-- Global Search -->
            <GlobalSearch class="hidden lg:block" />

            <!-- Logged Out -->
            <template v-if="!user">
              <NuxtLink
                to="/login"
                class="px-4 py-2 border-2 border-fuchsia-500 text-fuchsia-500 font-bold text-sm uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
              >
                Login
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="px-4 py-2 bg-fuchsia-600 text-white font-bold text-sm uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
              >
                Sign Up
              </NuxtLink>
            </template>

            <!-- Logged In -->
            <template v-else>
              <!-- Notifications Bell -->
              <ResponsivePopover
                v-model:open="notificationsOpen"
                title="Notifications"
                placement="bottom-end"
                width="w-80"
              >
                <template #trigger>
                  <button class="relative p-2 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors">
                    <UIcon name="i-heroicons-bell" class="w-5 h-5 text-zinc-400" />
                    <span
                      v-if="unreadCount > 0"
                      class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold bg-fuchsia-500 text-white rounded-none px-1"
                    >
                      {{ unreadCount > 9 ? '9+' : unreadCount }}
                    </span>
                  </button>
                </template>

                <!-- Notifications content -->
                <div class="bg-zinc-950 border-2 border-zinc-800">
                  <div class="flex items-center justify-between px-4 py-3 border-b-2 border-zinc-800">
                    <span class="font-black text-sm uppercase tracking-tight text-white">Notifications</span>
                    <button
                      v-if="notifications.length > 0"
                      class="text-xs font-mono text-fuchsia-500 hover:text-fuchsia-400"
                      @click="markAllAsRead"
                    >
                      Clear all
                    </button>
                  </div>

                  <div class="overflow-y-auto max-h-72">
                    <div v-if="notificationsLoading" class="p-4 text-center">
                      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-zinc-500" />
                    </div>

                    <div v-else-if="notifications.length === 0" class="p-6 text-center">
                      <UIcon name="i-heroicons-bell-slash" class="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p class="text-zinc-500 font-mono text-sm">No notifications</p>
                    </div>

                    <div v-else>
                      <div
                        v-for="notification in notifications"
                        :key="notification.id"
                        class="px-4 py-3 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-900 transition-colors cursor-pointer"
                        :class="{ 'bg-zinc-900/50': !notification.read }"
                        @click="handleNotificationClick(notification)"
                      >
                        <NuxtLink
                          :to="notification.link || '#'"
                          class="flex gap-3"
                          @click="notificationsOpen = false"
                        >
                          <UIcon
                            :name="getNotificationIcon(notification.type)"
                            :class="['w-5 h-5 mt-0.5 flex-shrink-0', getNotificationColor(notification.type)]"
                          />
                          <div class="flex-1 min-w-0">
                            <p class="font-bold text-sm text-white">{{ notification.title }}</p>
                            <p v-if="notification.message" class="text-xs text-zinc-400 font-mono mt-0.5 line-clamp-2">
                              {{ notification.message }}
                            </p>
                            <p class="text-xs text-zinc-500 font-mono mt-1">
                              {{ formatTime(notification.created_at) }}
                            </p>
                          </div>
                          <span
                            v-if="!notification.read"
                            class="w-2 h-2 bg-fuchsia-500 flex-shrink-0 mt-2"
                          />
                        </NuxtLink>
                      </div>
                    </div>
                  </div>
                </div>
              </ResponsivePopover>

              <!-- User Menu Button -->
              <button
                class="flex items-center gap-2 px-3 py-2 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                @click="userMenuOpen = true"
              >
                <UAvatar
                  :src="user.user_metadata?.avatar_url"
                  :alt="displayName"
                  size="xs"
                  class="rounded-none"
                />
                <span class="hidden sm:inline font-bold text-sm uppercase tracking-tight text-white">{{ displayName }}</span>
                <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 text-zinc-400" />
              </button>

              <!-- User Menu Slideover -->
              <USlideover
                v-model="userMenuOpen"
                :side="isMobile ? 'bottom' : 'right'"
              >
                <div class="flex flex-col h-full bg-black">
                  <!-- Header -->
                  <div class="flex items-center gap-4 p-6 border-b-2 border-zinc-800">
                    <UAvatar
                      :src="user.user_metadata?.avatar_url"
                      :alt="displayName"
                      size="lg"
                      class="rounded-none"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="font-black uppercase tracking-tight text-white truncate">{{ displayName }}</p>
                      <p class="text-sm text-zinc-400 font-mono truncate">{{ user.email }}</p>
                    </div>
                    <button
                      class="p-2 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                      @click="userMenuOpen = false"
                    >
                      <UIcon name="i-heroicons-x-mark" class="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>

                  <!-- Menu Items -->
                  <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    <NuxtLink
                      to="/dashboard"
                      class="flex items-center gap-3 px-4 py-3 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                      @click="userMenuOpen = false"
                    >
                      <UIcon name="i-heroicons-home" class="w-5 h-5 text-zinc-400" />
                      <span class="font-bold uppercase tracking-tight text-white">Dashboard</span>
                    </NuxtLink>

                    <NuxtLink
                      :to="`/user/${user?.id}`"
                      class="flex items-center gap-3 px-4 py-3 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                      @click="userMenuOpen = false"
                    >
                      <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-zinc-400" />
                      <span class="font-bold uppercase tracking-tight text-white">My Profile</span>
                    </NuxtLink>

                    <NuxtLink
                      to="/dashboard/settings"
                      class="flex items-center gap-3 px-4 py-3 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                      @click="userMenuOpen = false"
                    >
                      <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-zinc-400" />
                      <span class="font-bold uppercase tracking-tight text-white">Settings</span>
                    </NuxtLink>

                    <NuxtLink
                      v-if="isAdmin"
                      to="/admin"
                      class="flex items-center gap-3 px-4 py-3 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                      @click="userMenuOpen = false"
                    >
                      <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-zinc-400" />
                      <span class="font-bold uppercase tracking-tight text-white flex-1">Admin</span>
                      <span
                        v-if="totalPendingCount > 0"
                        class="px-2 py-0.5 text-xs font-bold text-white bg-fuchsia-500"
                      >
                        {{ totalPendingCount > 99 ? '99+' : totalPendingCount }}
                      </span>
                    </NuxtLink>

                    <div class="my-4 border-t-2 border-zinc-800" />

                    <button
                      class="flex items-center gap-3 px-4 py-3 w-full border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
                      @click="handleSignOutFromMenu"
                    >
                      <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 text-zinc-400" />
                      <span class="font-bold uppercase tracking-tight text-white">Sign out</span>
                    </button>
                  </div>
                </div>
              </USlideover>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pb-40 lg:pb-24">
      <slot />
    </main>

    <!-- Global Audio Player -->
    <AudioPlayer />

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav />

    <!-- PWA Install Prompt -->
    <PwaInstallPrompt />

    <!-- Footer -->
    <footer
      class="mt-20 border-t-2 border-zinc-800 bg-black"
      :class="{ 'hidden lg:block': user }"
    >
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <div class="mb-4">
              <span class="text-3xl font-black uppercase tracking-tighter text-fuchsia-500">FAIRTUNE</span>
            </div>
            <p class="font-black uppercase tracking-tight text-white">Stream Fair. Support Direct.</p>
            <p class="text-zinc-500 font-mono text-sm mt-2">
              The streaming platform where your subscription directly supports
              the artists you listen to.
            </p>
          </div>

          <!-- Links -->
          <div>
            <h3 class="font-black uppercase tracking-tight text-white mb-4">Platform</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/about" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  About
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/how-it-works" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  How It Works
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pricing" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  Pricing
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/for-artists" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  For Artists
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/changelog" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  Changelog
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="font-black uppercase tracking-tight text-white mb-4">Legal</h3>
            <ul class="space-y-2">
              <li>
                <NuxtLink to="/terms" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  Terms
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/privacy" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  Privacy
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/contact" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  Contact
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/dmca" class="text-zinc-400 font-mono text-sm hover:text-fuchsia-500 transition-colors">
                  DMCA
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t-2 border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-zinc-500 font-mono text-sm">
            /// 2026 FAIRTUNE /// BUILT FOR INDEPENDENT ARTISTS ///
          </p>
          <NuxtLink
            to="/changelog"
            class="inline-flex items-center gap-2 px-3 py-1 border-2 border-zinc-800 rounded-none hover:border-fuchsia-500 transition-colors"
          >
            <span class="w-2 h-2 bg-fuchsia-500"></span>
            <span class="text-zinc-400 font-mono text-sm">v{{ APP_VERSION }}</span>
          </NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { APP_VERSION } from "~/utils/version";
import type { Notification } from "~/stores/notifications";

// Global pull-to-refresh setup
const { pullDistance, isRefreshing, threshold } = useGlobalPullToRefresh();

// Responsive breakpoint detection
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("lg");

// User menu state
const userMenuOpen = ref(false);

// Notifications popover state
const notificationsOpen = ref(false);

const user = useSupabaseUser();
const { signOut } = useAuth();
const toast = useToast();

// Notifications (Pinia store)
const notificationsStore = useNotificationsStore()
const { notifications, unreadCount, loading: notificationsLoading } = storeToRefs(notificationsStore)
const {
  fetchUnreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationIcon,
  getNotificationColor,
  formatTime,
  subscribeToRealtime,
  unsubscribeFromRealtime,
} = notificationsStore

// Purchases (Pinia store)
const purchaseStore = usePurchaseStore()
const { fetchPurchases } = purchaseStore

// Fetch unread count on mount
if (import.meta.client) {
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchUnreadCount();
      subscribeToRealtime();
      fetchPurchases().catch(() => {})
    } else {
      unsubscribeFromRealtime();
      purchaseStore.reset();
    }
  }, { immediate: true });
}

onUnmounted(() => {
  unsubscribeFromRealtime();
});

watch(notificationsOpen, (isOpen) => {
  if (isOpen) {
    fetchNotifications(true);
  }
});

const handleNotificationClick = (notification: Notification) => {
  if (!notification.read) {
    markAsRead(notification.id);
  }
};

// Admin state
const adminCountsStore = useAdminCountsStore()
const { totalPendingCount, isAdmin } = storeToRefs(adminCountsStore)

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

const handleSignOutFromMenu = async () => {
  userMenuOpen.value = false;
  await handleSignOut();
};
</script>
