// Pinia store for album and track management
// Uses SWR pattern for reads (stale-while-revalidate)
import { defineStore } from 'pinia'
import type {
  Database,
  Album as DBAlbum,
  Track as DBTrack,
  TrackCredit as DBTrackCredit,
  AlbumInsert,
  AlbumUpdate,
  TrackInsert,
  TrackUpdate,
} from '~/types/database'

// Extended types with joined data for runtime use
export type Track = DBTrack & {
  credits?: TrackCredit[]
}

export type TrackCredit = DBTrackCredit

export type Album = DBAlbum & {
  tracks?: Track[]
  band?: {
    id: string
    name: string
    slug: string
  }
}

// Input types
export type CreateAlbumInput = Pick<AlbumInsert, 'band_id' | 'title' | 'description' | 'release_type' | 'release_date' | 'upc' | 'label_name' | 'purchasable' | 'price_cents' | 'pay_what_you_want' | 'minimum_price_cents'> & {
  slug?: string
}

export type UpdateAlbumInput = AlbumUpdate

export type CreateTrackInput = Pick<TrackInsert, 'album_id' | 'band_id' | 'title' | 'track_number' | 'duration_seconds' | 'is_explicit' | 'lyrics' | 'isrc' | 'iswc' | 'is_cover' | 'spotify_track_id' | 'musicbrainz_work_id' | 'isrc_platform_assigned'>

export type UpdateTrackInput = TrackUpdate

export interface CreateTrackCreditInput {
  track_id: string
  role: 'composer' | 'lyricist' | 'performer' | 'producer' | 'arranger'
  name: string
  ipi_number?: string
}

export interface UpdateTrackCreditInput {
  role?: 'composer' | 'lyricist' | 'performer' | 'producer' | 'arranger'
  name?: string
  ipi_number?: string
}

// Cache TTL: 1 hour for album data
const CACHE_TTL = 60 * 60 * 1000

// Module-level cache for cover URLs (persists across store instances)
interface CacheEntry<T> {
  data: T
  timestamp: number
}
const coverUrlCache = new Map<string, CacheEntry<string>>()

// Album caches
const albumBySlugCache = new Map<string, CacheEntry<Album>>()
const albumByIdCache = new Map<string, CacheEntry<Album>>()
const bandAlbumsCache = new Map<string, CacheEntry<Album[]>>()

// Track in-flight revalidations to prevent duplicate requests
const revalidatingAlbumBySlug = new Set<string>()
const revalidatingAlbumById = new Set<string>()
const revalidatingBandAlbums = new Set<string>()

const isCacheValid = <T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> => {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL
}

const isCacheStale = <T>(entry: CacheEntry<T> | undefined): boolean => {
  if (!entry) return true
  return Date.now() - entry.timestamp > CACHE_TTL
}

