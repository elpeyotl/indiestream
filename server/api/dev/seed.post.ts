// Development seed endpoint - creates sample bands and albums for testing
// Only works in development mode
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// Use picsum.photos for random placeholder images
// Each seed ID generates a consistent image
const getAvatarUrl = (seed: number) => `https://picsum.photos/seed/avatar${seed}/400/400`
const getBannerUrl = (seed: number) => `https://picsum.photos/seed/banner${seed}/1500/500`
const getCoverUrl = (seed: number) => `https://picsum.photos/seed/cover${seed}/600/600`

const SAMPLE_BANDS = [
  {
    name: 'Midnight Echoes',
    slug: 'midnight-echoes',
    bio: 'Atmospheric electronic music from Berlin. Blending ambient textures with driving beats.',
    location: 'Berlin, Germany',
    genres: ['Electronic', 'Ambient', 'Downtempo'],
    theme_color: '#6366F1',
    avatar_seed: 101,
    banner_seed: 201,
    albums: [
      {
        title: 'Neon Dreams',
        slug: 'neon-dreams',
        description: 'A journey through the city at night.',
        release_type: 'album',
        cover_seed: 301,
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
        cover_seed: 302,
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
    avatar_seed: 102,
    banner_seed: 202,
    albums: [
      {
        title: 'Frequency',
        slug: 'frequency',
        description: 'Our debut album exploring love, loss, and feedback.',
        release_type: 'album',
        cover_seed: 303,
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
    avatar_seed: 103,
    banner_seed: 203,
    albums: [
      {
        title: 'Tidal',
        slug: 'tidal',
        description: 'Songs inspired by the ocean and the moon.',
        release_type: 'album',
        cover_seed: 304,
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
        cover_seed: 305,
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
    avatar_seed: 104,
    banner_seed: 204,
    albums: [
      {
        title: 'Urban Decay',
        slug: 'urban-decay',
        description: 'Songs about modern life in dying cities.',
        release_type: 'album',
        cover_seed: 306,
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
    avatar_seed: 105,
    banner_seed: 205,
    albums: [
      {
        title: 'Sunflower Dreams',
        slug: 'sunflower-dreams',
        description: 'A warm, hazy afternoon in musical form.',
        release_type: 'album',
        cover_seed: 307,
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
        cover_seed: 308,
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
    // Delete existing seeded bands first (by slug)
    const slugsToDelete = SAMPLE_BANDS.map(b => b.slug)
    const { data: existingBands } = await supabase
      .from('bands')
      .select('id')
      .in('slug', slugsToDelete)

    if (existingBands && existingBands.length > 0) {
      const bandIds = existingBands.map(b => b.id)

      // Delete tracks, albums, then bands (due to foreign keys)
      await supabase.from('tracks').delete().in('band_id', bandIds)
      await supabase.from('albums').delete().in('band_id', bandIds)
      await supabase.from('bands').delete().in('id', bandIds)

      console.log(`Deleted ${existingBands.length} existing seeded bands`)
    }

    for (const bandData of SAMPLE_BANDS) {

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
          avatar_url: getAvatarUrl(bandData.avatar_seed),
          banner_url: getBannerUrl(bandData.banner_seed),
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
            cover_url: getCoverUrl(albumData.cover_seed),
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
