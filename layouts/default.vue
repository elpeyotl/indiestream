<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-50">
    <!-- Toast Notifications -->
    <UNotifications />

    <!-- Global Pull to Refresh Indicator -->
    <PullToRefreshIndicator
      :pull-distance="pullDistance"
      :is-refreshing="isRefreshing"
      :threshold="threshold"
    />

    <!-- Bokeh Background -->
    <BokehBackground :audio-data="audioData" />

    <!-- Header -->
    <header
      class="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 safe-area-header"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Back Button or Logo -->
          <div class="flex items-center gap-4">
            <BackButton class="md:hidden" />
            <!-- Logo -->
            <NuxtLink to="/" class="flex items-center gap-2 group">
              <img src="/logo.svg" alt="Fairstream" class="w-8 h-8" />
              <div class="text-xl font-bold">
                <span
                  class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                  >Fair</span
                ><span class="text-zinc-100">stream</span>
              </div>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center gap-6">
            <!-- Logged-in navigation -->
            <template v-if="user">
              <NuxtLink
                to="/discover"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                Discover
              </NuxtLink>
              <NuxtLink
                to="/charts"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
                Charts
              </NuxtLink>
              <NuxtLink
                to="/genres"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-tag" class="w-4 h-4" />
                Genres
              </NuxtLink>
              <NuxtLink
                to="/artists"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                Artists
              </NuxtLink>
              <NuxtLink
                to="/library"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-bookmark" class="w-4 h-4" />
                Library
              </NuxtLink>
              <NuxtLink
                to="/dashboard/stats"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-heart" class="w-4 h-4" />
                Stats
              </NuxtLink>
            </template>

            <!-- Logged-out navigation -->
            <template v-else>
              <NuxtLink
                to="/discover"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
                Discover
              </NuxtLink>
              <NuxtLink
                to="/charts"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
                Charts
              </NuxtLink>
              <NuxtLink
                to="/genres"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-tag" class="w-4 h-4" />
                Genres
              </NuxtLink>
              <NuxtLink
                to="/artists"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                Artists
              </NuxtLink>
              <NuxtLink
                to="/pricing"
                class="flex items-center gap-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
              >
                <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4" />
                Pricing
              </NuxtLink>
            </template>
          </nav>

          <!-- Auth / User Menu -->
          <div class="flex items-center gap-3">
            <!-- Global Search - Hidden on mobile (search is in bottom nav) -->
            <GlobalSearch class="hidden md:block" />

            <!-- Logged Out -->
            <template v-if="!user">
              <UButton color="gray" variant="ghost" to="/login">
                Login
              </UButton>
              <UButton color="violet" to="/register"> Sign Up </UButton>
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
                  <UButton
                    color="gray"
                    variant="ghost"
                    class="relative"
                  >
                    <UIcon name="i-heroicons-bell" class="w-5 h-5" />
                    <span
                      v-if="unreadCount > 0"
                      class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold bg-violet-500 text-white rounded-full px-1"
                    >
                      {{ unreadCount > 9 ? '9+' : unreadCount }}
                    </span>
                  </UButton>
                </template>

                <!-- Desktop: show header inside popover panel -->
                <div class="hidden md:flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span class="font-semibold text-zinc-100">Notifications</span>
                  <UButton
                    v-if="notifications.length > 0"
                    color="gray"
                    variant="ghost"
                    size="xs"
                    @click="markAllAsRead"
                  >
                    Clear all
                  </UButton>
                </div>

                <!-- Mobile: Clear all button in content area -->
                <div v-if="notifications.length > 0" class="md:hidden flex justify-end px-4 pt-2">
                  <UButton
                    color="gray"
                    variant="ghost"
                    size="xs"
                    @click="markAllAsRead"
                  >
                    Clear all
                  </UButton>
                </div>

                <!-- Notifications List -->
                <div class="overflow-y-auto max-h-72 md:max-h-72">
                  <div v-if="notificationsLoading" class="p-4 text-center">
                    <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-zinc-500" />
                  </div>

                  <div v-else-if="notifications.length === 0" class="p-6 text-center text-zinc-500">
                    <UIcon name="i-heroicons-bell-slash" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>

                  <div v-else>
                    <div
                      v-for="notification in notifications"
                      :key="notification.id"
                      class="group relative px-4 py-3 hover:bg-zinc-800/50 active:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-b-0 cursor-pointer"
                      :class="{ 'bg-zinc-800/30': !notification.read }"
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
                        <div class="flex-1 min-w-0 pr-6">
                          <p class="font-medium text-sm text-zinc-100">
                            {{ notification.title }}
                          </p>
                          <p v-if="notification.message" class="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                            {{ notification.message }}
                          </p>
                          <p class="text-xs text-zinc-500 mt-1">
                            {{ formatTime(notification.created_at) }}
                          </p>
                        </div>
                        <span
                          v-if="!notification.read"
                          class="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0 mt-2"
                        />
                      </NuxtLink>
                      <!-- Delete button -->
                      <button
                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-zinc-700 transition-all text-zinc-400 hover:text-zinc-200"
                        @click.stop.prevent="deleteNotification(notification.id)"
                      >
                        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </ResponsivePopover>

              <!-- User Menu Button -->
              <UButton
                color="gray"
                variant="ghost"
                class="flex items-center gap-2 relative"
                @click="userMenuOpen = true"
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
                <!-- Admin pending items badge -->
                <span
                  v-if="isAdmin && totalPendingCount > 0"
                  class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-1"
                >
                  {{ totalPendingCount > 9 ? '9+' : totalPendingCount }}
                </span>
              </UButton>

              <!-- User Menu Slideover -->
              <USlideover
                v-model="userMenuOpen"
                :side="isMobile ? 'bottom' : 'right'"
              >
                  <div class="flex flex-col h-full">
                    <!-- Header -->
                    <div class="flex items-center gap-4 p-6 border-b border-zinc-800">
                      <UAvatar
                        :src="user.user_metadata?.avatar_url"
                        :alt="displayName"
                        size="lg"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-zinc-100 truncate">{{ displayName }}</p>
                        <p class="text-sm text-zinc-400 truncate">{{ user.email }}</p>
                      </div>
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-x-mark"
                        @click="userMenuOpen = false"
                      />
                    </div>

                    <!-- Menu Items -->
                    <div class="flex-1 overflow-y-auto p-2">
                      <NuxtLink
                        to="/dashboard"
                        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors"
                        @click="userMenuOpen = false"
                      >
                        <UIcon name="i-heroicons-home" class="w-5 h-5 text-zinc-400" />
                        <span class="text-zinc-100">Dashboard</span>
                      </NuxtLink>

                      <NuxtLink
                        :to="`/user/${user?.id}`"
                        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors"
                        @click="userMenuOpen = false"
                      >
                        <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-zinc-400" />
                        <span class="text-zinc-100">My Profile</span>
                      </NuxtLink>

                      <NuxtLink
                        to="/dashboard/settings"
                        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors"
                        @click="userMenuOpen = false"
                      >
                        <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-zinc-400" />
                        <span class="text-zinc-100">Settings</span>
                      </NuxtLink>

                      <NuxtLink
                        v-if="isAdmin"
                        to="/admin"
                        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors"
                        @click="userMenuOpen = false"
                      >
                        <UIcon name="i-heroicons-shield-check" class="w-5 h-5 text-zinc-400" />
                        <span class="text-zinc-100 flex-1">Admin</span>
                        <span
                          v-if="totalPendingCount > 0"
                          class="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full"
                        >
                          {{ totalPendingCount > 99 ? '99+' : totalPendingCount }}
                        </span>
                      </NuxtLink>

                      <!-- Admin pending items breakdown -->
                      <div v-if="isAdmin && adminCounts && totalPendingCount > 0" class="px-4 py-2 space-y-1">
                        <NuxtLink
                          v-if="adminCounts.moderation > 0"
                          to="/admin?tab=moderation"
                          class="flex items-center justify-between text-sm py-1.5 px-3 rounded hover:bg-zinc-800/50 transition-colors"
                          @click="userMenuOpen = false"
                        >
                          <span class="text-zinc-400">Track Moderation</span>
                          <span class="text-amber-400 font-medium">{{ adminCounts.moderation }}</span>
                        </NuxtLink>
                        <NuxtLink
                          v-if="adminCounts.artists > 0"
                          to="/admin?tab=artist-approvals"
                          class="flex items-center justify-between text-sm py-1.5 px-3 rounded hover:bg-zinc-800/50 transition-colors"
                          @click="userMenuOpen = false"
                        >
                          <span class="text-zinc-400">Artist Approvals</span>
                          <span class="text-amber-400 font-medium">{{ adminCounts.artists }}</span>
                        </NuxtLink>
                        <NuxtLink
                          v-if="adminCounts.reports > 0"
                          to="/admin?tab=reports"
                          class="flex items-center justify-between text-sm py-1.5 px-3 rounded hover:bg-zinc-800/50 transition-colors"
                          @click="userMenuOpen = false"
                        >
                          <span class="text-zinc-400">Content Reports</span>
                          <span class="text-red-400 font-medium">{{ adminCounts.reports }}</span>
                        </NuxtLink>
                        <NuxtLink
                          v-if="adminCounts.dmca > 0"
                          to="/admin?tab=dmca"
                          class="flex items-center justify-between text-sm py-1.5 px-3 rounded hover:bg-zinc-800/50 transition-colors"
                          @click="userMenuOpen = false"
                        >
                          <span class="text-zinc-400">DMCA Requests</span>
                          <span class="text-red-400 font-medium">{{ adminCounts.dmca }}</span>
                        </NuxtLink>
                      </div>

                      <div class="my-2 border-t border-zinc-800" />

                      <button
                        class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 transition-colors w-full text-left"
                        @click="handleSignOutFromMenu"
                      >
                        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 text-zinc-400" />
                        <span class="text-zinc-100">Sign out</span>
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
    <!-- pb-40 on mobile for bottom nav + player, pb-24 on desktop for player only -->
    <main class="pb-40 md:pb-24">
      <slot />
    </main>

    <!-- Global Audio Player -->
    <AudioPlayer />

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav />

    <!-- PWA Install Prompt -->
    <PwaInstallPrompt />

    <!-- Footer - Hidden on mobile for logged-in users -->
    <footer
      class="mt-20 border-t border-zinc-800 bg-zinc-950"
      :class="{ 'hidden md:block': user }"
    >
      <div class="container mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="Fairstream" class="w-8 h-8" />
              <div class="text-xl font-bold">
                <span
                  class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                  >Fair</span
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
              <li>
                <NuxtLink
                  to="/dmca"
                  class="hover:text-violet-400 transition-colors"
                  >DMCA</NuxtLink
                >
              </li>
            </ul>
          </div>
        </div>

        <div
          class="mt-8 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-sm"
        >
          <p>
            &copy; 2026 Fairstream. ❤️ Built for independent artists. Designed
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
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";
import { storeToRefs } from "pinia";
import BokehBackground from "~/components/backgrounds/BokehBackground.vue";
import { APP_VERSION } from "~/utils/version";
import type { Notification } from "~/stores/notifications";

