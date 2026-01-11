<template>
  <Transition name="slide-up">
    <div
      v-if="currentTrack"
      class="fixed bottom-0 left-0 right-0 z-50"
    >
      <!-- Expanded View (Full Screen on Mobile) -->
      <Transition name="fade">
        <div
          v-if="isExpanded"
          class="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-40 flex flex-col"
        >
          <!-- Close Button -->
          <div class="flex justify-end p-4">
            <UButton
              color="gray"
              variant="ghost"
              size="lg"
              @click="isExpanded = false"
            >
              <UIcon name="i-heroicons-chevron-down" class="w-6 h-6" />
            </UButton>
          </div>

          <!-- Main Content -->
          <div class="flex-1 flex flex-col items-center justify-center px-8 pb-8">
            <!-- Large Cover -->
            <div class="w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-zinc-800 shadow-2xl mb-8">
              <img
                v-if="currentTrack.coverUrl"
                :src="currentTrack.coverUrl"
                :alt="currentTrack.albumTitle"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-musical-note" class="w-24 h-24 text-zinc-600" />
              </div>
            </div>

            <!-- Track Info -->
            <div class="text-center mb-8 w-full max-w-sm">
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

            <!-- Preview Mode Badge -->
            <div v-if="isPreviewMode" class="mb-4">
              <UBadge color="orange" variant="soft" size="sm">
                <UIcon name="i-heroicons-clock" class="w-3 h-3 mr-1" />
                {{ previewLimit }}s Preview
              </UBadge>
            </div>

            <!-- Progress Bar -->
            <div class="w-full max-w-sm mb-6">
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

            <!-- Preview Ended Message -->
            <div
              v-if="previewEnded"
              class="w-full max-w-sm mb-6 p-4 bg-zinc-800/50 rounded-xl text-center"
            >
              <p class="text-zinc-300 mb-3">Want to hear the full track?</p>
              <UButton color="violet" to="/register" @click="isExpanded = false">
                Sign up for free
              </UButton>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center gap-6">
              <UButton
                color="gray"
                variant="ghost"
                size="xl"
                :disabled="queueIndex <= 0"
                @click="playPrevious"
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
                />
              </UButton>

              <UButton
                color="gray"
                variant="ghost"
                size="xl"
                :disabled="queueIndex >= queue.length - 1"
                @click="playNext"
              >
                <UIcon name="i-heroicons-forward" class="w-8 h-8" />
              </UButton>
            </div>

            <!-- Volume (only on larger screens in expanded mode) -->
            <div class="hidden sm:flex items-center gap-3 mt-8">
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

      <!-- Preview Ended Banner -->
      <div
        v-if="previewEnded"
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
          <div class="flex items-center gap-2 sm:gap-4 h-16 md:h-20">
            <!-- Track Info (clickable to expand) -->
            <div
              class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              @click="isExpanded = true"
            >
              <!-- Cover -->
              <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                <img
                  v-if="currentTrack.coverUrl"
                  :src="currentTrack.coverUrl"
                  :alt="currentTrack.albumTitle"
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
            <div class="flex items-center gap-1 sm:gap-2 md:gap-4">
              <!-- Previous -->
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                class="w-8 h-8 sm:w-9 sm:h-9"
                :disabled="queueIndex <= 0"
                @click.stop="playPrevious"
              >
                <UIcon name="i-heroicons-backward" class="w-4 h-4 sm:w-5 sm:h-5" />
              </UButton>

              <!-- Play/Pause -->
              <UButton
                color="violet"
                class="rounded-full w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
                :loading="isLoading"
                @click.stop="togglePlay"
              >
                <UIcon
                  :name="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
                  class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                />
              </UButton>

              <!-- Next -->
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                class="w-8 h-8 sm:w-9 sm:h-9"
                :disabled="queueIndex >= queue.length - 1"
                @click.stop="playNext"
              >
                <UIcon name="i-heroicons-forward" class="w-4 h-4 sm:w-5 sm:h-5" />
              </UButton>
            </div>

            <!-- Time & Volume (Desktop only) -->
            <div class="hidden md:flex items-center gap-4 flex-1 justify-end">
              <!-- Time -->
              <div class="text-xs text-zinc-400 font-mono">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </div>

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
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
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
  togglePlay,
  playNext,
  playPrevious,
  seek,
  setVolume,
  toggleMute,
  formatTime,
  // Preview mode
  isPreviewMode,
  previewEnded,
  previewLimit,
  effectiveDuration,
} = usePlayer()

const isExpanded = ref(false)

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

// Close expanded view on escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isExpanded.value) {
      isExpanded.value = false
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
