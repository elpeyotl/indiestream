// POST /api/admin/artist-approvals/[id]/approve - Approve an artist profile
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { sendArtistApprovedEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  // Verify admin access
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseServiceRole(event)

  // Check if user is admin
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const bandId = getRouterParam(event, 'id')
  if (!bandId) {
    throw createError({ statusCode: 400, statusMessage: 'Band ID required' })
  }

  // Get band details for notification
  const { data: band, error: fetchError } = await client
    .from('bands')
    .select('id, name, owner_id, status')
    .eq('id', bandId)
    .single()

  if (fetchError || !band) {
    throw createError({ statusCode: 404, statusMessage: 'Artist not found' })
  }

  if (band.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Artist is not pending approval' })
  }

  // Update band status to active
  const { error: updateError } = await client
    .from('bands')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bandId)

  if (updateError) {
    console.error('Failed to approve artist:', updateError)
    throw createError({ statusCode: 500, statusMessage: updateError.message })
  }

  // Create notification for the artist
  if (band.owner_id) {
    await client.from('notifications').insert({
      user_id: band.owner_id,
      type: 'artist_approved',
      title: 'Artist Profile Approved!',
      message: `Your artist profile "${band.name}" has been approved. You can now upload music!`,
      link: `/dashboard/artist/${bandId}`,
    })

    // Send approval email
    const { data: ownerProfile } = await client
      .from('profiles')
      .select('email, display_name')
      .eq('id', band.owner_id)
      .single()

    if (ownerProfile?.email) {
      const config = useRuntimeConfig()
      try {
        await sendArtistApprovedEmail({
          to: ownerProfile.email,
          artistName: ownerProfile.display_name || 'Artist',
          bandName: band.name,
          dashboardUrl: `${config.public.appUrl}/dashboard/artist/${bandId}`,
        })
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
        // Don't fail the request if email fails
      }
    }
  }

  return {
    success: true,
    message: 'Artist approved successfully',
  }
})
