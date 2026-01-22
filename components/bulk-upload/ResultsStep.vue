<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          :class="state.results?.success ? 'bg-green-500' : 'bg-orange-500'"
        >
          <UIcon
            :name="state.results?.success ? 'i-heroicons-check' : 'i-heroicons-exclamation-triangle'"
            class="w-5 h-5"
          />
        </div>
        <h2 class="text-lg font-semibold text-zinc-100">
          {{ state.results?.success ? 'Import Complete!' : 'Import Completed with Issues' }}
        </h2>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Success Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="p-4 bg-zinc-800/50 rounded-lg text-center">
          <p class="text-3xl font-bold text-violet-400">{{ state.results?.artistsCreated || 0 }}</p>
          <p class="text-sm text-zinc-400">Artist(s) Created</p>
        </div>
        <div class="p-4 bg-zinc-800/50 rounded-lg text-center">
          <p class="text-3xl font-bold text-teal-400">{{ state.results?.albumsCreated || 0 }}</p>
          <p class="text-sm text-zinc-400">Album(s) Created</p>
        </div>
        <div class="p-4 bg-zinc-800/50 rounded-lg text-center">
          <p class="text-3xl font-bold text-fuchsia-400">{{ state.results?.tracksCreated || 0 }}</p>
          <p class="text-sm text-zinc-400">Track(s) Created</p>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="state.results?.errors.length" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div class="flex items-start gap-3">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-medium text-red-400">{{ state.results.errors.length }} error(s) occurred</p>
            <ul class="mt-2 text-sm text-red-300 space-y-1">
              <li v-for="(error, index) in state.results.errors.slice(0, 10)" :key="index">
                {{ error }}
              </li>
              <li v-if="state.results.errors.length > 10" class="text-red-400">
                ... and {{ state.results.errors.length - 10 }} more errors
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Created Artists List -->
      <div v-if="state.results?.createdArtists.length">
        <h3 class="font-medium text-zinc-100 mb-3">Created Artists</h3>
        <div class="space-y-2">
          <NuxtLink
            v-for="artist in state.results.createdArtists"
            :key="artist.id"
            :to="`/dashboard/artist/${artist.id}`"
            class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <img
              v-if="artist.avatarKey"
              :src="getImageUrl(artist.avatarKey)"
              :alt="artist.name"
              class="w-10 h-10 rounded-lg object-cover"
            >
            <div v-else class="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span class="text-white font-bold">{{ artist.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex-1">
              <p class="font-medium text-zinc-100">{{ artist.name }}</p>
              <p class="text-sm text-zinc-500">fairtune.fm/{{ artist.slug }}</p>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-zinc-500" />
          </NuxtLink>
        </div>
      </div>

      <!-- Created Albums List -->
      <div v-if="state.results?.createdAlbums.length">
        <h3 class="font-medium text-zinc-100 mb-3">Created Albums</h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <NuxtLink
            v-for="album in state.results.createdAlbums"
            :key="album.id"
            :to="`/${album.artistSlug}/${album.albumSlug}`"
            class="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <img
              v-if="album.coverKey"
              :src="getImageUrl(album.coverKey)"
              :alt="album.title"
              class="w-10 h-10 rounded-lg object-cover"
            >
            <div v-else class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-5 h-5 text-zinc-400" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-zinc-100">{{ album.title }}</p>
              <p class="text-sm text-zinc-500">by {{ album.artistName }}</p>
            </div>
            <UBadge color="yellow" variant="soft" size="xs">
              Pending Review
            </UBadge>
          </NuxtLink>
        </div>
        <p class="text-sm text-zinc-500 mt-3">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 inline mr-1" />
          All albums are submitted for moderation and will be reviewed before publishing.
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="state.results?.success" class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-400" />
          <p class="text-green-300">
            Your music has been uploaded and submitted for review. You'll receive a notification when it's approved.
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <UButton color="gray" variant="ghost" @click="startNewImport">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          New Import
        </UButton>
        <UButton color="violet" to="/dashboard">
          <UIcon name="i-heroicons-home" class="w-4 h-4 mr-2" />
          Go to Dashboard
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
const { state, resetBulkUpload } = useBulkUpload()
const config = useRuntimeConfig()

const startNewImport = () => {
  resetBulkUpload()
}

// Get public URL for R2 images
const getImageUrl = (key: string | null | undefined): string => {
  if (!key) return ''
  const cdnUrl = config.public.r2CdnUrl || config.public.r2PublicUrl
  return `${cdnUrl}/${key}`
}
</script>
