import { serverSupabaseClient } from '#supabase/server'
import { getDownloadUrl } from '~/server/utils/r2'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Artist slug is required'
    })
  }

  const client = await serverSupabaseClient(event)

  // First, get the band by slug
  const { data: band, error: bandError } = await client
    .from('bands')
    .select('id')
    .eq('slug', slug)
    .single()

  if (bandError || !band) {
    throw createError({
      statusCode: 404,
      message: 'Artist not found'
    })
  }

  // Fetch followers (just user IDs and dates)
  const { data: follows, error: followsError } = await client
    .from('follows')
    .select('created_at, user_id')
    .eq('band_id', band.id)
    .order('created_at', { ascending: false })
    .limit(50) // Limit to 50 most recent followers

  if (followsError) {
    console.error('Failed to fetch followers:', followsError)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch followers'
    })
  }

  // If no followers, return early
  if (!follows || follows.length === 0) {
    return {
      followers: [],
      total: 0
    }
  }

  // Get all user IDs
  const userIds = follows.map(f => f.user_id)

  // Fetch profile info for all followers
  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, display_name, avatar_key')
    .in('id', userIds)

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError)
  }

  // Create a map of profiles for quick lookup
  const profileMap = new Map()
  if (profiles) {
    profiles.forEach(profile => {
      profileMap.set(profile.id, profile)
    })
  }

  // Generate presigned URLs and combine data
  const followers = []
  for (const follow of follows) {
    const profile = profileMap.get(follow.user_id)
    if (profile) {
      let avatarUrl = null
      if (profile.avatar_key) {
        try {
          avatarUrl = await getDownloadUrl(profile.avatar_key, 3600)
        } catch (e) {
          console.error('Failed to generate avatar URL:', e)
        }
      }

      followers.push({
        id: profile.id,
        displayName: profile.display_name,
        avatarUrl,
        followedAt: follow.created_at
      })
    }
  }

  return {
    followers,
    total: followers.length
  }
})
