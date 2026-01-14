import { serverSupabaseClient } from '#supabase/server'
import { getDownloadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  const client = await serverSupabaseClient(event)

  // Fetch user profile
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, display_name, avatar_key, bio, location, website, created_at')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Fetch followed artists
  const { data: follows, error: followsError } = await client
    .from('follows')
    .select(`
      band:bands (
        id,
        name,
        slug,
        avatar_key,
        is_verified
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (followsError) {
    console.error('Failed to fetch followed artists:', followsError)
  }

  // Generate presigned URL for profile avatar
  let avatarUrl = null
  if (profile.avatar_key) {
    try {
      avatarUrl = await getDownloadUrl(profile.avatar_key, 3600)
    } catch (e) {
      console.error('Failed to generate avatar URL:', e)
    }
  }

  // Generate presigned URLs for artist avatars
  const followedArtists = []
  if (follows && follows.length > 0) {
    for (const follow of follows) {
      if (follow.band) {
        let artistAvatarUrl = null
        if (follow.band.avatar_key) {
          try {
            artistAvatarUrl = await getDownloadUrl(follow.band.avatar_key, 3600)
          } catch (e) {
            console.error('Failed to generate artist avatar URL:', e)
          }
        }

        followedArtists.push({
          id: follow.band.id,
          name: follow.band.name,
          slug: follow.band.slug,
          avatarKey: follow.band.avatar_key,
          avatarUrl: artistAvatarUrl,
          verified: follow.band.is_verified
        })
      }
    }
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    avatarKey: profile.avatar_key,
    avatarUrl,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    createdAt: profile.created_at,
    followedArtists
  }
})