export const useAlbumStore = defineStore('album', () => {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()

  // Reactive state for SWR updates (components can watch these)
  const currentAlbum = ref<Album | null>(null)
  const currentAlbumKey = ref<string | null>(null)
  const currentBandAlbums = ref<Album[]>([])
  const currentBandAlbumsKey = ref<string | null>(null)

  // ===== HELPER METHODS =====

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Get streaming URL
  const getStreamUrl = async (key: string): Promise<string> => {
    const encodedKey = btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
    return response.url
  }

  // Get the best audio key for playback
  const getPlaybackAudioKey = (track: Track): string | null => {
    if (track.streaming_audio_key && track.transcoding_status === 'complete') {
      return track.streaming_audio_key
    }
    return track.original_audio_key || track.audio_key
  }

  // Get cached cover URL or fetch new one
  const getCachedCoverUrl = async (key: string | null | undefined): Promise<string | null> => {
    if (!key) return null

    const cached = coverUrlCache.get(key)
    if (isCacheValid(cached)) {
      return cached.data
    }

    try {
      const url = await getStreamUrl(key)
      coverUrlCache.set(key, { data: url, timestamp: Date.now() })
      return url
    } catch (e) {
      console.error('Failed to get cover URL:', e)
      return null
    }
  }

  // Get presigned upload URL
  const getUploadUrl = async (
    type: 'audio' | 'cover',
    bandId: string,
    albumId: string,
    filename: string,
    contentType: string,
    trackId?: string
  ): Promise<{ uploadUrl: string; key: string }> => {
    const response = await $fetch('/api/upload/presign', {
      method: 'POST',
      body: { type, bandId, albumId, trackId, filename, contentType },
    })
    return response
  }

  // Invalidate album caches
  const invalidateAlbumCache = (bandId?: string) => {
    if (bandId) {
      // Invalidate band albums cache
      for (const key of bandAlbumsCache.keys()) {
        if (key.startsWith(bandId)) {
          bandAlbumsCache.delete(key)
        }
      }
    } else {
      // Clear all caches
      albumBySlugCache.clear()
      albumByIdCache.clear()
      bandAlbumsCache.clear()
    }
  }

  // ===== QUERY FUNCTIONS =====

  const fetchAlbumBySlug = async (bandSlug: string, albumSlug: string, filterModeration: boolean): Promise<Album | null> => {
    // First get the band
    const { data: band } = await supabase
      .from('bands')
      .select('id')
      .eq('slug', bandSlug)
      .single()

    if (!band) return null

    const { data, error } = await supabase
      .from('albums')
      .select('*, tracks(*), band:bands(id, name, slug)')
      .eq('band_id', band.id)
      .eq('slug', albumSlug)
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (data?.tracks) {
      if (filterModeration) {
        const { filterTracks, loadModerationSetting } = useModerationFilter()
        await loadModerationSetting()
        data.tracks = filterTracks(data.tracks)
        if (data.tracks.length === 0) return null
      }
      data.tracks.sort((a: any, b: any) => a.track_number - b.track_number)
    }

    return data as Album
  }

  const fetchAlbumById = async (albumId: string, filterModeration: boolean): Promise<Album | null> => {
    const { data, error } = await supabase
      .from('albums')
      .select('*, tracks(*), band:bands(id, name, slug)')
      .eq('id', albumId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (data?.tracks) {
      if (filterModeration) {
        const { filterTracks, loadModerationSetting } = useModerationFilter()
        await loadModerationSetting()
        data.tracks = filterTracks(data.tracks)
        if (data.tracks.length === 0) return null
      }
      data.tracks.sort((a: any, b: any) => a.track_number - b.track_number)
    }

    return data as Album
  }

  const fetchBandAlbums = async (bandId: string, includeUnpublished: boolean, filterModeration: boolean): Promise<Album[]> => {
    let query = supabase
      .from('albums')
      .select('*, tracks(*)')
      .eq('band_id', bandId)
      .order('release_date', { ascending: false, nullsFirst: false })

    if (!includeUnpublished) {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) throw error

    let result: Album[] = (data || []) as Album[]

    if (filterModeration && data) {
      const { filterTracks, filterAlbums, loadModerationSetting } = useModerationFilter()
      await loadModerationSetting()
      for (const album of data) {
        if (album.tracks) {
          album.tracks = filterTracks(album.tracks)
        }
      }
      result = filterAlbums(data) as Album[]
    }

    return result
  }

  // ===== SWR REVALIDATION FUNCTIONS =====

  // Background revalidation for album by slug
  const revalidateAlbumBySlug = async (bandSlug: string, albumSlug: string, filterModeration: boolean, cacheKey: string) => {
    if (revalidatingAlbumBySlug.has(cacheKey)) return
    revalidatingAlbumBySlug.add(cacheKey)

    try {
      const data = await fetchAlbumBySlug(bandSlug, albumSlug, filterModeration)
      if (data) {
        albumBySlugCache.set(cacheKey, { data, timestamp: Date.now() })
        albumByIdCache.set(`${data.id}:${filterModeration}`, { data, timestamp: Date.now() })
        // Update reactive state if this is the current album
        if (currentAlbumKey.value === cacheKey) {
          currentAlbum.value = data
        }
      }
    } catch (e) {
      console.error('Failed to revalidate album by slug:', e)
    } finally {
      revalidatingAlbumBySlug.delete(cacheKey)
    }
  }

  // Background revalidation for album by ID
  const revalidateAlbumById = async (albumId: string, filterModeration: boolean, cacheKey: string) => {
    if (revalidatingAlbumById.has(cacheKey)) return
    revalidatingAlbumById.add(cacheKey)

    try {
      const data = await fetchAlbumById(albumId, filterModeration)
      if (data) {
        albumByIdCache.set(cacheKey, { data, timestamp: Date.now() })
        // Update reactive state if this is the current album
        if (currentAlbumKey.value === cacheKey) {
          currentAlbum.value = data
        }
      }
    } catch (e) {
      console.error('Failed to revalidate album by ID:', e)
    } finally {
      revalidatingAlbumById.delete(cacheKey)
    }
  }

  // Background revalidation for band albums
  const revalidateBandAlbums = async (bandId: string, includeUnpublished: boolean, filterModeration: boolean, cacheKey: string) => {
    if (revalidatingBandAlbums.has(cacheKey)) return
    revalidatingBandAlbums.add(cacheKey)

    try {
      const data = await fetchBandAlbums(bandId, includeUnpublished, filterModeration)
      bandAlbumsCache.set(cacheKey, { data, timestamp: Date.now() })
      // Update reactive state if this is the current band albums
      if (currentBandAlbumsKey.value === cacheKey) {
        currentBandAlbums.value = data
      }
    } catch (e) {
      console.error('Failed to revalidate band albums:', e)
    } finally {
      revalidatingBandAlbums.delete(cacheKey)
    }
  }

  // ===== PUBLIC SWR QUERY METHODS =====

  // SWR: Get album by slug - returns cached data immediately, revalidates in background if stale
  const getAlbumBySlug = async (bandSlug: string, albumSlug: string, filterModeration = true, forceRefresh = false): Promise<Album | null> => {
    const cacheKey = `${bandSlug}:${albumSlug}:${filterModeration}`
    const cached = albumBySlugCache.get(cacheKey)

    // Update current key for reactive updates
    currentAlbumKey.value = cacheKey

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Update reactive state
      currentAlbum.value = cached.data

      // Trigger background revalidation if stale
      if (isCacheStale(cached)) {
        revalidateAlbumBySlug(bandSlug, albumSlug, filterModeration, cacheKey)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    const data = await fetchAlbumBySlug(bandSlug, albumSlug, filterModeration)
    if (data) {
      albumBySlugCache.set(cacheKey, { data, timestamp: Date.now() })
      albumByIdCache.set(`${data.id}:${filterModeration}`, { data, timestamp: Date.now() })
      currentAlbum.value = data
    }
    return data
  }

  // SWR: Get album by ID - returns cached data immediately, revalidates in background if stale
  const getAlbumById = async (albumId: string, filterModeration = true, forceRefresh = false): Promise<Album | null> => {
    const cacheKey = `${albumId}:${filterModeration}`
    const cached = albumByIdCache.get(cacheKey)

    // Update current key for reactive updates
    currentAlbumKey.value = cacheKey

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Update reactive state
      currentAlbum.value = cached.data

      // Trigger background revalidation if stale
      if (isCacheStale(cached)) {
        revalidateAlbumById(albumId, filterModeration, cacheKey)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    const data = await fetchAlbumById(albumId, filterModeration)
    if (data) {
      albumByIdCache.set(cacheKey, { data, timestamp: Date.now() })
      currentAlbum.value = data
    }
    return data
  }

  // SWR: Get albums for a band - returns cached data immediately, revalidates in background if stale
  const getBandAlbums = async (bandId: string, includeUnpublished = false, filterModeration = true, forceRefresh = false): Promise<Album[]> => {
    const cacheKey = `${bandId}:${includeUnpublished}:${filterModeration}`
    const cached = bandAlbumsCache.get(cacheKey)

    // Update current key for reactive updates
    currentBandAlbumsKey.value = cacheKey

    // If we have cached data (even if stale), return it immediately
    if (cached && !forceRefresh) {
      // Update reactive state
      currentBandAlbums.value = cached.data

      // Trigger background revalidation if stale
      if (isCacheStale(cached)) {
        revalidateBandAlbums(bandId, includeUnpublished, filterModeration, cacheKey)
      }
      return cached.data
    }

    // No cached data or force refresh - fetch and wait
    const data = await fetchBandAlbums(bandId, includeUnpublished, filterModeration)
    bandAlbumsCache.set(cacheKey, { data, timestamp: Date.now() })
    currentBandAlbums.value = data
    return data
  }

  // Get album by slug for owner (no published filter, no moderation filter) - no SWR needed
  const getAlbumBySlugForOwner = async (bandSlug: string, albumSlug: string): Promise<Album | null> => {
    const { data: band } = await supabase
      .from('bands')
      .select('id')
      .eq('slug', bandSlug)
      .single()

    if (!band) return null

    const { data, error } = await supabase
      .from('albums')
      .select('*, tracks(*), band:bands(id, name, slug)')
      .eq('band_id', band.id)
      .eq('slug', albumSlug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (data?.tracks) {
      data.tracks.sort((a: any, b: any) => a.track_number - b.track_number)
    }

    return data as Album
  }

  // ===== MUTATIONS =====

  // Create album
  const createAlbum = async (input: CreateAlbumInput): Promise<Album> => {
    if (!user.value) throw new Error('Must be logged in to create an album')

    let slug = input.slug || generateSlug(input.title)

    const { data: existing } = await supabase
      .from('albums')
      .select('id')
      .eq('band_id', input.band_id)
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const { data, error } = await supabase
      .from('albums')
      .insert({
        band_id: input.band_id,
        title: input.title,
        slug,
        description: input.description || null,
        release_type: input.release_type,
        release_date: input.release_date || null,
        upc: input.upc || null,
        label_name: input.label_name || null,
        purchasable: input.purchasable || false,
        price_cents: input.price_cents || null,
        pay_what_you_want: input.pay_what_you_want || false,
        minimum_price_cents: input.minimum_price_cents || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('An album with this URL already exists. Please try again.')
      }
      throw error
    }

    invalidateAlbumCache(input.band_id)
    return data
  }

  // Update album
  const updateAlbum = async (albumId: string, input: UpdateAlbumInput): Promise<Album> => {
    if (!user.value) throw new Error('Must be logged in to update an album')

    const { data, error } = await supabase
      .from('albums')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', albumId)
      .select()
      .single()

    if (error) throw error

    if (data) {
      invalidateAlbumCache(data.band_id)
    }

    return data
  }

  // Delete album
  const deleteAlbum = async (albumId: string, bandId?: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete an album')

    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId)

    if (error) throw error

    invalidateAlbumCache(bandId)
  }

  // Create track
  const createTrack = async (input: CreateTrackInput): Promise<Track> => {
    if (!user.value) throw new Error('Must be logged in to create a track')

    const { data, error } = await supabase
      .from('tracks')
      .insert({
        album_id: input.album_id,
        band_id: input.band_id,
        title: input.title,
        track_number: input.track_number,
        duration_seconds: input.duration_seconds || 0,
        is_explicit: input.is_explicit || false,
        lyrics: input.lyrics || null,
        isrc: input.isrc || null,
        iswc: input.iswc || null,
        is_cover: input.is_cover || false,
        spotify_track_id: input.spotify_track_id || null,
        musicbrainz_work_id: input.musicbrainz_work_id || null,
      })
      .select()
      .single()

    if (error) throw error
    return data as Track
  }

  // Update track
  const updateTrack = async (trackId: string, input: UpdateTrackInput): Promise<Track> => {
    if (!user.value) throw new Error('Must be logged in to update a track')

    const { data, error } = await supabase
      .from('tracks')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', trackId)
      .select()
      .single()

    if (error) throw error
    return data as Track
  }

  // Delete track
  const deleteTrack = async (trackId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete a track')

    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId)

    if (error) throw error
  }

  // Reorder tracks
  const reorderTracks = async (albumId: string, trackIds: string[]): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to reorder tracks')

    const updates = trackIds.map((trackId, index) => ({
      id: trackId,
      track_number: index + 1,
      updated_at: new Date().toISOString(),
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('tracks')
        .update({ track_number: update.track_number, updated_at: update.updated_at })
        .eq('id', update.id)

      if (error) throw error
    }
  }

  // ===== TRACK CREDITS =====

  const getTrackCredits = async (trackId: string): Promise<TrackCredit[]> => {
    const { data, error } = await supabase
      .from('track_credits')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  const getCreditsForTracks = async (trackIds: string[]): Promise<Record<string, TrackCredit[]>> => {
    if (trackIds.length === 0) return {}

    const { data, error } = await supabase
      .from('track_credits')
      .select('*')
      .in('track_id', trackIds)

    if (error) throw error

    const grouped: Record<string, TrackCredit[]> = {}
    for (const credit of data || []) {
      if (!grouped[credit.track_id]) {
        grouped[credit.track_id] = []
      }
      grouped[credit.track_id].push(credit)
    }

    return grouped
  }

  const createTrackCredit = async (input: CreateTrackCreditInput): Promise<TrackCredit> => {
    if (!user.value) throw new Error('Must be logged in to add track credits')

    const { data, error } = await supabase
      .from('track_credits')
      .insert({
        track_id: input.track_id,
        role: input.role,
        name: input.name,
        ipi_number: input.ipi_number || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateTrackCredit = async (creditId: string, input: UpdateTrackCreditInput): Promise<TrackCredit> => {
    if (!user.value) throw new Error('Must be logged in to update track credits')

    const { data, error } = await supabase
      .from('track_credits')
      .update(input)
      .eq('id', creditId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteTrackCredit = async (creditId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete track credits')

    const { error } = await supabase
      .from('track_credits')
      .delete()
      .eq('id', creditId)

    if (error) throw error
  }

  const deleteAllTrackCredits = async (trackId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete track credits')

    const { error } = await supabase
      .from('track_credits')
      .delete()
      .eq('track_id', trackId)

    if (error) throw error
  }

  const setTrackCredits = async (trackId: string, credits: Omit<CreateTrackCreditInput, 'track_id'>[]): Promise<TrackCredit[]> => {
    if (!user.value) throw new Error('Must be logged in to manage track credits')

    await deleteAllTrackCredits(trackId)

    if (credits.length === 0) return []

    const { data, error } = await supabase
      .from('track_credits')
      .insert(
        credits.map((c) => ({
          track_id: trackId,
          role: c.role,
          name: c.name,
          ipi_number: c.ipi_number || null,
        }))
      )
      .select()

    if (error) throw error
    return data || []
  }

  return {
    // Reactive state for SWR
    currentAlbum,
    currentBandAlbums,

    // Helper methods
    generateSlug,
    getStreamUrl,
    getPlaybackAudioKey,
    getCachedCoverUrl,
    getUploadUrl,
    invalidateAlbumCache,

    // Query methods
    getBandAlbums,
    getAlbumById,
    getAlbumBySlug,
    getAlbumBySlugForOwner,

    // Album mutations
    createAlbum,
    updateAlbum,
    deleteAlbum,

    // Track mutations
    createTrack,
    updateTrack,
    deleteTrack,
    reorderTracks,

    // Track credits
    getTrackCredits,
    getCreditsForTracks,
    createTrackCredit,
    updateTrackCredit,
    deleteTrackCredit,
    deleteAllTrackCredits,
    setTrackCredits,
  }
})