// Global pull-to-refresh setup (listeners live here, pages register callbacks)
const { pullDistance, isRefreshing, threshold } = useGlobalPullToRefresh();

// Responsive breakpoint detection
const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("md");

// User menu state
const userMenuOpen = ref(false);

// Notifications popover state
const notificationsOpen = ref(false);

const user = useSupabaseUser();
const client = useSupabaseClient();
const { signOut } = useAuth();
const playerStore = usePlayerStore();
const { audioData } = storeToRefs(playerStore);
const toast = useToast();

// Notifications (Pinia store)
const notificationsStore = useNotificationsStore()
const { notifications, unreadCount, loading: notificationsLoading } = storeToRefs(notificationsStore)
const {
  fetchUnreadCount,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationIcon,
  getNotificationColor,
  formatTime,
  subscribeToRealtime,
  unsubscribeFromRealtime,
} = notificationsStore

// Fetch unread count on mount and when user changes, subscribe to realtime
// Only run on client-side to avoid SSR auth session issues
if (import.meta.client) {
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchUnreadCount();
      subscribeToRealtime();
    } else {
      unsubscribeFromRealtime();
    }
  }, { immediate: true });
}

// Cleanup on unmount
onUnmounted(() => {
  unsubscribeFromRealtime();
});

// Fetch notifications when popover opens
watch(notificationsOpen, (isOpen) => {
  if (isOpen) {
    fetchNotifications(true);
  }
});

// Handle notification click - mark as read
const handleNotificationClick = (notification: Notification) => {
  if (!notification.read) {
    markAsRead(notification.id);
  }
};

// Admin state with realtime updates (Pinia store)
const adminCountsStore = useAdminCountsStore()
const { adminCounts, totalPendingCount, isAdmin } = storeToRefs(adminCountsStore)

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

const userMenuItems = computed(() => {
  const items = [
    [
      {
        label: "Dashboard",
        icon: "i-heroicons-home",
        to: "/dashboard",
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

  // Add admin link for admins
  if (isAdmin.value) {
    items.splice(1, 0, [
      {
        label: "Admin",
        icon: "i-heroicons-shield-check",
        to: "/admin",
      },
    ]);
  }

  return items;
});
</script>
