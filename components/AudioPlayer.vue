<template>
  <Transition name="slide-up">
    <div
      v-if="currentTrack"
      class="fixed left-0 right-0 z-50 bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-0"
    >
      <!-- Expanded View (Full Screen on Mobile) -->
      <Transition name="fade">
        <div
          v-if="isExpanded"
          class="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-40 flex flex-col"
        >
          <!-- Dynamic Background Effect (z-0 so it stays behind content) -->
          <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <DynamicBackground :audio-data="audioData" />
          </div>

          <!-- Header with Background Selector and Close Button -->
          <div class="flex justify-between items-center p-4 relative z-10">
            <BackgroundSelector />
            <UButton
              color="gray"
              variant="ghost"
              size="lg"
              @click="isExpanded = false"
            >
              <UIcon name="i-heroicons-chevron-down" class="w-6 h-6" />
            </UButton>
          </div>

          <!-- Main Content (swipeable area) -->
          <div
            ref="swipeArea"
            class="flex-1 flex flex-col items-center justify-center px-8 pb-8 overflow-hidden touch-pan-y"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
          >
            <!-- Album Cover with slide transition -->
            <div class="w-full max-w-[min(24rem,40vh)] relative mb-4 mt-2 shrink-0 overflow-hidden">
              <div
                class="w-full aspect-square rounded-2xl overflow-hidden bg-zinc-800 shadow-2xl cover-slide"
                :class="slideClass"
              >
                <NuxtImg
                  v-if="currentTrack.coverUrl"
                  :src="currentTrack.coverUrl"
                  :alt="currentTrack.albumTitle"
                  :width="384"
                  :height="384"
                  format="webp"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-24 h-24 text-zinc-600" />
                </div>
              </div>
            </div>

            <!-- Track Info -->
            <div class="text-center mb-4 w-full max-w-sm">
              <h2 class="text-2xl font-bold text-zinc-100 truncate mb-1">
                {{ currentTrack.title }}
              </h2>
              <NuxtLink
                :to="`/${currentTrack.artistSlug}`"
                class="text-lg text-violet-400 hover:text-violet-300"
                @click="isExpanded = false"
              >
                {{ currentTrack.artist }}
              </NuxtLink>
            </div>

            <!-- Free Play Badge -->
            <div v-if="isFreePlay && !isSubscribed" class="mb-4">
              <UBadge color="teal" variant="soft" size="sm">
                <UIcon name="i-heroicons-gift" class="w-3 h-3 mr-1" />
                Free Play ({{ freePlaysRemaining }} left)
              </UBadge>
            </div>

            <!-- Preview Mode Badge -->
            <div v-else-if="isPreviewMode" class="mb-4">
              <UBadge color="orange" variant="soft" size="sm">
                <UIcon name="i-heroicons-clock" class="w-3 h-3 mr-1" />
                {{ previewLimit }}s Preview
              </UBadge>
            </div>

            <!-- Progress Bar -->
            <div class="w-full max-w-sm mb-4">
              <div
                class="h-2 bg-zinc-800 rounded-full cursor-pointer overflow-hidden relative"
                @click="onProgressClick"
              >
                <div
                  class="h-full bg-violet-500 rounded-full transition-all duration-100"
                  :style="{ width: `${progress}%` }"
                />
                <!-- Preview limit marker -->
                <div
                  v-if="isPreviewMode && duration > previewLimit"
                  class="absolute top-0 bottom-0 w-0.5 bg-orange-500 rounded-full"
                  :style="{ left: `${(previewLimit / duration) * 100}%` }"
                />
              </div>
              <div class="flex justify-between mt-2 text-xs text-zinc-400 font-mono">
                <span>{{ formatTime(currentTime) }}</span>
                <span v-if="isPreviewMode && duration > previewLimit" class="text-orange-400">
                  {{ formatTime(previewLimit) }} / {{ formatTime(duration) }}
                </span>
                <span v-else>{{ formatTime(duration) }}</span>
              </div>
            </div>

            <!-- Preview Ended Message (for non-logged-in users) -->
            <div
              v-if="previewEnded && !user"
              class="w-full max-w-sm mb-6 p-4 bg-zinc-800/50 rounded-xl text-center"
            >
              <p class="text-zinc-300 mb-3">Want to hear the full track?</p>
              <UButton color="violet" to="/register" @click="isExpanded = false">
                Sign up for free
              </UButton>
            </div>

            <!-- Preview Ended Message (for logged-in free users at limit) -->
            <div
              v-else-if="previewEnded && user"
              class="w-full max-w-sm mb-6 p-4 bg-zinc-800/50 rounded-xl text-center"
            >
              <p class="text-zinc-300 mb-3">You've used your free tracks this month</p>
              <UButton color="violet" to="/pricing" @click="isExpanded = false">
                Subscribe for unlimited
              </UButton>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center gap-4">
              <!-- Shuffle -->
              <UButton
                color="gray"
                variant="ghost"
                size="lg"
                :class="{ '!text-violet-400': shuffleEnabled }"
                @click="toggleShuffle"
              >
                <UIcon name="i-lucide-shuffle" class="w-6 h-6" :class="{ '!text-violet-400': shuffleEnabled }" />
              </UButton>

              <UButton
                color="gray"
                variant="ghost"
                size="xl"
                :disabled="queueIndex <= 0"
                @click="handlePreviousClick"
              >
                <UIcon name="i-heroicons-backward" class="w-8 h-8" />
              </UButton>

              <UButton
                color="violet"
                size="xl"
                class="rounded-full w-16 h-16"
                :loading="isLoading"
                @click="togglePlay"
              >
                <UIcon
                  :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
                  class="w-8 h-8"
                  :class="isPlaying ? 'mr-0.5' : 'ml-1.5'"
                />
              </UButton>

              <UButton
                color="gray"
                variant="ghost"
                size="xl"
                :disabled="queueIndex >= queue.length - 1 && repeatMode === 'off'"
                @click="handleNextClick"
              >
                <UIcon name="i-heroicons-forward" class="w-8 h-8" />
              </UButton>

              <!-- Repeat -->
              <UButton
                color="gray"
                variant="ghost"
                size="lg"
                class="relative"
                :class="{ '!text-violet-400': repeatMode !== 'off' }"
                @click="cycleRepeatMode"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6" :class="{ '!text-violet-400': repeatMode !== 'off' }" />
                <span
                  v-if="repeatMode === 'one'"
                  class="absolute -top-0.5 -right-0.5 text-xs font-bold text-violet-400"
                >
                  1
                </span>
              </UButton>
            </div>

            <!-- Heart Button -->
            <div v-if="user" class="mt-4">
              <UButton
                color="gray"
                variant="ghost"
                size="lg"
                :class="{ 'text-red-500': isCurrentTrackLiked }"
                @click="handleHeartClick"
              >
                <UIcon
                  :name="isCurrentTrackLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                  class="w-7 h-7"
                />
              </UButton>
            </div>

            <!-- Volume (only on larger screens in expanded mode) -->
            <div class="hidden sm:flex items-center gap-3 mt-4">
              <UButton
                color="gray"
                variant="ghost"
                size="sm"
                @click="toggleMute"
              >
                <UIcon :name="volumeIcon" class="w-5 h-5" />
              </UButton>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="isMuted ? 0 : volume"
                class="w-32 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-violet-500"
                @input="onVolumeChange"
              />
            </div>
          </div>

          <!-- Queue Preview -->
          <div v-if="queue.length > 1" class="px-4 pb-6">
            <p class="text-xs text-zinc-500 mb-2 text-center">
              Track {{ queueIndex + 1 }} of {{ queue.length }}
            </p>
          </div>
        </div>
      </Transition>

      <!-- Upgrade Prompt Banner (for logged-in free users out of plays) -->
      <div
        v-if="showUpgradePrompt"
        class="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2"
      >
        <div class="container mx-auto flex items-center justify-between gap-4">
          <p class="text-sm text-white">
            You've used your 5 free tracks this month.
            <NuxtLink to="/pricing" class="font-semibold underline hover:no-underline">
              Subscribe
            </NuxtLink>
            for unlimited listening!
          </p>
          <UButton
            color="white"
            variant="ghost"
            size="xs"
            @click="dismissUpgradePrompt"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </UButton>
        </div>
      </div>

      <!-- Preview Ended Banner (for non-logged-in users) -->
      <div
        v-else-if="previewEnded && !user"
        class="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-center"
      >
        <p class="text-sm text-white">
          Preview ended.
          <NuxtLink to="/register" class="font-semibold underline hover:no-underline">
            Sign up
          </NuxtLink>
          to listen to full tracks!
        </p>
      </div>

      <!-- Preview Ended Banner (for logged-in free users at limit) -->
      <div
        v-else-if="previewEnded && user"
        class="bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-center"
      >
        <p class="text-sm text-white">
          Preview ended.
          <NuxtLink to="/pricing" class="font-semibold underline hover:no-underline">
            Subscribe
          </NuxtLink>
          for unlimited full tracks!
        </p>
      </div>

      <!-- Mini Player Bar -->
      <div class="bg-zinc-900 border-t border-zinc-800">
        <!-- Progress bar (clickable) -->
        <div
          class="h-1 bg-zinc-800 cursor-pointer group relative"
          @click="onProgressClick"
        >
          <div
            class="h-full bg-violet-500 transition-all duration-100"
            :style="{ width: `${progress}%` }"
          />
          <!-- Preview limit marker -->
          <div
            v-if="isPreviewMode && duration > previewLimit"
            class="absolute top-0 bottom-0 w-0.5 bg-orange-500"
            :style="{ left: `${(previewLimit / duration) * 100}%` }"
          />
        </div>

        <div class="container mx-auto px-4">
          <div
            class="flex items-center gap-2 sm:gap-4 h-16 md:h-20 cursor-pointer"
            @click="isExpanded = true"
          >
            <!-- Track Info -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <!-- Cover -->
              <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                <NuxtImg
                  v-if="currentTrack.coverUrl"
                  :src="currentTrack.coverUrl"
                  :alt="currentTrack.albumTitle"
                  :width="56"
                  :height="56"
                  format="webp"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-600" />
                </div>
              </div>

              <!-- Text -->
              <div class="min-w-0">
                <p class="text-sm md:text-base font-medium text-zinc-100 truncate">
                  {{ currentTrack.title }}
                </p>
                <p class="text-xs md:text-sm text-zinc-400 truncate">
                  {{ currentTrack.artist }}
                </p>
              </div>

              <!-- Expand indicator (mobile) -->
              <UIcon name="i-heroicons-chevron-up" class="w-4 h-4 text-zinc-500 sm:hidden shrink-0" />
            </div>

            <!-- Controls -->
            <div class="flex items-center gap-1 sm:gap-2 md:gap-3">
              <!-- Shuffle (hidden on mobile) -->
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                class="hidden sm:flex w-10 h-10 sm:w-10 sm:h-10"
                :class="{ '!text-violet-400': shuffleEnabled }"
                @click.stop="toggleShuffle"
              >
                <UIcon name="i-lucide-shuffle" class="w-5 h-5" :class="{ '!text-violet-400': shuffleEnabled }" />
              </UButton>

              <!-- Previous -->
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                class="w-10 h-10 sm:w-10 sm:h-10"
                :disabled="queueIndex <= 0"
                @click.stop="handlePreviousClick"
              >
                <UIcon name="i-heroicons-backward" class="w-5 h-5" />
              </UButton>

              <!-- Play/Pause -->
              <UButton
                color="violet"
                class="rounded-full w-11 h-11 sm:w-12 sm:h-12"
                :loading="isLoading"
                @click.stop="togglePlay"
              >
                <UIcon
                  :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
                  class="w-5 h-5 sm:w-6 sm:h-6"
                  :class="isPlaying ? 'ml-0.5' : 'ml-1'"
                />
              </UButton>

              <!-- Next -->
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                class="w-10 h-10 sm:w-10 sm:h-10"
                :disabled="queueIndex >= queue.length - 1 && repeatMode === 'off'"
                @click.stop="handleNextClick"
              >
                <UIcon name="i-heroicons-forward" class="w-5 h-5" />
              </UButton>

              <!-- Repeat (hidden on mobile) -->
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                class="hidden sm:flex w-10 h-10 sm:w-10 sm:h-10 relative"
                :class="{ '!text-violet-400': repeatMode !== 'off' }"
                @click.stop="cycleRepeatMode"
              >
                <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" :class="{ '!text-violet-400': repeatMode !== 'off' }" />
                <span
                  v-if="repeatMode === 'one'"
                  class="absolute -top-0.5 -right-0.5 text-[10px] font-bold text-violet-400"
                >
                  1
                </span>
              </UButton>

              <!-- Heart (hidden on mobile, only for logged in users) -->
              <UButton
                v-if="user"
                color="gray"
                variant="ghost"
                size="xs"
                class="hidden sm:flex w-10 h-10 sm:w-10 sm:h-10"
                :class="{ 'text-red-500': isCurrentTrackLiked }"
                @click.stop="handleHeartClick"
              >
                <UIcon
                  :name="isCurrentTrackLiked ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                  class="w-5 h-5"
                />
              </UButton>
            </div>

            <!-- Time, Queue & Volume (Desktop only) -->
            <div class="hidden md:flex items-center gap-4 flex-1 justify-end" @click.stop>
              <!-- Time -->
              <div class="text-xs text-zinc-400 font-mono">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>

              <!-- Queue Button -->
              <UButton
                v-if="queue.length > 1"
                color="gray"
                variant="ghost"
                size="xs"
                :class="{ 'text-violet-400': showQueue }"
                @click.stop="showQueue = !showQueue"
              >
                <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
              </UButton>

              <!-- Volume -->
              <div class="flex items-center gap-2">
                <UButton
                  color="gray"
                  variant="ghost"
                  size="xs"
                  @click="toggleMute"
                >
                  <UIcon :name="volumeIcon" class="w-5 h-5" />
                </UButton>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  :value="isMuted ? 0 : volume"
                  class="w-20 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-violet-500"
                  @input="onVolumeChange"
                />
              </div>
            </div>

            <!-- Queue Button (Mobile/Tablet) -->
            <UButton
              v-if="queue.length > 1"
              color="gray"
              variant="ghost"
              size="xs"
              class="md:hidden w-10 h-10"
              :class="{ 'text-violet-400': showQueue }"
              @click.stop="showQueue = !showQueue"
            >
              <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
            </UButton>
          </div>
        </div>
      </div>

      <!-- Queue Panel -->
      <Transition name="slide-up-queue">
        <div
          v-if="showQueue"
          class="absolute bottom-full left-0 right-0 bg-zinc-900 border-t border-zinc-800 shadow-2xl max-h-80 overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-zinc-100">Queue</h3>
            <div class="flex items-center gap-2">
              <span class="text-xs text-zinc-500">{{ queue.length }} tracks</span>
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                @click="showQueue = false"
              >
                <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
              </UButton>
            </div>
          </div>
          <div class="overflow-y-auto max-h-64">
            <div
              v-for="(track, index) in queue"
              :key="track.id"
              class="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800/50 cursor-pointer transition-colors"
              :class="{ 'bg-zinc-800': index === queueIndex }"
              @click="handleQueueItemClick(index)"
            >
              <!-- Track Number / Playing Indicator -->
              <div class="w-6 text-center shrink-0">
                <span v-if="index === queueIndex && isPlaying" class="text-violet-400">
                  <UIcon name="i-heroicons-speaker-wave" class="w-4 h-4 animate-pulse" />
                </span>
                <span v-else class="text-xs text-zinc-500">{{ index + 1 }}</span>
              </div>

              <!-- Cover -->
              <div class="w-10 h-10 rounded overflow-hidden bg-zinc-800 shrink-0">
                <NuxtImg
                  v-if="track.coverUrl"
                  :src="track.coverUrl"
                  :alt="track.albumTitle"
                  :width="40"
                  :height="40"
                  format="webp"
                  loading="lazy"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-musical-note" class="w-4 h-4 text-zinc-600" />
                </div>
              </div>

              <!-- Track Info -->
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-medium truncate"
                  :class="index === queueIndex ? 'text-violet-400' : 'text-zinc-100'"
                >
                  {{ track.title }}
                </p>
                <p class="text-xs text-zinc-500 truncate">
                  {{ track.artist }} &middot; {{ track.albumTitle }}
                </p>
              </div>

              <!-- Duration -->
              <span class="text-xs text-zinc-500 shrink-0">
                {{ formatTime(track.duration || 0) }}
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

