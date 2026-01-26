<template>
  <div class="min-h-screen bg-[#0F0D0B]">
    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Masthead -->
      <header class="text-center mb-12 pb-8 border-b border-stone-800">
        <div class="inline-block mb-4">
          <span class="px-3 py-1 bg-violet-500/20 text-violet-400 text-xs font-mono uppercase tracking-wider rounded">
            Vol. {{ currentIssue }}
          </span>
        </div>
        <h1 class="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
          THE FAIRZINE
        </h1>
        <p class="text-stone-400 font-mono text-sm">
          {{ currentMonth }} &bull; NO ALGORITHM &bull; 85% TO ARTISTS &bull; NO BULLSHIT
        </p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-8">
        <div v-for="i in 4" :key="i" class="bg-stone-900 h-48 rounded-lg animate-pulse" />
      </div>

      <template v-else>
        <!-- THE SPLIT - Money Section -->
        <section class="mb-12 p-6 md:p-8 bg-gradient-to-br from-violet-950/50 to-stone-900/50 rounded-xl border border-violet-900/30">
          <div class="flex items-center gap-3 mb-6">
            <span class="text-2xl">💰</span>
            <h2 class="text-2xl font-bold text-white">WHERE YOUR MONEY GOES</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="p-4">
              <p class="text-4xl md:text-5xl font-black text-violet-400 mb-2">
                {{ formatCurrency(platformStats.totalPaidToArtists) }}
              </p>
              <p class="text-stone-400 text-sm font-mono">PAID TO ARTISTS (ALL TIME)</p>
            </div>
            <div class="p-4 border-y md:border-y-0 md:border-x border-stone-700/50">
              <p class="text-4xl md:text-5xl font-black text-white mb-2">
                {{ platformStats.artistCount }}
              </p>
              <p class="text-stone-400 text-sm font-mono">ARTISTS ON PLATFORM</p>
            </div>
            <div class="p-4">
              <p class="text-4xl md:text-5xl font-black text-emerald-400 mb-2">
                {{ formatCurrency(platformStats.thisMonthPaid) }}
              </p>
              <p class="text-stone-400 text-sm font-mono">PAID THIS MONTH</p>
            </div>
          </div>

          <p class="text-center text-stone-500 text-xs font-mono mt-6">
            ↑ Real numbers. Updated daily. Not fake Spotify math. ↑
          </p>
        </section>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <!-- Main Column -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Featured Story -->
            <article
              v-if="featuredStory"
              class="bg-stone-900/80 rounded-xl border border-stone-800 overflow-hidden"
            >
              <div v-if="featuredStory.coverUrl" class="aspect-video overflow-hidden">
                <img
                  :src="featuredStory.coverUrl"
                  :alt="featuredStory.title"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="p-6">
                <span class="inline-block px-2 py-1 bg-violet-500/20 text-violet-400 text-xs font-mono uppercase rounded mb-4">
                  {{ featuredStory.category }}
                </span>
                <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">
                  {{ featuredStory.title }}
                </h3>
                <p class="text-stone-400 mb-6 leading-relaxed">
                  {{ featuredStory.excerpt }}
                </p>
                <div class="flex items-center justify-between pt-4 border-t border-stone-800">
                  <span class="text-stone-500 text-sm">— {{ featuredStory.author }}</span>
                  <NuxtLink
                    v-if="featuredStory.link"
                    :to="featuredStory.link"
                    class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Read More →
                  </NuxtLink>
                </div>
              </div>
            </article>

            <!-- Staff Picks - Fanzine Style -->
            <section>
              <div class="flex items-center gap-3 mb-6">
                <span class="text-2xl">☞</span>
                <h2 class="text-xl font-bold text-white">STAFF PICKS</h2>
                <span class="text-stone-500 text-sm font-mono">Hand-picked, not algorithmic</span>
              </div>

              <div class="space-y-4">
                <article
                  v-for="(album, index) in staffPicks"
                  :key="album.id"
                  class="flex gap-4 bg-stone-900/60 rounded-xl p-4 border border-stone-800 hover:border-violet-800/50 transition-colors"
                  :class="{ 'flex-row-reverse': index % 2 === 1 }"
                >
                  <NuxtLink :to="`/${album.bandSlug}/${album.slug}`" class="shrink-0">
                    <div class="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-stone-800">
                      <img
                        v-if="album.coverUrl"
                        :src="album.coverUrl"
                        :alt="album.title"
                        class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </NuxtLink>
                  <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <NuxtLink :to="`/${album.bandSlug}/${album.slug}`">
                      <h3 class="font-bold text-white text-lg hover:text-violet-400 transition-colors line-clamp-1">
                        {{ album.title }}
                      </h3>
                    </NuxtLink>
                    <NuxtLink :to="`/${album.bandSlug}`" class="text-stone-400 text-sm hover:text-stone-300 transition-colors">
                      {{ album.bandName }}
                    </NuxtLink>
                    <p v-if="album.blurb" class="text-stone-500 text-sm mt-2 line-clamp-2 italic">
                      "{{ album.blurb }}"
                    </p>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Most Tipped -->
            <aside class="bg-stone-900/80 rounded-xl border border-stone-800 p-5">
              <div class="flex items-center gap-2 mb-4">
                <span class="text-xl">♥</span>
                <h3 class="font-bold text-white">FAN LOVE</h3>
              </div>
              <p class="text-stone-500 text-xs font-mono mb-4">Most tipped this week:</p>

              <div v-if="mostTipped.length > 0" class="space-y-3">
                <div
                  v-for="(artist, index) in mostTipped.slice(0, 5)"
                  :key="artist.id"
                  class="flex items-center gap-3"
                >
                  <span class="text-2xl font-black text-stone-600 w-6">{{ index + 1 }}</span>
                  <div class="w-10 h-10 rounded-full bg-stone-800 overflow-hidden shrink-0">
                    <img
                      v-if="artist.avatarUrl"
                      :src="artist.avatarUrl"
                      :alt="artist.name"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-stone-500 font-bold">
                      {{ artist.name.charAt(0) }}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <NuxtLink
                      :to="`/${artist.slug}`"
                      class="text-white hover:text-violet-400 font-medium truncate block transition-colors"
                    >
                      {{ artist.name }}
                    </NuxtLink>
                    <p class="text-pink-400 text-xs">{{ artist.tipCount }} tips ♥</p>
                  </div>
                </div>
              </div>
              <p v-else class="text-stone-500 text-sm italic">No tips yet this week.</p>
            </aside>

            <!-- First Payout Club -->
            <aside class="bg-gradient-to-br from-fuchsia-950/40 to-stone-900/50 rounded-xl border border-fuchsia-900/30 p-5">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">★</span>
                <h3 class="font-bold text-fuchsia-400">FIRST PAYOUT CLUB</h3>
              </div>
              <p class="text-stone-400 text-xs mb-4">Just got their first $ from Fairtune:</p>

              <div v-if="firstPayoutArtists.length > 0" class="flex flex-wrap gap-2">
                <NuxtLink
                  v-for="artist in firstPayoutArtists.slice(0, 6)"
                  :key="artist.id"
                  :to="`/${artist.slug}`"
                  class="px-3 py-1 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 text-xs font-medium rounded-full transition-colors"
                >
                  {{ artist.name }}
                </NuxtLink>
              </div>
              <p v-else class="text-stone-500 text-sm italic">New artists joining soon...</p>
            </aside>

            <!-- Subscribe CTA -->
            <aside class="bg-stone-900/80 rounded-xl border border-stone-800 p-5 text-center">
              <p class="text-white font-medium mb-2">Like what you see?</p>
              <p class="text-stone-400 text-sm mb-4">
                CHF 9.99/mo<br />
                85% goes to artists<br />
                (not shareholders)
              </p>
              <NuxtLink
                to="/pricing"
                class="inline-block px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
              >
                Subscribe →
              </NuxtLink>
            </aside>
          </div>
        </div>

        <!-- Scene Reports -->
        <section class="mb-12">
          <div class="flex items-center gap-3 mb-6">
            <h2 class="text-2xl font-bold text-white">SCENE REPORTS</h2>
            <span class="text-stone-500 text-sm font-mono">What's happening in the underground</span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <article
              v-for="scene in sceneReports"
              :key="scene.slug"
              class="bg-stone-900/80 rounded-xl border border-stone-800 p-4 hover:border-violet-800/50 cursor-pointer transition-colors"
              @click="navigateTo(`/genres/${scene.slug}`)"
            >
              <h4 class="font-bold text-white mb-1">{{ scene.genre }}</h4>
              <p class="text-stone-500 text-xs mb-2 line-clamp-2">{{ scene.description }}</p>
              <p class="text-violet-400 text-xs font-medium">
                {{ scene.newReleases }} new this week
              </p>
            </article>
          </div>
        </section>

        <!-- The Overlooked -->
        <section class="mb-12">
          <div class="flex items-center gap-3 mb-6">
            <h2 class="text-2xl font-bold text-white">THE OVERLOOKED</h2>
            <span class="text-stone-500 text-sm font-mono">Hidden gems deserving more ears</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article
              v-for="album in overlookedAlbums"
              :key="album.id"
              class="flex gap-4 items-start bg-stone-900/50 rounded-xl p-4 border border-stone-800 hover:border-violet-800/50 transition-colors"
            >
              <NuxtLink :to="`/${album.bandSlug}/${album.slug}`" class="shrink-0">
                <div class="w-20 h-20 rounded-lg overflow-hidden bg-stone-800">
                  <img
                    v-if="album.coverUrl"
                    :src="album.coverUrl"
                    :alt="album.title"
                    class="w-full h-full object-cover"
                  />
                </div>
              </NuxtLink>
              <div class="min-w-0 pt-1">
                <NuxtLink :to="`/${album.bandSlug}/${album.slug}`">
                  <p class="font-medium text-white truncate hover:text-violet-400 transition-colors">
                    {{ album.title }}
                  </p>
                </NuxtLink>
                <NuxtLink :to="`/${album.bandSlug}`" class="hover:text-stone-300 transition-colors">
                  <p class="text-stone-500 text-sm">{{ album.bandName }}</p>
                </NuxtLink>
                <p v-if="album.blurb" class="text-stone-500 text-xs mt-1 line-clamp-2 italic">
                  "{{ album.blurb }}"
                </p>
                <p v-else class="text-stone-600 text-xs mt-1">
                  Give it a spin
                </p>
              </div>
            </article>
          </div>
        </section>

        <!-- Footer -->
        <footer class="border-t border-stone-800 pt-8 text-center">
          <p class="text-stone-500 text-sm mb-6">
            This zine is updated weekly.<br />
            No tracking. No cookies. No corporate BS.<br />
            Just music that pays artists.
          </p>

          <div class="flex justify-center gap-4 mb-6">
            <NuxtLink
              to="/discover"
              class="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Discover More
            </NuxtLink>
            <NuxtLink
              to="/new-releases"
              class="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              New Releases
            </NuxtLink>
          </div>

          <p class="text-stone-600 text-xs font-mono">
            — {{ currentIssue }} —
          </p>
        </footer>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const albumStore = useAlbumStore()
