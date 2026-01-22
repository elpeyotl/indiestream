// POST /api/albums/[id]/notify-followers - Notify followers of new release
// Called after an album is published to send emails and in-app notifications
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { sendNewReleaseEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const albumId = getRouterParam(event, 'id')
  if (!albumId) {
    throw createError({ statusCode: 400, statusMessage: 'Album ID required' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Get the album with band info
  const { data: album, error: albumError } = await client
    .from('albums')
    .select(`
      id,
      title,
      slug,
      description,
      release_type,
      cover_key,
      is_published,
      band_id,
      bands (
        id,
        name,
        slug,
        owner_id
      )
    `)
    .eq('id', albumId)
    .single()

  if (albumError || !album) {
    throw createError({ statusCode: 404, statusMessage: 'Album not found' })
  }

  // Verify user owns the band or is admin
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const band = album.bands as { id: string; name: string; slug: string; owner_id: string }
  const isOwner = band.owner_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to notify for this album' })
  }

  // Album must be published
  if (!album.is_published) {
    throw createError({ statusCode: 400, statusMessage: 'Album must be published before notifying followers' })
  }

  // Get all followers of this band with their email addresses
  const { data: followers, error: followersError } = await client
    .from('follows')
    .select(`
      user_id,
      profiles!inner (
        id,
        email,
        display_name
      )
    `)
    .eq('band_id', band.id)

  if (followersError) {
    console.error('Failed to fetch followers:', followersError)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch followers' })
  }

  if (!followers || followers.length === 0) {
    return { success: true, notified: 0, message: 'No followers to notify' }
  }

  // Get cover URL if available
  let coverUrl: string | null = null
  if (album.cover_key) {
    try {
      const config = useRuntimeConfig()
      // Generate a public URL for the cover (simplified - in production you'd use proper presigned URL)
      coverUrl = `${config.public.appUrl || 'https://fairtune.fm'}/api/stream/${btoa(album.cover_key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`
    } catch {
      // Ignore cover URL errors
    }
  }

  const results = {
    success: true,
    notified: 0,
    emailsSent: 0,
    notificationsCreated: 0,
    errors: [] as string[],
  }

  // Process each follower
  for (const follower of followers) {
    const followerProfile = follower.profiles as { id: string; email: string; display_name: string | null }

    try {
      // Create in-app notification
      const { error: notifError } = await client
        .from('notifications')
        .insert({
          user_id: followerProfile.id,
          type: 'new_release',
          title: 'New Release',
          message: `${band.name} released "${album.title}"`,
          link: `/artist/${band.slug}/${album.slug}`,
        })

      if (notifError) {
        console.error(`Failed to create notification for user ${followerProfile.id}:`, notifError)
        results.errors.push(`Notification failed for ${followerProfile.email}`)
      } else {
        results.notificationsCreated++
      }

      // Send email notification
      if (followerProfile.email) {
        try {
          await sendNewReleaseEmail({
            to: followerProfile.email,
            followerName: followerProfile.display_name || 'Listener',
            bandName: band.name,
            bandSlug: band.slug,
            albumTitle: album.title,
            albumSlug: album.slug,
            releaseType: album.release_type as 'album' | 'ep' | 'single',
            description: album.description,
            coverUrl,
          })
          results.emailsSent++
        } catch (emailError: any) {
          console.error(`Failed to send email to ${followerProfile.email}:`, emailError)
          results.errors.push(`Email failed for ${followerProfile.email}: ${emailError.message}`)
        }
      }

      results.notified++
    } catch (err: any) {
      console.error(`Failed to notify follower ${followerProfile.id}:`, err)
      results.errors.push(`Failed for ${followerProfile.email}: ${err.message}`)
    }
  }

  console.log(`[New Release] Notified ${results.notified} followers for album "${album.title}" by ${band.name}`)

  return results
})
