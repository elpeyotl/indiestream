// Album and Track management composable for Indiestream

export interface Track {
  id: string
  album_id: string
  title: string
  track_number: number
  duration_seconds: number
  audio_key: string | null
  preview_start_seconds: number
  is_explicit: boolean
  lyrics: string | null
  stream_count: number
  created_at: string
  updated_at: string
  // Rights metadata
  isrc: string | null
  iswc: string | null
  is_cover: boolean
  spotify_track_id: string | null
  musicbrainz_work_id: string | null
  // Moderation
  moderation_status?: string
  moderation_notes?: string | null
  moderated_at?: string | null
  moderated_by?: string | null
  // Joined data
  credits?: TrackCredit[]
}

export interface TrackCredit {
  id: string
  track_id: string
  role: 'composer' | 'lyricist' | 'performer' | 'producer' | 'arranger'
  name: string
  ipi_number: string | null
  created_at: string
}

export interface Album {
  id: string
  band_id: string
  title: string
  slug: string
  description: string | null
  release_type: 'album' | 'ep' | 'single'
  release_date: string | null
  cover_key: string | null
  cover_url: string | null
  is_published: boolean
  total_duration_seconds: number
  total_streams: number
  created_at: string
  updated_at: string
  // Rights metadata
  upc: string | null
  label_name: string | null
  p_line: string | null
  c_line: string | null
  rights_confirmed: boolean
  rights_confirmed_at: string | null
  rights_confirmed_by: string | null
  // Joined data
  tracks?: Track[]
  band?: {
    id: string
    name: string
    slug: string
  }
}

export interface CreateAlbumInput {
  band_id: string
  title: string
  slug?: string
  description?: string
  release_type: 'album' | 'ep' | 'single'
  release_date?: string
  // Rights metadata
  upc?: string
  label_name?: string
}

export interface UpdateAlbumInput {
  title?: string
  description?: string
  release_type?: 'album' | 'ep' | 'single'
  release_date?: string
  cover_key?: string
  cover_url?: string
  is_published?: boolean
  // Rights metadata
  upc?: string
  label_name?: string
  p_line?: string
  c_line?: string
  rights_confirmed?: boolean
  rights_confirmed_at?: string
  rights_confirmed_by?: string
}

export interface CreateTrackInput {
  album_id: string
  band_id: string
  title: string
  track_number: number
  duration_seconds?: number
  is_explicit?: boolean
  lyrics?: string
  // Rights metadata
  isrc?: string
  iswc?: string
  is_cover?: boolean
  spotify_track_id?: string
  musicbrainz_work_id?: string
}

export interface UpdateTrackInput {
  title?: string
  track_number?: number
  duration_seconds?: number
  audio_key?: string
  preview_start_seconds?: number
  is_explicit?: boolean
  lyrics?: string
  // Rights metadata
  isrc?: string
  iswc?: string
  is_cover?: boolean
  spotify_track_id?: string
  musicbrainz_work_id?: string
}

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

