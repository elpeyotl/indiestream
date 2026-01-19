import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const playlistId = getRouterParam(event, 'id')
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to share playlists',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.rpc('generate_playlist_share_token', {
    p_playlist_id: playlistId,
  })

  if (error) {
    console.error('Failed to generate share token:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to generate share link',
    })
  }

  const config = useRuntimeConfig()
  const baseUrl = config.public.appUrl || 'https://fairstream.fm'

  return {
    token: data,
    url: `${baseUrl}/playlist/share/${data}`,
  }
})
