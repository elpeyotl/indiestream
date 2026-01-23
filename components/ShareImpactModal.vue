<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-zinc-100">Share Your Impact</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="isOpen = false"
          />
        </div>
      </template>

      <!-- Period Selector -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-zinc-300 mb-2">
          Time Period
        </label>
        <div class="flex gap-2">
          <UButton
            v-for="period in periods"
            :key="period.value"
            :color="selectedPeriod === period.value ? 'violet' : 'gray'"
            :variant="selectedPeriod === period.value ? 'solid' : 'outline'"
            size="sm"
            @click="selectedPeriod = period.value">
            {{ period.label }}
          </UButton>
        </div>
      </div>

      <!-- Stats Visibility Toggles -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-zinc-300 mb-3">
          What to Share
        </label>
        <div class="space-y-2">
          <label class="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-2 -mx-2 transition-colors">
            <UCheckbox v-model="showTotalEarned" class="mt-0.5" />
            <div>
              <span class="text-sm font-medium text-zinc-300 block">Total earned by artists</span>
              <span class="text-xs text-zinc-500">Show how much you've contributed to artists</span>
            </div>
          </label>

          <label class="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-2 -mx-2 transition-colors">
            <UCheckbox v-model="showArtistsSupported" class="mt-0.5" />
            <div>
              <span class="text-sm font-medium text-zinc-300 block">Number of artists supported</span>
              <span class="text-xs text-zinc-500">Show your artist diversity</span>
            </div>
          </label>

          <label class="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-2 -mx-2 transition-colors">
            <UCheckbox v-model="showListeningTime" class="mt-0.5" />
            <div>
              <span class="text-sm font-medium text-zinc-300 block">Listening time</span>
              <span class="text-xs text-zinc-500">Show total hours streamed</span>
            </div>
          </label>

          <label class="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-2 -mx-2 transition-colors">
            <UCheckbox v-model="showStreamCount" class="mt-0.5" />
            <div>
              <span class="text-sm font-medium text-zinc-300 block">Stream count</span>
              <span class="text-xs text-zinc-500">Show number of tracks played</span>
            </div>
          </label>

          <label class="flex items-start gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-2 -mx-2 transition-colors">
            <UCheckbox v-model="showArtistBreakdown" class="mt-0.5" />
            <div>
              <span class="text-sm font-medium text-zinc-300 block">Top artists breakdown</span>
              <span class="text-xs text-zinc-500">Show top 10 artists with earnings</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Share URL (after generated) -->
      <div v-if="shareUrl" class="mb-6">
        <label class="block text-sm font-medium text-zinc-300 mb-2">
          Share Link
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            :value="shareUrl"
            readonly
            class="flex-1 px-3 py-2 bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
          <UButton color="violet" @click="copyShareUrl">
            <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
            Copy
          </UButton>
        </div>
        <p v-if="copied" class="text-xs text-green-400 mt-2">
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 inline" />
          Link copied to clipboard!
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mb-4">
        <UButton
          @click="generateShare"
          color="violet"
          block
          :loading="loading"
          :disabled="!canGenerate">
          {{ shareUrl ? 'Regenerate Link' : 'Generate Share Link' }}
        </UButton>
      </div>

      <!-- Social Share Buttons (after generated) -->
      <div v-if="shareUrl" class="pt-4 border-t border-zinc-800">
        <p class="text-sm text-zinc-400 mb-3">Share on social media:</p>
        <div class="flex gap-2">
          <UButton
            @click="shareToTwitter"
            color="gray"
            variant="ghost"
            size="sm">
            <UIcon name="i-heroicons-share" class="w-4 h-4" /> Twitter
          </UButton>
          <UButton
            @click="shareToFacebook"
            color="gray"
            variant="ghost"
            size="sm">
            <UIcon name="i-heroicons-share" class="w-4 h-4" /> Facebook
          </UButton>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>()

const periods = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'all-time', label: 'All Time' },
]

const selectedPeriod = ref('all-time')
const showTotalEarned = ref(true)
const showArtistsSupported = ref(true)
const showListeningTime = ref(true)
const showStreamCount = ref(true)
const showArtistBreakdown = ref(false)

const loading = ref(false)
const shareUrl = ref('')
const copied = ref(false)

const canGenerate = computed(() => {
  return showTotalEarned.value ||
         showArtistsSupported.value ||
         showListeningTime.value ||
         showStreamCount.value ||
         showArtistBreakdown.value
})

const generateShare = async () => {
  loading.value = true
  copied.value = false

  try {
    const { shareUrl: url } = await $fetch('/api/impact/share', {
      method: 'POST',
      body: {
        period: selectedPeriod.value,
        showTotalEarned: showTotalEarned.value,
        showArtistsSupported: showArtistsSupported.value,
        showListeningTime: showListeningTime.value,
        showStreamCount: showStreamCount.value,
        showArtistBreakdown: showArtistBreakdown.value,
      },
    })

    // Add protocol
    const protocol = window.location.protocol
    shareUrl.value = `${protocol}//${url}`
  } catch (e: any) {
    console.error('Failed to generate share:', e)
    alert('Failed to generate share link. Please try again.')
  } finally {
    loading.value = false
  }
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true

    // Reset copied state after 3 seconds
    setTimeout(() => {
      copied.value = false
    }, 3000)
  } catch (e) {
    console.error('Failed to copy:', e)
    alert('Failed to copy link to clipboard')
  }
}

const shareToTwitter = () => {
  const text = `Check out my Fairtune impact! I've supported artists directly with my listening. 🎵`
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=550,height=420')
}

const shareToFacebook = () => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=550,height=420')
}
</script>
