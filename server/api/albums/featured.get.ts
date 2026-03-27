// GET /api/albums/featured - Public endpoint for featured albums
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const serviceClient = await serverSupabaseServiceRole(event)

  // Get featured albums, editorial blurb, and moderation setting in parallel
  const [albumsResult, blurbResult, moderationResult] = await Promise.all([
    client
      .from('featured_albums')
      .select(`
        id,
        position,
        description,
        albums:album_id (
          id,
          title,
          slug,
          cover_key,
          cover_url,
          release_type,
          release_date,
          bands:band_id (
            id,
            name,
            slug
          )
        )
      `)
      .order('position', { ascending: true }),
    client
      .from('platform_settings')
      .select('value')
      .eq('key', 'featured_albums_blurb')
      .single(),
    serviceClient
      .from('platform_settings')
      .select('value')
      .eq('key', 'require_track_moderation')
      .single(),
  ])

  if (albumsResult.error) {
    console.error('Failed to fetch featured albums:', albumsResult.error)
    throw createError({ statusCode: 500, message: 'Failed to fetch featured albums' })
  }

  const requireModeration = moderationResult.data?.value === true || moderationResult.data?.value === 'true'

  // Transform to flatten the structure
  let albums = (albumsResult.data || []).map((fa) => ({
    id: fa.albums?.id,
    title: fa.albums?.title,
    slug: fa.albums?.slug,
    cover_key: fa.albums?.cover_key,
    cover_url: fa.albums?.cover_url,
    release_type: fa.albums?.release_type,
    release_date: fa.albums?.release_date,
    band: fa.albums?.bands,
    description: fa.description,
  })).filter((a) => a.id) // Filter out any nulls

  // Filter out albums with no approved tracks when moderation is enabled
  if (requireModeration && albums.length > 0) {
    const albumIds = albums.map((a) => a.id).filter(Boolean) as string[]
    const { data: approvedTracks } = await client
      .from('tracks')
      .select('album_id')
      .in('album_id', albumIds)
      .eq('moderation_status', 'approved')
    const albumsWithApprovedTracks = new Set((approvedTracks || []).map((t) => t.album_id))
    albums = albums.filter((a) => albumsWithApprovedTracks.has(a.id!))
  }

  // Get blurb or return null (will use fallback on frontend)
  const blurb = blurbResult.data?.value as string | null

  return { albums, blurb }
})
