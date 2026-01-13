<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <!-- Background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-zinc-950 to-fuchsia-950/30" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

      <div class="relative container mx-auto px-4 py-24 md:py-32 text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-8">
          <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          Fair streaming for independent artists
        </div>

        <h1 class="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Stream Fair. <br class="md:hidden" />
          <span class="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Support Direct.</span>
        </h1>
        <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          The streaming platform where your subscription directly supports the artists you listen to.
          <span class="text-zinc-300">See exactly where your money goes.</span>
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton size="xl" color="violet" to="/register">
            Start Listening Free
            <template #trailing>
              <UIcon name="i-heroicons-arrow-right-20-solid" />
            </template>
          </UButton>
          <UButton size="xl" color="gray" variant="outline" to="/pricing">
            See Pricing
          </UButton>
        </div>

        <!-- Stats -->
        <div class="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-zinc-800/50">
          <div class="text-center">
            <div class="text-3xl font-bold text-teal-400">85%</div>
            <div class="text-sm text-zinc-500">To Music Rights</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-violet-400">70%</div>
            <div class="text-sm text-zinc-500">Direct to Artists</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-fuchsia-400">15%</div>
            <div class="text-sm text-zinc-500">Platform Fee</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="container mx-auto px-4 py-24">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Why Indiestream?</h2>
        <p class="text-zinc-400 max-w-xl mx-auto">A streaming platform built on transparency and fair artist compensation.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-xl font-semibold mb-3 text-zinc-100">Fair Revenue Distribution</h3>
          <p class="text-zinc-400">
            Artists earn based on your listening time. The more you listen, the more they earn. No pool-based dilution.
          </p>
        </div>

        <div class="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-eye" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-xl font-semibold mb-3 text-zinc-100">Total Transparency</h3>
          <p class="text-zinc-400">
            See exactly how your subscription is distributed. Know which artists you supported and by how much.
          </p>
        </div>

        <div class="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-xl font-semibold mb-3 text-zinc-100">Quality Curation</h3>
          <p class="text-zinc-400">
            Every release is reviewed by real humans. No algorithm gaming, just great independent music.
          </p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="container mx-auto px-4 py-24">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">How Your Money Flows</h2>
          <p class="text-zinc-400">Unlike other platforms, we show you exactly where every cent goes.</p>
        </div>

        <div class="relative">
          <!-- Connection line -->
          <div class="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 via-fuchsia-500 to-teal-500 hidden md:block" />

          <div class="space-y-8">
            <div class="flex gap-6 items-start">
              <div class="w-16 h-16 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center shrink-0 relative z-10">
                <span class="text-violet-400 font-bold">1</span>
              </div>
              <div class="pt-3">
                <h3 class="text-xl font-semibold mb-2">You Subscribe</h3>
                <p class="text-zinc-400">Choose a plan that works for you. Monthly or yearly.</p>
              </div>
            </div>

            <div class="flex gap-6 items-start">
              <div class="w-16 h-16 rounded-full bg-fuchsia-500/20 border-2 border-fuchsia-500 flex items-center justify-center shrink-0 relative z-10">
                <span class="text-fuchsia-400 font-bold">2</span>
              </div>
              <div class="pt-3">
                <h3 class="text-xl font-semibold mb-2">You Listen</h3>
                <p class="text-zinc-400">Stream unlimited music. We track your listening time per artist.</p>
              </div>
            </div>

            <div class="flex gap-6 items-start">
              <div class="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center shrink-0 relative z-10">
                <span class="text-teal-400 font-bold">3</span>
              </div>
              <div class="pt-3">
                <h3 class="text-xl font-semibold mb-2">Artists Get Paid</h3>
                <p class="text-zinc-400">Your subscription is split proportionally to the artists you actually listened to. 70% goes directly to them, 15% to royalty societies.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- New Releases Preview -->
    <section v-if="newReleases.length > 0" class="container mx-auto px-4 py-24">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold mb-2">Fresh Releases</h2>
          <p class="text-zinc-400">The latest music from independent artists</p>
        </div>
        <UButton color="violet" variant="outline" to="/discover">
          View All
          <template #trailing>
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </template>
        </UButton>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <NuxtLink
          v-for="album in newReleases"
          :key="album.id"
          :to="`/${album.band?.slug}/${album.slug}`"
          class="group"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
            <img
              v-if="albumCovers[album.id]"
              :src="albumCovers[album.id]"
              :alt="album.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-musical-note" class="w-12 h-12 text-zinc-600" />
            </div>
          </div>
          <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ album.title }}</p>
          <p class="text-sm text-zinc-400 truncate">{{ album.band?.name }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Artists Preview -->
    <section v-if="featuredArtists.length > 0" class="container mx-auto px-4 py-24 border-t border-zinc-800/50">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold mb-2">Featured Artists</h2>
          <p class="text-zinc-400">Discover talented independent musicians</p>
        </div>
        <UButton color="violet" variant="outline" to="/discover">
          Discover More
          <template #trailing>
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
          </template>
        </UButton>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <NuxtLink
          v-for="artist in featuredArtists"
          :key="artist.id"
          :to="`/${artist.slug}`"
          class="group"
        >
          <div class="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
            <img
              v-if="artist.avatar_url"
              :src="artist.avatar_url"
              :alt="artist.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
              :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
            >
              <span class="text-4xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
            </div>
          </div>
          <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ artist.name }}</p>
          <p class="text-sm text-zinc-500">{{ formatNumber(artist.total_streams) }} streams</p>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="container mx-auto px-4 py-24">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-12 md:p-16 text-center">
        <div class="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div class="relative">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to stream fair?</h2>
          <p class="text-violet-100 max-w-xl mx-auto mb-8">
            Join thousands of music fans who are supporting independent artists the right way.
          </p>
          <UButton size="xl" color="white" to="/register">
            Get Started Free
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

