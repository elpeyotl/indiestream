<template>
  <div>
    <div v-if="albums.length === 0" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
        <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-violet-400" />
      </div>
      <h3 class="text-lg font-semibold text-zinc-100 mb-2">No releases yet</h3>
      <p v-if="bandStatus === 'active'" class="text-zinc-400 mb-6">Upload your first album or single to get started.</p>
      <p v-else class="text-zinc-400 mb-6">Once your profile is approved, you'll be able to upload music here.</p>
      <UButton
        color="violet"
        :to="bandStatus === 'active' ? '/dashboard/artist/upload' : undefined"
        :disabled="bandStatus !== 'active'"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        Upload Music
      </UButton>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="album in albums"
        :key="album.id"
        class="group relative"
      >
        <!-- Status Badge -->
        <div class="absolute top-2 left-2 z-10">
          <!-- Draft (not published) -->
          <UBadge v-if="!album.is_published" color="amber" variant="solid" size="xs">
            <UIcon name="i-heroicons-pencil" class="w-3 h-3 mr-1" />
            Draft
          </UBadge>
          <!-- Pending moderation (published but tracks pending) -->
          <UBadge v-else-if="hasPendingTracks(album)" color="orange" variant="solid" size="xs">
            <UIcon name="i-heroicons-clock" class="w-3 h-3 mr-1" />
            Pending Review
          </UBadge>
        </div>

        <!-- Album Link (owners can always preview their albums) -->
        <NuxtLink :to="`/${bandSlug}/${album.slug}`">
          <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
            <img
              v-if="albumCovers[album.id]"
              :src="albumCovers[album.id]"
              :alt="album.title"
              class="w-full h-full object-cover"
              :class="{ 'opacity-60': !album.is_published || hasPendingTracks(album) }"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
            </div>
          </div>
          <h3 class="font-medium text-zinc-100 truncate group-hover:text-violet-400">
            {{ album.title }}
          </h3>
          <p class="text-sm text-zinc-400">
            {{ album.release_type === 'ep' ? 'EP' : album.release_type === 'single' ? 'Single' : 'Album' }}
            · {{ album.tracks?.length || 0 }} tracks
            <span v-if="hasPendingTracks(album)" class="text-orange-400">· {{ getPendingCount(album) }} pending</span>
          </p>
        </NuxtLink>

        <!-- Album Actions -->
        <div class="mt-2 flex gap-2">
          <UButton color="gray" variant="ghost" size="xs" @click="$emit('editAlbum', album)">
            <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
            Edit
          </UButton>
          <UButton color="red" variant="ghost" size="xs" @click="$emit('deleteAlbum', album)">
            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
            Delete
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Album } from '~/composables/useAlbum'

defineProps<{
  albums: Album[]
  albumCovers: Record<string, string>
  bandSlug: string
  bandStatus: string
}>()

defineEmits<{
  editAlbum: [album: Album]
  deleteAlbum: [album: Album]
}>()

// Check if album has any tracks pending moderation
const hasPendingTracks = (album: Album): boolean => {
  if (!album.tracks || album.tracks.length === 0) return false
  return album.tracks.some(t => t.moderation_status === 'pending')
}

// Get count of pending tracks
const getPendingCount = (album: Album): number => {
  if (!album.tracks) return 0
  return album.tracks.filter(t => t.moderation_status === 'pending').length
}
</script>
