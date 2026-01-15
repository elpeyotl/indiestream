<script setup lang="ts">
const route = useRoute()
const userId = route.params.id as string

const { profile, loading, error, fetchPublicProfile } = useUserProfile()

onMounted(() => {
  fetchPublicProfile(userId)
})

// Show first 8 artists, then "Show All" button
const displayedArtists = computed(() =>
  (profile.value as any)?.followedArtists?.slice(0, 8) || []
)

const hasMoreArtists = computed(() =>
  ((profile.value as any)?.followedArtists?.length || 0) > 8
)

const showAllArtists = ref(false)

const artistsToShow = computed(() =>
  showAllArtists.value
    ? (profile.value as any)?.followedArtists || []
    : displayedArtists.value
)
</script>

<template>
  <div class="min-h-screen bg-zinc-950 p-4 md:p-8">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-zinc-400" />
    </div>

    <!-- Error state -->
    <UCard v-else-if="error" class="max-w-2xl mx-auto">
      <div class="text-center py-8">
        <p class="text-red-400 mb-4">{{ error }}</p>
        <UButton to="/" variant="ghost">Go Home</UButton>
      </div>
    </UCard>

    <!-- Profile content -->
    <div v-else-if="profile" class="max-w-4xl mx-auto">
      <!-- Profile header -->
      <UCard class="mb-6">
        <div class="flex flex-col items-center text-center">
          <!-- Avatar -->
          <UserAvatar :user="profile" size="xl" class="mb-4" />

          <!-- Display name -->
          <h1 class="text-3xl font-bold text-zinc-100 mb-2">
            {{ profile.displayName || 'Anonymous User' }}
          </h1>

          <!-- Location -->
          <p v-if="profile.location" class="text-zinc-400 text-sm mb-1">
            <UIcon name="i-heroicons-map-pin" class="inline" />
            {{ profile.location }}
          </p>

          <!-- Website -->
          <a
            v-if="profile.website"
            :href="profile.website"
            target="_blank"
            rel="noopener noreferrer"
            class="text-violet-400 hover:text-violet-300 text-sm mb-4 flex items-center gap-1"
          >
            <UIcon name="i-heroicons-link" />
            {{ profile.website.replace(/^https?:\/\//, '') }}
          </a>

          <!-- Bio -->
          <p v-if="profile.bio" class="text-zinc-300 max-w-2xl mt-4">
            {{ profile.bio }}
          </p>

          <!-- Member since -->
          <p class="text-zinc-500 text-sm mt-4">
            Member since {{ new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
          </p>
        </div>
      </UCard>

      <!-- Followed artists section -->
      <div>
        <h2 class="text-xl font-semibold text-zinc-100 mb-4">
          Following
          <span class="text-zinc-500">({{ (profile as any).followedArtists?.length || 0 }})</span>
        </h2>

        <!-- Empty state -->
        <UCard v-if="!(profile as any).followedArtists || (profile as any).followedArtists.length === 0" class="text-center py-8">
          <p class="text-zinc-400">Not following any artists yet</p>
        </UCard>

        <!-- Artist grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            v-for="artist in artistsToShow"
            :key="artist.id"
            :to="`/${artist.slug}`"
            class="group"
          >
            <UCard class="hover:border-violet-500 transition-colors">
              <div class="text-center">
                <!-- Artist avatar -->
                <img
                  v-if="artist.avatarUrl"
                  :src="artist.avatarUrl"
                  :alt="artist.name"
                  class="w-full aspect-square object-cover rounded-lg mb-2"
                />
                <div
                  v-else
                  class="w-full aspect-square bg-zinc-800 rounded-lg mb-2 flex items-center justify-center"
                >
                  <UIcon name="i-heroicons-musical-note" class="w-8 h-8 text-zinc-600" />
                </div>

                <!-- Artist name -->
                <p class="text-zinc-100 font-medium truncate flex items-center justify-center gap-1">
                  {{ artist.name }}
                  <UIcon
                    v-if="artist.verified"
                    name="i-heroicons-check-badge-solid"
                    class="w-4 h-4 text-teal-400"
                  />
                </p>
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <!-- Show all button -->
        <div v-if="hasMoreArtists && !showAllArtists" class="mt-4 text-center">
          <UButton
            variant="ghost"
            color="violet"
            @click="showAllArtists = true"
          >
            Show All Artists
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
