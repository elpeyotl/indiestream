// Band management composable for Indiestream

export interface Band {
  id: string
  owner_id: string
  name: string
  slug: string
  bio: string | null
  location: string | null
  website: string | null
  avatar_url: string | null
  banner_url: string | null
  theme_color: string
  genres: string[]
  is_verified: boolean
  total_streams: number
  total_earnings_cents: number
  created_at: string
  updated_at: string
}

export interface CreateBandInput {
  name: string
  slug: string
  bio?: string
  location?: string
  genres?: string[]
}

export interface UpdateBandInput {
  name?: string
  bio?: string
  location?: string
  website?: string
  avatar_url?: string
  banner_url?: string
  theme_color?: string
  genres?: string[]
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

  // Get a band by slug (public)
  const getBandBySlug = async (slug: string): Promise<Band | null> => {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  }

  // Get a band by ID
  const getBandById = async (id: string): Promise<Band | null> => {
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
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
        bio: input.bio || null,
        location: input.location || null,
        genres: input.genres || [],
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
    return data
  }

  // Delete a band
  const deleteBand = async (bandId: string): Promise<void> => {
    if (!user.value) throw new Error('Must be logged in to delete a band')

    const { error } = await supabase
      .from('bands')
      .delete()
      .eq('id', bandId)
      .eq('owner_id', user.value.id)

    if (error) throw error
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
  }
}
