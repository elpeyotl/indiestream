import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const trackId = getRouterParam(event, 'id')
  if (!trackId) {
    throw createError({ statusCode: 400, message: 'Track ID is required' })
  }

  const body = await readBody(event)
  const { reason, details, evidence_url, reporter_email } = body

  // Validate reason
  const validReasons = ['copyright', 'ai_generated', 'inappropriate', 'other']
  if (!reason || !validReasons.includes(reason)) {
    throw createError({
      statusCode: 400,
      message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
    })
  }

  // Details required for copyright claims
  if (reason === 'copyright' && (!details || details.trim().length < 10)) {
    throw createError({
      statusCode: 400,
      message: 'Copyright claims require detailed information (at least 10 characters)',
    })
  }

  const supabase = await serverSupabaseClient(event)

  // Try to get user (reports can be anonymous)
  let userId: string | null = null
  try {
    const user = await serverSupabaseUser(event)
    userId = user?.id || null
  } catch {
    // Anonymous report
  }

  // Verify track exists
  const { data: track, error: trackError } = await supabase
    .from('tracks')
    .select('id, title')
    .eq('id', trackId)
    .single()

  if (trackError || !track) {
    throw createError({ statusCode: 404, message: 'Track not found' })
  }

  // Check for duplicate reports from same user/email
  if (userId || reporter_email) {
    const duplicateQuery = supabase
      .from('content_reports')
      .select('id')
      .eq('track_id', trackId)
      .eq('status', 'pending')

    if (userId) {
      duplicateQuery.eq('reporter_id', userId)
    } else if (reporter_email) {
      duplicateQuery.eq('reporter_email', reporter_email)
    }

    const { data: existingReport } = await duplicateQuery.single()

    if (existingReport) {
      throw createError({
        statusCode: 409,
        message: 'You have already reported this track. Our team is reviewing it.',
      })
    }
  }

  // Create the report
  const { data: report, error: reportError } = await supabase
    .from('content_reports')
    .insert({
      track_id: trackId,
      reporter_id: userId,
      reporter_email: !userId ? reporter_email : null,
      reason,
      details: details?.trim() || null,
      evidence_url: evidence_url?.trim() || null,
      status: 'pending',
    })
    .select()
    .single()

  if (reportError) {
    console.error('Failed to create report:', reportError)
    throw createError({ statusCode: 500, message: 'Failed to submit report' })
  }

  return {
    success: true,
    message: 'Report submitted successfully. Our team will review it.',
    reportId: report.id,
  }
})