const user = useSupabaseUser()
const subscriptionStore = useSubscriptionStore()
const { freePlaysRemaining, isSubscribed } = storeToRefs(subscriptionStore)

const playerStore = usePlayerStore()

// Use storeToRefs for reactive state
const {
  currentTrack,
  queue,
  queueIndex,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLoading,
  progress,
  // Preview mode
  isPreviewMode,
  previewEnded,
  effectiveDuration,
  // Free tier
  isFreePlay,
  showUpgradePrompt,
  // Shuffle and repeat
  shuffleEnabled,
  repeatMode,
  // Audio visualizer data
  audioData,
} = storeToRefs(playerStore)

// Destructure actions and getters directly
const {
  togglePlay,
  playNext,
  playPrevious,
  playFromQueue,
  seek,
  setVolume,
  toggleMute,
  toggleShuffle,
  cycleRepeatMode,
  formatTime,
  dismissUpgradePrompt,
  previewLimit,
} = playerStore

const libraryStore = useLibraryStore()
const { isTrackLiked, toggleTrackLike } = libraryStore

const isExpanded = ref(false)
const showQueue = ref(false)

// Track navigation direction for slide animation
const slideDirection = ref<'left' | 'right' | null>(null)
const isAnimating = ref(false)
const swipeArea = ref<HTMLElement | null>(null)

