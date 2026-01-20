// Band management composable for Fairstream

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// Module-level cache for bands (persists across navigation)
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const bandBySlugCache = new Map<string, CacheEntry<Band>>()
const bandByIdCache = new Map<string, CacheEntry<Band>>()
// Cache for resolved image URLs (avatar, banner) - keyed by storage key
const imageUrlCache = new Map<string, CacheEntry<string>>()

const isCacheValid = <T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> => {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL_MS
}

export interface Band {
  id: string
  owner_id: string
  name: string
  slug: string
  tagline: string | null
  bio: string | null
  location: string | null
  website: string | null
  avatar_url: string | null
  avatar_key: string | null
  banner_url: string | null
  banner_key: string | null
  theme_color: string
  genres: string[]
  is_verified: boolean
  status: 'pending' | 'active' | 'suspended' | 'removed'
  total_streams: number
  total_earnings_cents: number
  follower_count: number
  created_at: string
  updated_at: string
  // Social links
  instagram: string | null
  twitter: string | null
  facebook: string | null
  youtube: string | null
  spotify: string | null
  soundcloud: string | null
  bandcamp: string | null
  tiktok: string | null
}

export interface CreateBandInput {
  name: string
  slug: string
  tagline?: string
  bio?: string
  location?: string
  genres?: string[]
  // Social links
  website?: string
  instagram?: string
  twitter?: string
  facebook?: string
  youtube?: string
  spotify?: string
  soundcloud?: string
  bandcamp?: string
  tiktok?: string
}

export interface UpdateBandInput {
  name?: string
  tagline?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string
  avatar_key?: string
  banner_url?: string
  banner_key?: string
  theme_color?: string
  genres?: string[]
  // Social links
  instagram?: string
  twitter?: string
  facebook?: string
  youtube?: string
  spotify?: string
  soundcloud?: string
  bandcamp?: string
  tiktok?: string
}

export const useBand = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Get all bands owned by the current user
  const getUserBands = async (): Promise<Band[]> => {
    if (!user.value) return []

    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('owner_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
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

  // Get a band by slug (public) - includes resolved image URLs
  const getBandBySlug = async (slug: string, forceRefresh = false): Promise<Band | null> => {
    // Check cache first
    if (!forceRefresh) {
      const cached = bandBySlugCache.get(slug)
      if (isCacheValid(cached)) {
        return cached.data
      }
    }

    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    // Resolve image URLs before caching
    if (data) {
      if (data.avatar_key) {
        data.avatar_url = await resolveImageUrl(data.avatar_key)
      }
      if (data.banner_key) {
        data.banner_url = await resolveImageUrl(data.banner_key)
      }

      const entry = { data, timestamp: Date.now() }
      bandBySlugCache.set(slug, entry)
      bandByIdCache.set(data.id, entry)
    }

    return data
  }

  // Get a band by ID - includes resolved image URLs
  const getBandById = async (id: string, forceRefresh = false): Promise<Band | null> => {
    // Check cache first
    if (!forceRefresh) {
      const cached = bandByIdCache.get(id)
      if (isCacheValid(cached)) {
        return cached.data
      }
    }

    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Resolve image URLs before caching
    if (data) {
      if (data.avatar_key) {
        data.avatar_url = await resolveImageUrl(data.avatar_key)
      }
      if (data.banner_key) {
        data.banner_url = await resolveImageUrl(data.banner_key)
      }

      const entry = { data, timestamp: Date.now() }
      bandByIdCache.set(id, entry)
      bandBySlugCache.set(data.slug, entry)
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

  // Create a new band
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
        // Social links
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
    return data
  }

  // Update a band
  const updateBand = async (bandId: string, input: UpdateBandInput): Promise<Band> => {
    if (!user.value) throw new Error('Must be logged in to update a band')

    const { data, error } = await supabase
      .from('bands')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bandId)
      .eq('owner_id', user.value.id) // Ensure user owns the band
      .select()
      .single()

    if (error) throw error

    // Update cache with new data
    if (data) {
      const entry = { data, timestamp: Date.now() }
      bandByIdCache.set(bandId, entry)
      bandBySlugCache.set(data.slug, entry)
    }

    return data
  }

  // Delete a band
  const deleteBand = async (bandId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete a band')

    // Get the band first to know its slug for cache invalidation
    const band = bandByIdCache.get(bandId)?.data

    const { error } = await supabase
      .from('bands')
      .delete()
      .eq('id', bandId)
      .eq('owner_id', user.value.id)

    if (error) throw error

    // Invalidate cache
    bandByIdCache.delete(bandId)
    if (band) {
      bandBySlugCache.delete(band.slug)
    }
  }

  // Invalidate band cache (useful after external updates)
  const invalidateBandCache = (slugOrId?: string) => {
    if (slugOrId) {
      // Try to find and remove from both caches
      const bySlug = bandBySlugCache.get(slugOrId)
      const byId = bandByIdCache.get(slugOrId)

      if (bySlug) {
        bandBySlugCache.delete(slugOrId)
        bandByIdCache.delete(bySlug.data.id)
      }
      if (byId) {
        bandByIdCache.delete(slugOrId)
        bandBySlugCache.delete(byId.data.slug)
      }
    } else {
      // Clear all cache
      bandBySlugCache.clear()
      bandByIdCache.clear()
    }
  }

  // Get featured/popular bands (for discover page)
  const getFeaturedBands = async (limit = 12): Promise<Band[]> => {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .order('total_streams', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Get cached image URL or fetch new one
  const getCachedImageUrl = async (key: string | null | undefined): Promise<string | null> => {
    if (!key) return null

    // Check cache first
    const cached = imageUrlCache.get(key)
    if (isCacheValid(cached)) {
      return cached.data
    }

    // Fetch new URL - need to import getStreamUrl from useAlbum
    try {
      const encodedKey = btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
      const url = response.url

      // Cache the URL
      imageUrlCache.set(key, { data: url, timestamp: Date.now() })
      return url
    } catch (e) {
      console.error('Failed to get image URL:', e)
      return null
    }
  }

  return {
    getUserBands,
    getBandBySlug,
    getBandById,
    isSlugAvailable,
    generateSlug,
    createBand,
    updateBand,
    deleteBand,
    getFeaturedBands,
    invalidateBandCache,
    getCachedImageUrl,
  }
}
