// Development seed endpoint - creates sample bands and albums for testing
// Only works in development mode
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

const SAMPLE_BANDS = [
  {
    name: 'Midnight Echoes',
    slug: 'midnight-echoes',
    bio: 'Atmospheric electronic music from Berlin. Blending ambient textures with driving beats.',
    location: 'Berlin, Germany',
    genres: ['Electronic', 'Ambient', 'Downtempo'],
    theme_color: '#6366F1',
    albums: [
      {
        title: 'Neon Dreams',
        slug: 'neon-dreams',
        description: 'A journey through the city at night.',
        release_type: 'album',
        tracks: [
          { title: 'City Lights', duration: 245 },
          { title: 'Neon Rain', duration: 312 },
          { title: 'Midnight Drive', duration: 278 },
          { title: 'Electric Pulse', duration: 356 },
          { title: 'Dawn Horizon', duration: 423 },
        ],
      },
      {
        title: 'Digital Sunset',
        slug: 'digital-sunset',
        description: 'Warm analog sounds meet digital production.',
        release_type: 'ep',
        tracks: [
          { title: 'Golden Hour', duration: 287 },
          { title: 'Analog Warmth', duration: 234 },
          { title: 'Sunset Protocol', duration: 312 },
        ],
      },
    ],
  },
  {
    name: 'The Static Hearts',
    slug: 'the-static-hearts',
    bio: 'Indie rock with a hint of shoegaze. Making noise since 2019.',
    location: 'Portland, OR',
    genres: ['Indie Rock', 'Shoegaze', 'Alternative'],
    theme_color: '#EC4899',
    albums: [
      {
        title: 'Frequency',
        slug: 'frequency',
        description: 'Our debut album exploring love, loss, and feedback.',
        release_type: 'album',
        tracks: [
          { title: 'White Noise', duration: 198 },
          { title: 'Frequency', duration: 267 },
          { title: 'Static Love', duration: 234 },
          { title: 'Radio Silence', duration: 312 },
          { title: 'Transmission', duration: 289 },
          { title: 'Signal Lost', duration: 356 },
          { title: 'Fade Out', duration: 412 },
        ],
      },
    ],
  },
  {
    name: 'Luna Bay',
    slug: 'luna-bay',
    bio: 'Dream pop duo creating ethereal soundscapes and lush harmonies.',
    location: 'Los Angeles, CA',
    genres: ['Dream Pop', 'Synth Pop', 'Indie'],
    theme_color: '#8B5CF6',
    albums: [
      {
        title: 'Tidal',
        slug: 'tidal',
        description: 'Songs inspired by the ocean and the moon.',
        release_type: 'album',
        tracks: [
          { title: 'Moonrise', duration: 223 },
          { title: 'Tidal', duration: 278 },
          { title: 'Drift', duration: 312 },
          { title: 'Undertow', duration: 267 },
          { title: 'Phosphorescence', duration: 345 },
          { title: 'Ebb', duration: 198 },
        ],
      },
      {
        title: 'Celestial',
        slug: 'celestial',
        description: 'Looking up at the stars.',
        release_type: 'single',
        tracks: [
          { title: 'Celestial', duration: 298 },
        ],
      },
    ],
  },
  {
    name: 'Concrete Garden',
    slug: 'concrete-garden',
    bio: 'Post-punk revival with industrial influences. Dark, danceable, and loud.',
    location: 'Manchester, UK',
    genres: ['Post-Punk', 'Industrial', 'Darkwave'],
    theme_color: '#14B8A6',
    albums: [
      {
        title: 'Urban Decay',
        slug: 'urban-decay',
        description: 'Songs about modern life in dying cities.',
        release_type: 'album',
        tracks: [
          { title: 'Concrete Jungle', duration: 234 },
          { title: 'Factory Floor', duration: 289 },
          { title: 'Neon Cemetery', duration: 267 },
          { title: 'Rust', duration: 312 },
          { title: 'Urban Sprawl', duration: 356 },
          { title: 'Decay', duration: 423 },
        ],
      },
    ],
  },
  {
    name: 'Velvet Haze',
    slug: 'velvet-haze',
    bio: 'Psychedelic folk-rock. Vintage vibes, modern production.',
    location: 'Austin, TX',
    genres: ['Psychedelic', 'Folk Rock', 'Indie Folk'],
    theme_color: '#F59E0B',
    albums: [
      {
        title: 'Sunflower Dreams',
        slug: 'sunflower-dreams',
        description: 'A warm, hazy afternoon in musical form.',
        release_type: 'album',
        tracks: [
          { title: 'Sunflower', duration: 256 },
          { title: 'Haze', duration: 312 },
          { title: 'Golden Fields', duration: 278 },
          { title: 'Wanderer', duration: 345 },
          { title: 'Autumn Leaves', duration: 289 },
          { title: 'Twilight Song', duration: 398 },
        ],
      },
      {
        title: 'Morning Dew',
        slug: 'morning-dew',
        description: 'Early morning acoustic sessions.',
        release_type: 'ep',
        tracks: [
          { title: 'First Light', duration: 234 },
          { title: 'Morning Dew', duration: 267 },
          { title: 'Coffee Steam', duration: 198 },
          { title: 'Sunrise', duration: 312 },
        ],
      },
    ],
  },
]

