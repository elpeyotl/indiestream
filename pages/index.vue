<template>
  <div>
    <!-- Hero Section -->
    <section class="border-b-2 border-zinc-800">
      <div class="container mx-auto px-4 py-24 md:py-32 text-center">
        <!-- Logo -->
        <h1 class="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-6">
          FAIRTUNE
        </h1>
        <p class="font-mono text-fuchsia-500 text-sm mb-8">/// HEAVY RIFFS. FAIR PAY. NO BULLSHIT. ///</p>

        <p class="text-xl font-mono text-zinc-400 max-w-2xl mx-auto mb-10">
          Like Bandcamp, but you can stream. 70% goes to the artists you actually listen to.
          <span class="text-white font-bold">We show you every cent.</span>
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <NuxtLink
            to="/register"
            class="px-8 py-4 bg-fuchsia-600 text-white font-bold text-lg uppercase tracking-tight rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all"
          >
            Start Listening Free →
          </NuxtLink>
          <NuxtLink
            to="/pricing"
            class="px-8 py-4 border-2 border-fuchsia-500 text-fuchsia-500 font-bold text-lg uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
          >
            See Pricing
          </NuxtLink>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto border-2 border-zinc-800 rounded-none">
          <div class="p-6 border-r-2 border-zinc-800">
            <div class="text-4xl md:text-5xl font-black text-fuchsia-500 tracking-tighter">70%</div>
            <div class="text-xs font-mono text-zinc-500 uppercase mt-1">Direct to Artists</div>
          </div>
          <div class="p-6 border-r-2 border-zinc-800">
            <div class="text-4xl md:text-5xl font-black text-white tracking-tighter">15%</div>
            <div class="text-xs font-mono text-zinc-500 uppercase mt-1">To Royalties</div>
          </div>
          <div class="p-6">
            <div class="text-4xl md:text-5xl font-black text-fuchsia-500 tracking-tighter">15%</div>
            <div class="text-xs font-mono text-zinc-500 uppercase mt-1">Platform</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="container mx-auto px-4 py-24">
      <div class="text-center mb-16 border-b-2 border-zinc-800 pb-8">
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">HOW IT ACTUALLY WORKS</h2>
        <p class="text-zinc-400 font-mono max-w-xl mx-auto">No pools. No mystery math. Your $9.99 goes to the artists you listen to.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-8 bg-zinc-950 border-2 border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all">
          <div class="w-12 h-12 border-2 border-fuchsia-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="text-xl font-black uppercase tracking-tight text-white mb-3">Your money, your artists</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Listen to one band all month? They get your money. Not Drake. Not a pool. Just the artist you chose.
          </p>
        </div>

        <div class="p-8 bg-zinc-950 border-2 border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all">
          <div class="w-12 h-12 border-2 border-fuchsia-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-eye" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="text-xl font-black uppercase tracking-tight text-white mb-3">We show you everything</h3>
          <p class="text-zinc-400 font-mono text-sm">
            Every month you see exactly where your money went. Artist by artist, dollar by dollar. No secrets.
          </p>
        </div>

        <div class="p-8 bg-zinc-950 border-2 border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all">
          <div class="w-12 h-12 border-2 border-fuchsia-500 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-fuchsia-500" />
          </div>
          <h3 class="text-xl font-black uppercase tracking-tight text-white mb-3">Independent only</h3>
          <p class="text-zinc-400 font-mono text-sm">
            No major labels. No algorithm-bait playlists. Just artists who own their music and fans who give a shit.
          </p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="container mx-auto px-4 py-24 border-t-2 border-zinc-800">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16 border-b-2 border-zinc-800 pb-8">
          <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">WHERE YOUR $9.99 GOES</h2>
          <p class="text-zinc-400 font-mono">Every month. No exceptions. No mystery.</p>
        </div>

        <div class="space-y-6">
          <div class="flex gap-6 items-start p-6 bg-zinc-950 border-2 border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <div class="w-20 h-20 border-2 border-fuchsia-500 flex items-center justify-center shrink-0">
              <span class="text-fuchsia-500 font-black text-xl">$6.99</span>
            </div>
            <div>
              <h3 class="text-xl font-black uppercase tracking-tight text-white mb-2">70% TO ARTISTS</h3>
              <p class="text-zinc-400 font-mono text-sm">Split between the artists you actually listened to. Play one band all month? They get all of it.</p>
            </div>
          </div>

          <div class="flex gap-6 items-start p-6 bg-zinc-950 border-2 border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <div class="w-20 h-20 border-2 border-zinc-600 flex items-center justify-center shrink-0">
              <span class="text-white font-black text-xl">$1.50</span>
            </div>
            <div>
              <h3 class="text-xl font-black uppercase tracking-tight text-white mb-2">15% TO ROYALTIES</h3>
              <p class="text-zinc-400 font-mono text-sm">Songwriters get paid. PROs like ASCAP, BMI, GEMA, and SUISA make sure the people who wrote the music get their cut.</p>
            </div>
          </div>

          <div class="flex gap-6 items-start p-6 bg-zinc-950 border-2 border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
            <div class="w-20 h-20 border-2 border-zinc-600 flex items-center justify-center shrink-0">
              <span class="text-white font-black text-xl">$1.50</span>
            </div>
            <div>
              <h3 class="text-xl font-black uppercase tracking-tight text-white mb-2">15% KEEPS US RUNNING</h3>
              <p class="text-zinc-400 font-mono text-sm">Servers, bandwidth, payment processing, and a small team. No investors. No VC money. Just costs.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- New Releases Preview -->
    <section v-if="newReleases.length > 0" class="container mx-auto px-4 py-24 border-t-2 border-zinc-800">
      <div class="flex items-center justify-between mb-8 border-b-2 border-zinc-800 pb-4">
        <div>
          <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">FRESH RELEASES</h2>
          <p class="text-zinc-500 font-mono text-sm">/// The latest from independent artists</p>
        </div>
        <NuxtLink
          to="/discover"
          class="px-4 py-2 border-2 border-fuchsia-500 text-fuchsia-500 font-bold text-sm uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
        >
          View All →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <NuxtLink
          v-for="album in newReleases"
          :key="album.id"
          :to="`/${album.band?.slug}/${album.slug}`"
          class="group"
        >
          <div class="border border-zinc-700 rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all">
            <div class="relative aspect-square overflow-hidden">
              <img
                v-if="albumCovers[album.id] || album.cover_url"
                :src="(albumCovers[album.id] ?? album.cover_url) ?? undefined"
                :alt="album.title"
                class="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.20] group-hover:grayscale-0 group-hover:sepia-0 group-hover:contrast-100 group-hover:brightness-100 transition-all duration-300"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-fuchsia-900 to-zinc-900 flex items-center justify-center"
              >
                <span class="text-4xl font-black text-white/30">{{ album.title?.charAt(0) || '?' }}</span>
              </div>
            </div>
          </div>
          <div class="mt-2">
            <p class="font-black text-sm uppercase tracking-tight text-white truncate group-hover:text-fuchsia-500 transition-colors">
              {{ album.title }}
            </p>
            <p class="font-mono text-xs text-zinc-500 truncate">
              {{ album.band?.name }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Artists Preview -->
    <section v-if="featuredArtists.length > 0" class="container mx-auto px-4 py-24 border-t-2 border-zinc-800">
      <div class="flex items-center justify-between mb-8 border-b-2 border-zinc-800 pb-4">
        <div>
          <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">FEATURED ARTISTS</h2>
          <p class="text-zinc-500 font-mono text-sm">/// Discover independent musicians</p>
        </div>
        <NuxtLink
          to="/artists"
          class="px-4 py-2 border-2 border-fuchsia-500 text-fuchsia-500 font-bold text-sm uppercase tracking-tight rounded-none hover:bg-fuchsia-500 hover:text-black transition-colors"
        >
          Discover More →
        </NuxtLink>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <NuxtLink
          v-for="artist in featuredArtists"
          :key="artist.id"
          :to="`/${artist.slug}`"
          class="group"
        >
          <div class="border-2 border-zinc-800 rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all">
            <div class="relative aspect-square overflow-hidden">
              <img
                v-if="artist.avatar_url"
                :src="artist.avatar_url"
                :alt="artist.name"
                class="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.20] group-hover:grayscale-0 group-hover:sepia-0 group-hover:contrast-100 group-hover:brightness-100 transition-all duration-300"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :style="{ background: `linear-gradient(135deg, ${artist.theme_color || '#8B5CF6'} 0%, #c026d3 100%)` }"
              >
                <span class="text-5xl font-black text-white/80">{{ artist.name.charAt(0) }}</span>
              </div>
            </div>
          </div>
          <div class="mt-2">
            <p class="font-black text-sm uppercase tracking-tight text-white truncate group-hover:text-fuchsia-500 transition-colors">
              {{ artist.name }}
            </p>
            <p class="font-mono text-xs text-zinc-500">Artist</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="container mx-auto px-4 py-24">
      <div class="border-2 border-zinc-800 bg-zinc-950 p-12 md:p-16 text-center shadow-[8px_8px_0px_0px_rgba(139,92,246,0.5)]">
        <h2 class="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
          FUCK THE<br />
          <span class="text-fuchsia-500">ALGORITHM</span>
        </h2>
        <p class="text-zinc-400 font-mono max-w-xl mx-auto mb-8">
          $9.99/month. 70% to artists. You'll see exactly where it goes. No mystery pools. No payola playlists.
        </p>
        <NuxtLink
          to="/register"
          class="inline-block px-8 py-4 bg-fuchsia-600 text-white font-bold text-lg uppercase tracking-tight rounded-none shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)] transition-all"
        >
          Start Listening →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Band } from '~/stores/band'
import type { Album } from '~/stores/album'

definePageMeta({
  middleware: 'landing-redirect',
  layout: 'brutalist'
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

const loadNewReleases = async () => {
  try {
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
      .limit(15)

    if (error) throw error

    let albums = (data || []).map((album: any) => ({
      ...album,
      band: Array.isArray(album.band) ? album.band[0] : album.band
    }))

    if (moderationEnabled.value) {
      albums = albums.filter(album => {
        if (!album.tracks || album.tracks.length === 0) return false
        return album.tracks.some((track: any) => track.moderation_status === 'approved')
      })
    }

    newReleases.value = albums.slice(0, 5)

    for (const album of newReleases.value) {
      if (album.cover_key) {
        try {
          albumCovers.value[album.id] = await getStreamUrl(album.cover_key)
        } catch (e) {
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

onMounted(async () => {
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      window.location.href = '/confirm' + window.location.hash
      return
    }
  }

  await Promise.all([
    loadNewReleases(),
    loadFeaturedArtists(),
  ])
})
</script>