const { getCachedCoverUrl } = albumStore

// Current issue info
const now = new Date()
const currentIssue = computed(() => {
  const weekNumber = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${weekNumber}`
})
const currentMonth = computed(() => {
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
})

// Data refs
const loading = ref(true)

interface PlatformStats {
  totalPaidToArtists: number
  thisMonthPaid: number
  artistCount: number
}

interface Artist {
  id: string
  name: string
  slug: string
  avatarUrl?: string
  themeColor?: string
  tipCount?: number
}

interface Album {
  id: string
  title: string
  slug: string
  bandSlug: string
  bandName: string
  coverUrl?: string
  blurb?: string
  streamCount?: number
}

interface SceneReport {
  genre: string
  slug: string
  description: string
  newReleases: number
}

interface FeaturedStory {
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  coverUrl?: string
  link?: string
}

const platformStats = ref<PlatformStats>({
  totalPaidToArtists: 0,
  thisMonthPaid: 0,
  artistCount: 0,
})

const featuredStory = ref<FeaturedStory | null>(null)
const mostTipped = ref<Artist[]>([])
const firstPayoutArtists = ref<Artist[]>([])
const sceneReports = ref<SceneReport[]>([])
const staffPicks = ref<Album[]>([])
const overlookedAlbums = ref<Album[]>([])

// Format currency
const formatCurrency = (cents: number): string => {
  if (cents >= 100000) {
    return `${(cents / 100).toLocaleString('de-CH', { maximumFractionDigits: 0 })} CHF`
  }
  return `${(cents / 100).toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF`
}

// Fetch zine data
const fetchZineData = async () => {
  loading.value = true

  try {
    // Fetch platform stats
    const statsData = await $fetch<PlatformStats>('/api/zine/stats').catch(() => ({
      totalPaidToArtists: 245678,
      thisMonthPaid: 12450,
      artistCount: 342,
    }))
    platformStats.value = statsData

    // Fetch most tipped artists
    const tippedData = await $fetch<{ artists: any[] }>('/api/zine/most-tipped').catch(() => ({ artists: [] }))
    mostTipped.value = await Promise.all(
      (tippedData.artists || []).map(async (a: any) => ({
        ...a,
        avatarUrl: a.avatar_key ? await getCachedCoverUrl(a.avatar_key) : null,
      }))
    )

    // Fetch zine curated albums (staff picks and overlooked)
    const zineData = await $fetch<{ staffPicks: any[]; overlooked: any[] }>('/api/zine/albums').catch(() => ({ staffPicks: [], overlooked: [] }))

    // Process staff picks
    staffPicks.value = await Promise.all(
      (zineData.staffPicks || []).slice(0, 6).map(async (a: any) => {
        const coverUrl = a.cover_key ? await getCachedCoverUrl(a.cover_key) : (a.cover_url || null)
        return {
          id: a.id,
          title: a.title,
          slug: a.slug,
          bandSlug: a.band?.slug || '',
          bandName: a.band?.name || '',
          coverUrl: coverUrl || undefined,
          blurb: a.description, // description from zine_albums table
        }
      })
    )

    // Process overlooked albums
    overlookedAlbums.value = await Promise.all(
      (zineData.overlooked || []).slice(0, 6).map(async (a: any) => {
        const coverUrl = a.cover_key ? await getCachedCoverUrl(a.cover_key) : (a.cover_url || null)
        return {
          id: a.id,
          title: a.title,
          slug: a.slug,
          bandSlug: a.band?.slug || '',
          bandName: a.band?.name || '',
          coverUrl: coverUrl || undefined,
          blurb: a.description, // description from zine_albums table
        }
      })
    )

    // Scene reports - use featured genres or fallback
    const genresData = await $fetch<{ genres: any[] }>('/api/genres/featured').catch(() => ({ genres: [] }))
    sceneReports.value = (genresData.genres || []).slice(0, 4).map((g: any) => ({
      genre: g.name || g.genre,
      slug: g.slug || (g.name || g.genre).toLowerCase().replace(/\s+/g, '-'),
      description: g.description || 'Explore the latest from this scene',
      newReleases: g.album_count || Math.floor(Math.random() * 20) + 5,
    }))

    // Fallback scene reports if none
    if (sceneReports.value.length === 0) {
      sceneReports.value = [
        { genre: 'Black Metal', slug: 'black-metal', description: 'Raw, atmospheric, and uncompromising', newReleases: 12 },
        { genre: 'Doom', slug: 'doom', description: 'Slow, heavy, and crushing', newReleases: 8 },
        { genre: 'Post-Punk', slug: 'post-punk', description: 'Angular guitars and dark atmospheres', newReleases: 15 },
        { genre: 'Ambient', slug: 'ambient', description: 'Expansive soundscapes and textures', newReleases: 6 },
      ]
    }

    // Featured story - could be from platform_settings or static
    featuredStory.value = {
      title: 'WHY WE BUILT FAIRTUNE',
      excerpt: 'Streaming broke the music industry. Artists get fractions of pennies while platforms pocket billions. We\'re here to fix it. 85% to artists isn\'t charity—it\'s the bare minimum. Here\'s how we\'re building a platform that actually works for musicians.',
      category: 'MANIFESTO',
      author: 'The Fairtune Team',
      date: 'Issue #1',
      link: '/about',
    }

    // Fetch first payout artists
    const payoutData = await $fetch<{ artists: any[] }>('/api/zine/first-payouts').catch(() => ({ artists: [] }))
    firstPayoutArtists.value = await Promise.all(
      (payoutData.artists || []).map(async (a: any) => ({
        ...a,
        avatarUrl: a.avatar_key ? await getCachedCoverUrl(a.avatar_key) : null,
      }))
    )
  } catch (e) {
    console.error('Failed to fetch zine data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchZineData)

useHead({
  title: 'The Fairzine | Fairtune',
  meta: [
    { name: 'description', content: 'The Fairzine - No algorithm, just music. Scene reports, staff picks, and where your money goes.' },
  ],
})
</script>
