import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'You must be logged in to create a playlist',
    })
  }

  const body = await readBody(event)
  const { title, description } = body

  if (!title?.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Playlist title is required',
    })
  }

  const client = await serverSupabaseClient(event)

  const { data: playlist, error } = await client
    .from('playlists')
    .insert({
      owner_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create playlist:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create playlist',
    })
  }

  return playlist
})