export default defineEventHandler(async (event) => {
  // Only allow in development
  const config = useRuntimeConfig()
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      message: 'Seed endpoint only available in development',
    })
  }

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Must be logged in to seed data',
    })
  }

  // Use service role to bypass RLS
  const supabase = serverSupabaseServiceRole(event)

  const results = {
    bands: 0,
    albums: 0,
    tracks: 0,
  }

  try {
    for (const bandData of SAMPLE_BANDS) {
      // Check if band already exists
      const { data: existingBand } = await supabase
        .from('bands')
        .select('id')
        .eq('slug', bandData.slug)
        .maybeSingle()

      if (existingBand) {
        console.log(`Band ${bandData.name} already exists, skipping...`)
        continue
      }

      // Create band
      const { data: band, error: bandError } = await supabase
        .from('bands')
        .insert({
          owner_id: user.id,
          name: bandData.name,
          slug: bandData.slug,
          bio: bandData.bio,
          location: bandData.location,
          genres: bandData.genres,
          theme_color: bandData.theme_color,
        })
        .select()
        .single()

      if (bandError) {
        console.error(`Failed to create band ${bandData.name}:`, bandError)
        continue
      }

      results.bands++

      // Create albums
      for (const albumData of bandData.albums) {
        const releaseDate = new Date()
        releaseDate.setMonth(releaseDate.getMonth() - Math.floor(Math.random() * 12))

        const { data: album, error: albumError } = await supabase
          .from('albums')
          .insert({
            band_id: band.id,
            title: albumData.title,
            slug: albumData.slug,
            description: albumData.description,
            release_type: albumData.release_type,
            release_date: releaseDate.toISOString().split('T')[0],
            is_published: true,
          })
          .select()
          .single()

        if (albumError) {
          console.error(`Failed to create album ${albumData.title}:`, albumError)
          continue
        }

        results.albums++

        // Create tracks
        for (let i = 0; i < albumData.tracks.length; i++) {
          const trackData = albumData.tracks[i]

          const { error: trackError } = await supabase
            .from('tracks')
            .insert({
              album_id: album.id,
              band_id: band.id,
              title: trackData.title,
              track_number: i + 1,
              duration_seconds: trackData.duration,
              moderation_status: 'approved',
            })

          if (trackError) {
            console.error(`Failed to create track ${trackData.title}:`, trackError)
            continue
          }

          results.tracks++
        }
      }
    }

    return {
      success: true,
      message: `Created ${results.bands} bands, ${results.albums} albums, ${results.tracks} tracks`,
      results,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to seed database',
    })
  }
})
