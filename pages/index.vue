<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <!-- Background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-zinc-950 to-fuchsia-950/30" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

      <div class="relative container mx-auto px-4 py-24 md:py-32 text-center">
        <!-- Logo with tagline -->
        <div class="flex justify-center mb-10">
          <img src="/logo-text.svg" alt="Fairtune - Heavy Riffs. Fair Pay. No Bullshit." class="h-24 md:h-32" />
        </div>

        <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Like Bandcamp, but you can stream. 70% goes to the artists you actually listen to.
          <span class="text-zinc-300">We show you every cent.</span>
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
            <div class="text-3xl font-bold text-teal-400">70%</div>
            <div class="text-sm text-zinc-500">Direct to Artists</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-violet-400">15%</div>
            <div class="text-sm text-zinc-500">To Royalties</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-fuchsia-400">15%</div>
            <div class="text-sm text-zinc-500">Keeps Us Running</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="container mx-auto px-4 py-24">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">How it actually works</h2>
        <p class="text-zinc-400 max-w-xl mx-auto">No pools. No mystery math. Your $9.99 goes to the artists you listen to.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-xl font-semibold mb-3 text-zinc-100">Your money, your artists</h3>
          <p class="text-zinc-400">
            Listen to one band all month? They get your money. Not Drake. Not a pool. Just the artist you chose.
          </p>
        </div>

        <div class="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-eye" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-xl font-semibold mb-3 text-zinc-100">We show you everything</h3>
          <p class="text-zinc-400">
            Every month you see exactly where your money went. Artist by artist, dollar by dollar. No secrets.
          </p>
        </div>

        <div class="group p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-all duration-300">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-xl font-semibold mb-3 text-zinc-100">Independent only</h3>
          <p class="text-zinc-400">
            No major labels. No algorithm-bait playlists. Just artists who own their music and fans who give a shit.
          </p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="container mx-auto px-4 py-24">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Where your $9.99 goes</h2>
          <p class="text-zinc-400">Every month. No exceptions. No mystery.</p>
        </div>

        <div class="relative">
          <!-- Connection line -->
          <div class="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500 via-fuchsia-500 to-teal-500 hidden md:block" />

          <div class="space-y-8">
            <div class="flex gap-6 items-start">
              <div class="w-16 h-16 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center shrink-0 relative z-10">
                <span class="text-teal-400 font-bold">$6.99</span>
              </div>
              <div class="pt-3">
                <h3 class="text-xl font-semibold mb-2">70% to artists</h3>
                <p class="text-zinc-400">Split between the artists you actually listened to. Play one band all month? They get all of it.</p>
              </div>
            </div>

            <div class="flex gap-6 items-start">
              <div class="w-16 h-16 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center shrink-0 relative z-10">
                <span class="text-violet-400 font-bold">$1.50</span>
              </div>
              <div class="pt-3">
                <h3 class="text-xl font-semibold mb-2">15% to royalties</h3>
                <p class="text-zinc-400">Songwriters get paid. PROs like ASCAP, BMI, GEMA, and SUISA make sure the people who wrote the music get their cut.</p>
              </div>
            </div>

            <div class="flex gap-6 items-start">
              <div class="w-16 h-16 rounded-full bg-fuchsia-500/20 border-2 border-fuchsia-500 flex items-center justify-center shrink-0 relative z-10">
                <span class="text-fuchsia-400 font-bold">$1.50</span>
              </div>
              <div class="pt-3">
                <h3 class="text-xl font-semibold mb-2">15% keeps us running</h3>
                <p class="text-zinc-400">Servers, bandwidth, payment processing, and a small team. No investors. No VC money. Just costs.</p>
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
          <div class="relative w-full pb-[100%] rounded-lg overflow-hidden bg-zinc-800 mb-2 shadow-lg group-hover:shadow-xl transition-shadow">
            <img
              v-if="artist.avatar_url"
              :src="artist.avatar_url"
              :alt="artist.name"
              class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div
              v-else
              class="absolute inset-0 w-full h-full flex items-center justify-center"
              :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
            >
              <span class="text-4xl font-bold text-white">{{ artist.name.charAt(0) }}</span>
            </div>
          </div>
          <p class="font-medium text-zinc-100 truncate group-hover:text-violet-400 transition-colors">{{ artist.name }}</p>
          <p class="text-sm text-zinc-500">Artist</p>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="container mx-auto px-4 py-24">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-12 md:p-16 text-center">
        <div class="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div class="relative">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to put your money where your ears are?</h2>
          <p class="text-violet-100 max-w-xl mx-auto mb-8">
            $9.99/month. 70% to artists. You'll see exactly where it goes.
          </p>
          <UButton size="xl" color="white" to="/register">
            Start Listening
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'
import type { Album } from '~/stores/album'

// Redirect authenticated users to discover page (handled by middleware)
definePageMeta({
  middleware: 'landing-redirect'
})

const client = useSupabaseClient()
const albumStore = useAlbumStore()
const { getStreamUrl } = albumStore
const bandStore = useBandStore()
const { resolveAvatarUrls } = bandStore
const { moderationEnabled, loadModerationSetting } = useModerationFilter()

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
    // Load moderation setting first
    await loadModerationSetting()

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
        ),
        tracks (
          id,
          moderation_status
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(15) // Fetch more since some may be filtered out

    if (error) throw error

    // Map and filter albums
    let albums = (data || []).map((album: any) => ({
      ...album,
      band: Array.isArray(album.band) ? album.band[0] : album.band
    }))

    // Filter out albums with no approved tracks when moderation is enabled
    if (moderationEnabled.value) {
      albums = albums.filter(album => {
        if (!album.tracks || album.tracks.length === 0) return false
        return album.tracks.some((track: any) => track.moderation_status === 'approved')
      })
    }

    newReleases.value = albums.slice(0, 5) // Return max 5 after filtering

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

    const artists = (data || []) as any[]
    await resolveAvatarUrls(artists)
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