const client = useSupabaseClient()
const { getStreamUrl } = useAlbum()

const newReleases = ref<Album[]>([])
const featuredArtists = ref<Band[]>([])
const albumCovers = ref<Record<string, string>>({})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const loadNewReleases = async () => {
  try {
    const { data, error } = await client
      .from('albums')
      .select(`
        id,
        title,
        slug,
        cover_key,
        cover_url,
        band:bands!inner (
          id,
          name,
          slug
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error
    newReleases.value = (data || []).map((album: any) => ({
      ...album,
      band: Array.isArray(album.band) ? album.band[0] : album.band
    }))

    // Load cover URLs (use cover_key if available, otherwise fall back to cover_url)
    for (const album of newReleases.value) {
      if (album.cover_key) {
        try {
          albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
        } catch (e) {
          // Fall back to cover_url if stream URL fails
          if (album.cover_url) {
            albumCovers.value[album.id] = album.cover_url
          }
        }
      } else if (album.cover_url) {
        albumCovers.value[album.id] = album.cover_url
      }
    }
  } catch (e) {
    console.error('Failed to load releases:', e)
  }
}

const loadFeaturedArtists = async () => {
  try {
    const { data, error } = await client
      .from('bands')
      .select('id, name, slug, theme_color, total_streams, avatar_key, avatar_url')
      .order('total_streams', { ascending: false })
      .limit(6)

    if (error) throw error

    // Load avatar URLs from keys (or use direct URL if no key)
    const artists = (data || []) as any[]
    for (const artist of artists) {
      if (artist.avatar_key) {
        try {
          artist.avatar_url = await getStreamUrl(artist.avatar_key)
        } catch (e) {
          // Skip failed avatars
        }
      }
      // avatar_url from DB is used as fallback if no avatar_key
    }
    featuredArtists.value = artists as Band[]
  } catch (e) {
    console.error('Failed to load artists:', e)
  }
}

// Fallback: Handle auth redirect if middleware didn't catch it
onMounted(async () => {
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      // Redirect to confirm page with the hash
      window.location.href = '/confirm' + window.location.hash
      return
    }
  }

  // Load discover data
  await Promise.all([
    loadNewReleases(),
    loadFeaturedArtists(),
  ])
})
</script>
