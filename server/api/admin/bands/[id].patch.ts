// PATCH /api/admin/bands/[id] - Update band (admin can edit everything)
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

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

  const body = await readBody(event)

  // Build update object from allowed fields
  const updates: any = {}

  // Basic fields (admin can edit all)
  if (body.name !== undefined) updates.name = body.name
  if (body.slug !== undefined) updates.slug = body.slug
  if (body.bio !== undefined) updates.bio = body.bio
  if (body.location !== undefined) updates.location = body.location
  if (body.website !== undefined) updates.website = body.website
  if (body.theme_color !== undefined) updates.theme_color = body.theme_color
  if (body.genres !== undefined) updates.genres = body.genres

  // Verification status
  if (body.is_verified !== undefined) {
    updates.is_verified = body.is_verified
    if (body.is_verified) {
      // Record who verified and when
      updates.verified_at = new Date().toISOString()
      updates.verified_by = user.id
    }
  }

  // Featured status
  if (body.is_featured !== undefined) {
    updates.is_featured = body.is_featured
    if (body.is_featured) {
      // Record who featured and when
      updates.featured_at = new Date().toISOString()
      updates.featured_by = user.id
    } else {
      // Clear featured metadata when unfeaturing
      updates.featured_at = null
      updates.featured_by = null
    }
  }

  // Status management (active, suspended, removed)
  if (body.status !== undefined) {
    if (!['active', 'suspended', 'removed'].includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status. Must be active, suspended, or removed' })
    }
    updates.status = body.status

    if (body.status === 'suspended') {
      updates.suspended_at = new Date().toISOString()
      updates.suspended_by = user.id
      if (body.suspension_reason) {
        updates.suspension_reason = body.suspension_reason
      }
    } else if (body.status === 'active') {
      // Clear suspension metadata when reactivating
      updates.suspended_at = null
      updates.suspended_by = null
      updates.suspension_reason = null
    }
  }

  // Flag count (admin can manually adjust)
  if (body.flag_count !== undefined) {
    updates.flag_count = body.flag_count
  }

  // Stripe fields (admin can update)
  if (body.stripe_account_id !== undefined) updates.stripe_account_id = body.stripe_account_id
  if (body.stripe_onboarding_complete !== undefined) updates.stripe_onboarding_complete = body.stripe_onboarding_complete

  // Always update updated_at
  updates.updated_at = new Date().toISOString()

  // Perform update
  const { data: updatedBand, error } = await client
    .from('bands')
    .update(updates)
    .eq('id', bandId)
    .select(`
      *,
      owner:profiles!owner_id (
        id,
        email,
        display_name
      )
    `)
    .single()

  if (error) {
    console.error('Failed to update band:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return {
    success: true,
    band: updatedBand,
  }
})
