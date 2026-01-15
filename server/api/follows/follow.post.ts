// API endpoint to follow a band
import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to follow artists',
    })
  }

  const body = await readBody(event)
  const bandId = body.bandId as string

  if (!bandId) {
    throw createError({
      statusCode: 400,
      message: 'bandId is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('follow_band', {
    p_band_id: bandId,
  })

  if (error) {
    console.error('Failed to follow band:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to follow artist',
    })
  }

  // If follow was successful, create notification for the artist
  if (data) {
    const serviceClient = await serverSupabaseServiceRole(event)

    // Get band info and follower's display name
    const [bandResult, profileResult] = await Promise.all([
      serviceClient
        .from('bands')
        .select('owner_id, name')
        .eq('id', bandId)
        .single(),
      serviceClient
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single(),
    ])

    if (bandResult.data?.owner_id) {
      const followerName = profileResult.data?.display_name || user.email?.split('@')[0] || 'Someone'
      await serviceClient.from('notifications').insert({
        user_id: bandResult.data.owner_id,
        type: 'new_follower',
        title: 'New Follower',
        message: `${followerName} started following ${bandResult.data.name}`,
        link: `/dashboard/artist/${bandId}`,
      })
    }
  }

  return { success: data }
})