export const useAlbum = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Get albums for a band
  const getBandAlbums = async (bandId: string, includeUnpublished = false, filterModeration = true): Promise<Album[]> => {
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

    // Filter tracks by moderation status if enabled
    if (filterModeration && data) {
      const { filterTracks, filterAlbums, loadModerationSetting } = useModerationFilter()
      await loadModerationSetting()
      for (const album of data) {
        if (album.tracks) {
          album.tracks = filterTracks(album.tracks)
        }
      }
      // Filter out albums with no approved tracks
      return filterAlbums(data)
    }

    return data || []
  }

  // Get a single album by ID
  const getAlbumById = async (albumId: string, filterModeration = true): Promise<Album | null> => {
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
      // Filter tracks by moderation status if enabled
      if (filterModeration) {
        const { filterTracks, loadModerationSetting } = useModerationFilter()
        await loadModerationSetting()
        data.tracks = filterTracks(data.tracks)
        // Return null if no approved tracks (album not visible)
        if (data.tracks.length === 0) {
          return null
        }
      }
      // Sort tracks by track_number
      data.tracks.sort((a: Track, b: Track) => a.track_number - b.track_number)
    }

    return data
  }

  // Get album by band slug and album slug (public)
  const getAlbumBySlug = async (bandSlug: string, albumSlug: string, filterModeration = true): Promise<Album | null> => {
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
      // Filter tracks by moderation status if enabled
      if (filterModeration) {
        const { filterTracks, loadModerationSetting } = useModerationFilter()
        await loadModerationSetting()
        data.tracks = filterTracks(data.tracks)
        // Return null if no approved tracks (album not visible)
        if (data.tracks.length === 0) {
          return null
        }
      }
      data.tracks.sort((a: Track, b: Track) => a.track_number - b.track_number)
    }

    return data
  }

  // Create a new album
  const createAlbum = async (input: CreateAlbumInput): Promise<Album> => {
    if (!user.value) throw new Error('Must be logged in to create an album')

    let slug = input.slug || generateSlug(input.title)

    // Check if slug exists and make it unique if needed
    const { data: existing } = await supabase
      .from('albums')
      .select('id')
      .eq('band_id', input.band_id)
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      // Add timestamp to make slug unique
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
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('An album with this URL already exists. Please try again.')
      }
      throw error
    }

    return data
  }

  // Update an album
  const updateAlbum = async (albumId: string, input: UpdateAlbumInput): Promise<Album> => {
    if (!user.value) throw new Error('Must be logged in to update an album')

    const { data, error } = await supabase
      .from('albums')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', albumId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete an album
  const deleteAlbum = async (albumId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete an album')

    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId)

    if (error) throw error
  }

  // Create a new track
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
    return data
  }

  // Update a track
  const updateTrack = async (trackId: string, input: UpdateTrackInput): Promise<Track> => {
    if (!user.value) throw new Error('Must be logged in to update a track')

    const { data, error } = await supabase
      .from('tracks')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete a track
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

    // Update each track's track_number
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
      body: {
        type,
        bandId,
        albumId,
        trackId,
        filename,
        contentType,
      },
    })

    return response
  }

  // Get streaming URL
  const getStreamUrl = async (key: string): Promise<string> => {
    const encodedKey = btoa(key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const response = await $fetch<{ url: string }>(`/api/stream/${encodedKey}`)
    return response.url
  }

  // ==========================================
  // Track Credits (Composer/Songwriter splits)
  // ==========================================

  // Get credits for a track
  const getTrackCredits = async (trackId: string): Promise<TrackCredit[]> => {
    const { data, error } = await supabase
      .from('track_credits')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get credits for multiple tracks (batch)
  const getCreditsForTracks = async (trackIds: string[]): Promise<Record<string, TrackCredit[]>> => {
    if (trackIds.length === 0) return {}

    const { data, error } = await supabase
      .from('track_credits')
      .select('*')
      .in('track_id', trackIds)

    if (error) throw error

    // Group by track_id
    const grouped: Record<string, TrackCredit[]> = {}
    for (const credit of data || []) {
      if (!grouped[credit.track_id]) {
        grouped[credit.track_id] = []
      }
      grouped[credit.track_id].push(credit)
    }

    return grouped
  }

  // Create a track credit
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

  // Update a track credit
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

  // Delete a track credit
  const deleteTrackCredit = async (creditId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete track credits')

    const { error } = await supabase
      .from('track_credits')
      .delete()
      .eq('id', creditId)

    if (error) throw error
  }

  // Delete all credits for a track
  const deleteAllTrackCredits = async (trackId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete track credits')

    const { error } = await supabase
      .from('track_credits')
      .delete()
      .eq('track_id', trackId)

    if (error) throw error
  }

  // Batch create credits for a track (replaces all existing)
  const setTrackCredits = async (trackId: string, credits: Omit<CreateTrackCreditInput, 'track_id'>[]): Promise<TrackCredit[]> => {
    if (!user.value) throw new Error('Must be logged in to manage track credits')

    // Delete existing credits
    await deleteAllTrackCredits(trackId)

    if (credits.length === 0) return []

    // Insert new credits
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
    generateSlug,
    getBandAlbums,
    getAlbumById,
    getAlbumBySlug,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    createTrack,
    updateTrack,
    deleteTrack,
    reorderTracks,
    getUploadUrl,
    getStreamUrl,
    // Track credits
    getTrackCredits,
    getCreditsForTracks,
    createTrackCredit,
    updateTrackCredit,
    deleteTrackCredit,
    deleteAllTrackCredits,
    setTrackCredits,
  }
}