// Computed class for slide animation
const slideClass = computed(() => {
  if (!isAnimating.value) return ''
  return slideDirection.value === 'left' ? 'slide-in-left' : 'slide-in-right'
})

// Watch for track changes to trigger animation
watch(() => currentTrack.value?.id, (newId, oldId) => {
  if (newId && oldId && newId !== oldId) {
    // Trigger animation
    isAnimating.value = true
    // Reset animation state after it completes
    setTimeout(() => {
      isAnimating.value = false
    }, 280)
  }
})

// Simple swipe gesture handling for mobile
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeThreshold = 80

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const onTouchMove = (e: TouchEvent) => {
  // Just track - we don't move the cover during swipe anymore
}

const onTouchEnd = (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0].clientX
  const touchEndY = e.changedTouches[0].clientY
  const deltaX = touchEndX - touchStartX.value
  const deltaY = touchEndY - touchStartY.value

  // Only handle horizontal swipes
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
    if (deltaX > 0 && queueIndex.value > 0) {
      // Swipe right -> previous track (new cover comes from left)
      slideDirection.value = 'right'
      playPrevious()
    } else if (deltaX < 0 && (queueIndex.value < queue.value.length - 1 || repeatMode.value !== 'off')) {
      // Swipe left -> next track (new cover comes from right)
      slideDirection.value = 'left'
      playNext()
    }
  }
}

