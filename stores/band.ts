// Band store using plain Pinia
import type { Database, Band as DBBand, BandInsert, BandUpdate } from '~/types/database'

// Re-export Band type from database types for backwards compatibility
export type Band = DBBand

// Use generated types for insert/update, keeping backwards-compatible aliases
export type CreateBandInput = Omit<BandInsert, 'owner_id'>
export type UpdateBandInput = BandUpdate

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000

// Track in-flight revalidations to prevent duplicate requests
const revalidatingBandBySlug = new Set<string>()
const revalidatingBandById = new Set<string>()

// Client-side only cache for resolved image URLs
let imageUrlCache: Map<string, { url: string; timestamp: number }> | null = null

const getImageUrlCache = () => {
  if (!import.meta.client) return null
  if (!imageUrlCache) imageUrlCache = new Map()
  return imageUrlCache
}

export const useBandStore = defineStore('band', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const toast = useToast()

  // Computed user ID
  const userId = computed(() => user.value?.id || null)

  // State
  const userBands = ref<Band[]>([])
  const userBandsLoading = ref(false)

  // Reactive state for SWR (current band being viewed)
  const currentBand = ref<Band | null>(null)
  const currentBandKey = ref<string | null>(null)

  // Band cache (by slug and id)
  const bandCacheBySlug = new Map<string, { data: Band; fetchedAt: number }>()
  const bandCacheById = new Map<string, { data: Band; fetchedAt: number }>()

  // Cache timestamp for user bands
  let userBandsFetchedAt = 0

  // Check if cache is stale
  const isUserBandsStale = () => Date.now() - userBandsFetchedAt > CACHE_TTL
  const isBandCacheStale = (fetchedAt: number) => Date.now() - fetchedAt > CACHE_TTL

  // ===== SWR REVALIDATION FUNCTIONS =====

  // Background revalidation for band by slug
  const revalidateBandBySlug = async (slug: string) => {
    if (revalidatingBandBySlug.has(slug)) return
    revalidatingBandBySlug.add(slug)
    try {
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') console.error('Failed to revalidate band:', error)
        return
      }

      if (data) {
        await resolveBandImages(data)
        const now = Date.now()
        bandCacheBySlug.set(slug, { data, fetchedAt: now })
        bandCacheById.set(data.id, { data, fetchedAt: now })

        // Update reactive state if this is the current band
        if (currentBandKey.value === `slug:${slug}`) {
          currentBand.value = data
        }
      }
    } catch (e) {
      console.error('Failed to revalidate band by slug:', e)
    } finally {
      revalidatingBandBySlug.delete(slug)
    }
  }

  // Background revalidation for band by ID
  const revalidateBandById = async (id: string) => {
    if (revalidatingBandById.has(id)) return
    revalidatingBandById.add(id)
    try {
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') console.error('Failed to revalidate band:', error)
        return
      }

      if (data) {
        await resolveBandImages(data)
        const now = Date.now()
        bandCacheById.set(id, { data, fetchedAt: now })
        bandCacheBySlug.set(data.slug, { data, fetchedAt: now })

        // Update reactive state if this is the current band
        if (currentBandKey.value === `id:${id}`) {
          currentBand.value = data
        }
      }
    } catch (e) {
      console.error('Failed to revalidate band by id:', e)
    } finally {
      revalidatingBandById.delete(id)
    }
  }

  // Helper to resolve image URL
  const resolveImageUrl = async (key: string | null | undefined): Promise<string | null> => {
    if (!key) return null
    try {
      const encodedKey = btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
      return response.url
    } catch (e) {
      console.error('Failed to get image URL:', e)
      return null
    }
  }

  // Helper to resolve band image URLs
  const resolveBandImages = async (band: Band): Promise<Band> => {
    if (band.avatar_key) {
      band.avatar_url = await resolveImageUrl(band.avatar_key)
    }
    if (band.banner_key) {
      band.banner_url = await resolveImageUrl(band.banner_key)
    }
    return band
  }

  // Function to get user bands
  const getUserBands = async (forceRefresh = false): Promise<Band[]> => {
    if (import.meta.server) return []
    if (!userId.value) return []
    if (!forceRefresh && !isUserBandsStale() && userBands.value.length > 0) {
      return userBands.value
    }

    userBandsLoading.value = true
    try {
      const { data, error } = await supabase
        .from('bands')
        .select('*')
        .eq('owner_id', userId.value)
        .order('created_at', { ascending: false })

      if (error) throw error

      userBands.value = (data || []) as Band[]
      userBandsFetchedAt = Date.now()
      return userBands.value
    } catch (e) {
      console.error('Failed to fetch user bands:', e)
      return userBands.value
    } finally {
      userBandsLoading.value = false
    }
  }

  // SWR: Get band by slug - returns cached data immediately, revalidates in background if stale
  const getBandBySlug = async (slug: string, forceRefresh = false): Promise<Band | null> => {
    const cached = bandCacheBySlug.get(slug)

    // Update current key for reactive updates
    currentBandKey.value = `slug:${slug}`

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Update reactive state
      currentBand.value = cached.data

      // Trigger background revalidation if stale
      if (isBandCacheStale(cached.fetchedAt)) {
        revalidateBandBySlug(slug)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    if (data) {
      await resolveBandImages(data)
      // Store in cache
      const now = Date.now()
      bandCacheBySlug.set(slug, { data, fetchedAt: now })
      bandCacheById.set(data.id, { data, fetchedAt: now })
      currentBand.value = data
    }

    return data
  }

  // SWR: Get band by ID - returns cached data immediately, revalidates in background if stale
  const getBandById = async (id: string, forceRefresh = false): Promise<Band | null> => {
    const cached = bandCacheById.get(id)

    // Update current key for reactive updates
    currentBandKey.value = `id:${id}`

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Update reactive state
      currentBand.value = cached.data

      // Trigger background revalidation if stale
      if (isBandCacheStale(cached.fetchedAt)) {
        revalidateBandById(id)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (data) {
      await resolveBandImages(data)
      // Store in cache
      const now = Date.now()
      bandCacheById.set(id, { data, fetchedAt: now })
      bandCacheBySlug.set(data.slug, { data, fetchedAt: now })
      currentBand.value = data
    }

    return data
  }

  // Check if a slug is available
  const isSlugAvailable = async (slug: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('bands')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return data === null
  }

  // Generate a slug from a name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Create band
  const createBand = async (input: CreateBandInput): Promise<Band> => {
    if (!user.value) throw new Error('Must be logged in to create a band')

    const { data, error } = await supabase
      .from('bands')
      .insert({
        owner_id: user.value.id,
        name: input.name,
        slug: input.slug,
        tagline: input.tagline || null,
        bio: input.bio || null,
        location: input.location || null,
        genres: input.genres || [],
        website: input.website || null,
        instagram: input.instagram || null,
        twitter: input.twitter || null,
        facebook: input.facebook || null,
        youtube: input.youtube || null,
        spotify: input.spotify || null,
        soundcloud: input.soundcloud || null,
        bandcamp: input.bandcamp || null,
        tiktok: input.tiktok || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('This URL is already taken. Please choose a different one.')
      }
      throw error
    }

    // Invalidate user bands cache
    userBandsFetchedAt = 0

    return data as Band
  }

  // Update band
  const updateBand = async (bandId: string, input: UpdateBandInput): Promise<Band> => {
    if (!user.value) throw new Error('Must be logged in to update a band')

    const { data, error } = await supabase
      .from('bands')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bandId)
      .eq('owner_id', user.value.id)
      .select()
      .single()

    if (error) throw error

    const band = data as Band

    // Update cache with new data
    const now = Date.now()
    bandCacheBySlug.set(band.slug, { data: band, fetchedAt: now })
    bandCacheById.set(band.id, { data: band, fetchedAt: now })

    // Invalidate user bands cache
    userBandsFetchedAt = 0

    return band
  }

  // Delete band
  const deleteBand = async (bandId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete a band')

    // Get the band first to know its slug for cache invalidation
    const cached = bandCacheById.get(bandId)
    const slug = cached?.data.slug

    const { error } = await supabase
      .from('bands')
      .delete()
      .eq('id', bandId)
      .eq('owner_id', user.value.id)

    if (error) throw error

    // Remove from cache
    bandCacheById.delete(bandId)
    if (slug) {
      bandCacheBySlug.delete(slug)
    }

    // Invalidate user bands cache
    userBandsFetchedAt = 0
  }

  // Get featured/popular bands (for discover page)
  const getFeaturedBands = async (limit = 12): Promise<Band[]> => {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('status', 'active')
      .order('total_streams', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []) as Band[]
  }

  // Invalidate band cache
  const invalidateBandCache = (slugOrId?: string) => {
    if (slugOrId) {
      // Try to invalidate both slug and id caches
      bandCacheBySlug.delete(slugOrId)
      bandCacheById.delete(slugOrId)
    } else {
      // Clear all band-related caches
      bandCacheBySlug.clear()
      bandCacheById.clear()
      userBandsFetchedAt = 0
    }
  }

  // Get cached image URL or fetch new one
  const getCachedImageUrl = async (key: string | null | undefined): Promise<string | null> => {
    if (!key) return null

    const imgCache = getImageUrlCache()

    // Check cache first (client-side only)
    if (imgCache) {
      const cached = imgCache.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.url
      }
    }

    try {
      const encodedKey = btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
      const url = response.url

      // Cache the URL (client-side only)
      if (imgCache) {
        imgCache.set(key, { url, timestamp: Date.now() })
      }
      return url
    } catch (e) {
      console.error('Failed to get image URL:', e)
      return null
    }
  }

  // Clear state when user logs out
  watch(userId, (newUserId) => {
    if (!newUserId) {
      userBands.value = []
      userBandsFetchedAt = 0
      currentBand.value = null
      currentBandKey.value = null
    }
  })

  return {
    // State
    userBands,
    userBandsLoading,
    currentBand,

    // Query functions
    getUserBands,
    getBandBySlug,
    getBandById,
    getFeaturedBands,

    // Utility functions
    isSlugAvailable,
    generateSlug,
    getCachedImageUrl,
    invalidateBandCache,

    // Mutations
    createBand,
    updateBand,
    deleteBand,
  }
})
