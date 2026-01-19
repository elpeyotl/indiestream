import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate required fields per DMCA requirements
  const {
    claimant_name,
    claimant_email,
    claimant_address,
    claimant_phone,
    copyrighted_work_description,
    infringing_url,
    good_faith_statement,
    accuracy_statement,
    signature,
  } = body

  // Check required fields
  const requiredFields = [
    'claimant_name',
    'claimant_email',
    'claimant_address',
    'copyrighted_work_description',
    'infringing_url',
    'good_faith_statement',
    'accuracy_statement',
    'signature',
  ]

  const missingFields = requiredFields.filter(field => !body[field])
  if (missingFields.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(claimant_email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  // Validate URL format
  try {
    new URL(infringing_url)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid infringing URL format' })
  }

  // Validate statements are checked (should be true)
  if (!good_faith_statement || !accuracy_statement) {
    throw createError({
      statusCode: 400,
      message: 'Both statements must be confirmed to submit a DMCA notice',
    })
  }

  // Use service role to bypass RLS - the RLS policy references auth.users which isn't accessible
  const supabase = await serverSupabaseServiceRole(event)

  // Create the DMCA request
  const { data: dmcaRequest, error } = await supabase
    .from('dmca_requests')
    .insert({
      claimant_name,
      claimant_email,
      claimant_address,
      claimant_phone: claimant_phone || null,
      copyrighted_work_description,
      infringing_url,
      good_faith_statement,
      accuracy_statement,
      signature,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create DMCA request:', error)
    throw createError({ statusCode: 500, message: 'Failed to submit DMCA request' })
  }

  // TODO: Send notification email to admins

  return {
    success: true,
    message: 'Your DMCA takedown notice has been submitted. We will review it and respond within 24-48 hours.',
    requestId: dmcaRequest.id,
  }
})