// Button click handlers (set direction before navigation)
const handlePreviousClick = () => {
  slideDirection.value = 'right'
  playPrevious()
}

const handleNextClick = () => {
  slideDirection.value = 'left'
  playNext()
}

// Heart/favorite functionality
const isCurrentTrackLiked = computed(() => {
  if (!currentTrack.value?.id) return false
  return isTrackLiked(currentTrack.value.id)
})

const handleHeartClick = async () => {
  if (!currentTrack.value?.id) return
  await toggleTrackLike(currentTrack.value.id)
}

const handleQueueItemClick = (index: number) => {
  if (index !== queueIndex.value) {
    playFromQueue(index)
  }
}

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'i-heroicons-speaker-x-mark'
  if (volume.value < 0.5) return 'i-heroicons-speaker-wave'
  return 'i-heroicons-speaker-wave'
})

const onProgressClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  // Use effective duration to respect preview limits
  const maxDuration = isPreviewMode.value ? Math.min(duration.value, previewLimit) : duration.value
  const newTime = percent * maxDuration
  seek(newTime)
}

const onVolumeChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  setVolume(parseFloat(target.value))
}

// Prevent body scroll when expanded
watch(isExpanded, (expanded) => {
  if (expanded) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Clean up body overflow on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})

// Close expanded view or queue on escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showQueue.value) {
        showQueue.value = false
      } else if (isExpanded.value) {
        isExpanded.value = false
      }
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-queue-enter-active,
.slide-up-queue-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-up-queue-enter-from,
.slide-up-queue-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Slide animations for album cover */
.cover-slide {
  will-change: transform;
}

.slide-in-left {
  animation: slideInFromRight 280ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

.slide-in-right {
  animation: slideInFromLeft 280ms cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

@keyframes slideInFromRight {
  0% {
    transform: translateX(100%);
    opacity: 0.5;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromLeft {
  0% {
    transform: translateX(-100%);
    opacity: 0.5;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Custom range input styling */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
