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
}

export interface UpdateAlbumInput {
  title?: string
  description?: string
  release_type?: 'album' | 'ep' | 'single'
  release_date?: string
  cover_key?: string
  cover_url?: string
  is_published?: boolean
}

export interface CreateTrackInput {
  album_id: string
  band_id: string
  title: string
  track_number: number
  duration_seconds?: number
  is_explicit?: boolean
  lyrics?: string
}

export interface UpdateTrackInput {
  title?: string
  track_number?: number
  duration_seconds?: number
  audio_key?: string
  preview_start_seconds?: number
  is_explicit?: boolean
  lyrics?: string
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
  const getBandAlbums = async (bandId: string, includeUnpublished = false): Promise<Album[]> => {
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
    return data || []
  }

  // Get a single album by ID
  const getAlbumById = async (albumId: string): Promise<Album | null> => {
    const { data, error } = await supabase
      .from('albums')
      .select('*, tracks(*), band:bands(id, name, slug)')
      .eq('id', albumId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    // Sort tracks by track_number
    if (data?.tracks) {
      data.tracks.sort((a: Track, b: Track) => a.track_number - b.track_number)
    }

    return data
  }

  // Get album by band slug and album slug (public)
  const getAlbumBySlug = async (bandSlug: string, albumSlug: string): Promise<Album | null> => {
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
  }
}
