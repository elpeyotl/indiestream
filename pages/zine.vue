<template>
  <div class="min-h-screen bg-black text-white relative">
    <!-- SVG Noise Overlay -->
    <div class="fixed inset-0 pointer-events-none z-50 opacity-[0.05] mix-blend-overlay">
      <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.80"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>

    <div class="max-w-6xl mx-auto px-4 py-8">
      <!-- Masthead -->
      <header class="text-center mb-12 pb-8 border-b-2 border-zinc-800">
        <div class="inline-block mb-4">
          <span class="px-3 py-1 border-2 border-fuchsia-500 text-fuchsia-500 text-xs font-mono uppercase tracking-wider rounded-none">
            Vol. {{ currentIssue }}
          </span>
        </div>
        <h1 class="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase">
          THE FAIRZINE
        </h1>
        <p class="text-zinc-400 font-mono text-sm">
          {{ currentMonth }} /// NO ALGORITHM /// 85% TO ARTISTS /// NO BULLSHIT
        </p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-8">
        <div v-for="i in 4" :key="i" class="bg-zinc-900 h-48 rounded-none border-2 border-zinc-800 animate-pulse" />
      </div>

      <template v-else>
        <!-- THE SPLIT - Money Section -->
        <section class="mb-12 p-6 md:p-8 bg-zinc-950 rounded-none border-2 border-zinc-800 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
          <div class="flex items-center gap-3 mb-6 border-b-2 border-zinc-800 pb-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tighter">WHERE YOUR MONEY GOES</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="p-4">
              <p class="text-4xl md:text-5xl font-black text-fuchsia-500 mb-2 tracking-tighter">
                {{ formatCurrency(platformStats.totalPaidToArtists) }}
              </p>
              <p class="text-zinc-400 text-xs font-mono uppercase">Paid to Artists (All Time)</p>
            </div>
            <div class="p-4 border-y-2 md:border-y-0 md:border-x-2 border-zinc-800">
              <p class="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter">
                {{ platformStats.artistCount }}
              </p>
              <p class="text-zinc-400 text-xs font-mono uppercase">Artists on Platform</p>
            </div>
            <div class="p-4">
              <p class="text-4xl md:text-5xl font-black text-fuchsia-500 mb-2 tracking-tighter">
                {{ formatCurrency(platformStats.thisMonthPaid) }}
              </p>
              <p class="text-zinc-400 text-xs font-mono uppercase">Paid This Month</p>
            </div>
          </div>

          <p class="text-center text-zinc-500 text-xs font-mono mt-6">
            /// REAL NUMBERS. UPDATED DAILY. NOT FAKE SPOTIFY MATH. ///
          </p>
        </section>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <!-- Main Column -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Featured Story -->
            <article
              v-if="featuredStory"
              class="bg-zinc-950 rounded-none border-2 border-zinc-800 overflow-hidden shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]"
            >
              <div v-if="featuredStory.coverUrl" class="aspect-video overflow-hidden">
                <img
                  :src="featuredStory.coverUrl"
                  :alt="featuredStory.title"
                  class="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.20] hover:grayscale-0 hover:sepia-0 hover:contrast-100 hover:brightness-100 transition-all duration-300"
                />
              </div>
              <div class="p-6">
                <span class="inline-block px-3 py-1 border-2 border-fuchsia-500 text-fuchsia-500 text-xs font-mono uppercase rounded-none mb-4">
                  {{ featuredStory.category }}
                </span>
                <h3 class="text-2xl md:text-3xl font-black text-white mb-4 uppercase tracking-tighter">
                  {{ featuredStory.title }}
                </h3>
                <p class="text-zinc-400 font-mono text-sm mb-6 leading-relaxed">
                  {{ featuredStory.excerpt }}
                </p>
                <div class="flex items-center justify-between pt-4 border-t-2 border-zinc-800">
                  <span class="text-zinc-500 text-sm font-mono">— {{ featuredStory.author }}</span>
                  <NuxtLink
                    v-if="featuredStory.link"
                    :to="featuredStory.link"
                    class="px-4 py-2 bg-fuchsia-600 text-white text-sm font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
                  >
                    Read More →
                  </NuxtLink>
                </div>
              </div>
            </article>

            <!-- Staff Picks -->
            <section>
              <div class="flex items-center gap-3 mb-6 border-b-2 border-zinc-800 pb-4">
                <h2 class="text-xl font-black text-white uppercase tracking-tighter">STAFF PICKS</h2>
                <span class="text-zinc-500 text-xs font-mono">/// Hand-picked, not algorithmic</span>
              </div>

              <div class="space-y-4">
                <article
                  v-for="(album, index) in staffPicks"
                  :key="album.id"
                  class="flex gap-4 bg-zinc-950 rounded-none p-4 border-2 border-zinc-800 hover:border-fuchsia-500/50 transition-colors shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] group"
                  :class="{ 'flex-row-reverse': index % 2 === 1 }"
                >
                  <NuxtLink :to="`/${album.bandSlug}/${album.slug}`" class="shrink-0">
                    <div class="w-24 h-24 md:w-32 md:h-32 rounded-none overflow-hidden bg-zinc-800 border border-zinc-700">
                      <img
                        v-if="album.coverUrl"
                        :src="album.coverUrl"
                        :alt="album.title"
                        class="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.20] group-hover:grayscale-0 group-hover:sepia-0 group-hover:contrast-100 group-hover:brightness-100 transition-all duration-300"
                      />
                    </div>
                  </NuxtLink>
                  <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <NuxtLink :to="`/${album.bandSlug}/${album.slug}`">
                      <h3 class="font-black text-white text-lg uppercase tracking-tight hover:text-fuchsia-500 transition-colors line-clamp-1">
                        {{ album.title }}
                      </h3>
                    </NuxtLink>
                    <NuxtLink :to="`/${album.bandSlug}`" class="text-zinc-400 text-sm font-mono hover:text-zinc-300 transition-colors">
                      {{ album.bandName }}
                    </NuxtLink>
                    <p v-if="album.blurb" class="text-zinc-500 text-sm font-mono mt-2 line-clamp-2 italic">
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
            <aside class="bg-zinc-950 rounded-none border-2 border-zinc-800 p-5 shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
              <div class="flex items-center gap-2 mb-4 border-b-2 border-zinc-800 pb-3">
                <h3 class="font-black text-white uppercase tracking-tighter">FAN LOVE</h3>
              </div>
              <p class="text-zinc-500 text-xs font-mono mb-4 uppercase">Most tipped this week:</p>

              <div v-if="mostTipped.length > 0" class="space-y-3">
                <div
                  v-for="(artist, index) in mostTipped.slice(0, 5)"
                  :key="artist.id"
                  class="flex items-center gap-3 group"
                >
                  <span class="text-2xl font-black text-zinc-700 w-6">{{ index + 1 }}</span>
                  <div class="w-10 h-10 rounded-none bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
                    <img
                      v-if="artist.avatarUrl"
                      :src="artist.avatarUrl"
                      :alt="artist.name"
                      class="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.20] group-hover:grayscale-0 group-hover:sepia-0 group-hover:contrast-100 group-hover:brightness-100 transition-all duration-300"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-zinc-500 font-black">
                      {{ artist.name.charAt(0) }}
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <NuxtLink
                      :to="`/${artist.slug}`"
                      class="text-white hover:text-fuchsia-500 font-bold uppercase text-sm tracking-tight truncate block transition-colors"
                    >
                      {{ artist.name }}
                    </NuxtLink>
                    <p class="text-fuchsia-400 text-xs font-mono">{{ artist.tipCount }} tips</p>
                  </div>
                </div>
              </div>
              <p v-else class="text-zinc-500 text-sm font-mono italic">No tips yet this week.</p>
            </aside>

            <!-- First Payout Club -->
            <aside class="bg-zinc-950 rounded-none border-2 border-fuchsia-900/50 p-5 shadow-[4px_4px_0px_0px_rgba(192,38,211,0.5)]">
              <div class="flex items-center gap-2 mb-2 border-b-2 border-fuchsia-900/50 pb-3">
                <h3 class="font-black text-fuchsia-500 uppercase tracking-tighter">FIRST PAYOUT CLUB</h3>
              </div>
              <p class="text-zinc-400 text-xs font-mono mb-4">Just got their first $ from Fairtune:</p>

              <div v-if="firstPayoutArtists.length > 0" class="flex flex-wrap gap-2">
                <NuxtLink
                  v-for="artist in firstPayoutArtists.slice(0, 6)"
                  :key="artist.id"
                  :to="`/${artist.slug}`"
                  class="px-3 py-1 border-2 border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-black text-xs font-bold uppercase rounded-none transition-colors"
                >
                  {{ artist.name }}
                </NuxtLink>
              </div>
              <p v-else class="text-zinc-500 text-sm font-mono italic">New artists joining soon...</p>
            </aside>

            <!-- Subscribe CTA -->
            <aside class="bg-zinc-950 rounded-none border-2 border-zinc-800 p-5 text-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)]">
              <p class="text-white font-black uppercase tracking-tighter mb-2">Like what you see?</p>
              <p class="text-zinc-400 text-sm font-mono mb-4">
                CHF 9.99/mo<br />
                85% goes to artists<br />
                (not shareholders)
              </p>
              <NuxtLink
                to="/pricing"
                class="inline-block px-6 py-2 bg-fuchsia-600 text-white font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
              >
                Subscribe →
              </NuxtLink>
            </aside>
          </div>
        </div>

        <!-- Scene Reports -->
        <section class="mb-12">
          <div class="flex items-center gap-3 mb-6 border-b-2 border-zinc-800 pb-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tighter">SCENE REPORTS</h2>
            <span class="text-zinc-500 text-xs font-mono">/// What's happening in the underground</span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <article
              v-for="scene in sceneReports"
              :key="scene.slug"
              class="bg-zinc-950 rounded-none border-2 border-zinc-800 p-4 hover:border-fuchsia-500/50 cursor-pointer transition-colors shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,92,246,0.5)]"
              @click="navigateTo(`/genres/${scene.slug}`)"
            >
              <h4 class="font-black text-white mb-1 uppercase tracking-tight">{{ scene.genre }}</h4>
              <p class="text-zinc-500 text-xs font-mono mb-2 line-clamp-2">{{ scene.description }}</p>
              <p class="text-fuchsia-500 text-xs font-bold uppercase">
                {{ scene.newReleases }} new this week
              </p>
            </article>
          </div>
        </section>

        <!-- The Overlooked -->
        <section class="mb-12">
          <div class="flex items-center gap-3 mb-6 border-b-2 border-zinc-800 pb-4">
            <h2 class="text-2xl font-black text-white uppercase tracking-tighter">THE OVERLOOKED</h2>
            <span class="text-zinc-500 text-xs font-mono">/// Hidden gems deserving more ears</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article
              v-for="album in overlookedAlbums"
              :key="album.id"
              class="flex gap-4 items-start bg-zinc-950 rounded-none p-4 border-2 border-zinc-800 hover:border-fuchsia-500/50 transition-colors shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] group"
            >
              <NuxtLink :to="`/${album.bandSlug}/${album.slug}`" class="shrink-0">
                <div class="w-20 h-20 rounded-none overflow-hidden bg-zinc-800 border border-zinc-700">
                  <img
                    v-if="album.coverUrl"
                    :src="album.coverUrl"
                    :alt="album.title"
                    class="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.20] group-hover:grayscale-0 group-hover:sepia-0 group-hover:contrast-100 group-hover:brightness-100 transition-all duration-300"
                  />
                </div>
              </NuxtLink>
              <div class="min-w-0 pt-1">
                <NuxtLink :to="`/${album.bandSlug}/${album.slug}`">
                  <p class="font-black text-white uppercase tracking-tight truncate hover:text-fuchsia-500 transition-colors">
                    {{ album.title }}
                  </p>
                </NuxtLink>
                <NuxtLink :to="`/${album.bandSlug}`" class="hover:text-zinc-300 transition-colors">
                  <p class="text-zinc-500 text-sm font-mono">{{ album.bandName }}</p>
                </NuxtLink>
                <p v-if="album.blurb" class="text-zinc-500 text-xs font-mono mt-1 line-clamp-2 italic">
                  "{{ album.blurb }}"
                </p>
                <p v-else class="text-zinc-600 text-xs font-mono mt-1">
                  Give it a spin
                </p>
              </div>
            </article>
          </div>
        </section>

        <!-- Footer -->
        <footer class="border-t-2 border-zinc-800 pt-8 text-center">
          <p class="text-zinc-500 text-sm font-mono mb-6">
            THIS ZINE IS UPDATED WEEKLY.<br />
            NO TRACKING. NO COOKIES. NO CORPORATE BS.<br />
            JUST MUSIC THAT PAYS ARTISTS.
          </p>

          <div class="flex justify-center gap-4 mb-6">
            <NuxtLink
              to="/discover"
              class="px-5 py-2 border-2 border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-black text-sm font-bold uppercase tracking-tight rounded-none transition-colors"
            >
              Discover More
            </NuxtLink>
            <NuxtLink
              to="/new-releases"
              class="px-5 py-2 bg-fuchsia-600 text-white text-sm font-bold uppercase tracking-tight rounded-none shadow-[2px_2px_0px_0px_rgba(139,92,246,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] transition-all"
            >
              New Releases
            </NuxtLink>
          </div>

          <p class="text-zinc-600 text-xs font-mono uppercase">
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
          blurb: a.description,
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
          blurb: a.description,
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

    // Featured story
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

definePageMeta({
  layout: 'brutalist'
})

onMounted(fetchZineData)

useHead({
  title: 'THE FAIRZINE | Fairtune',
  meta: [
    { name: 'description', content: 'THE FAIRZINE - No algorithm, just music. Scene reports, staff picks, and where your money goes.' },
  ],
})
</script>
