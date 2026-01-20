// POST /api/transcoding/complete - Mark a transcoding job as complete
// Called by the transcoding worker when a job finishes
import { serverSupabaseServiceRole } from '#supabase/server'

interface CompleteRequest {
  jobId: string
  trackId: string
  success: boolean
  streamingAudioKey?: string // R2 key for the transcoded file
  error?: string
}

export default defineEventHandler(async (event) => {
  // Verify this is an authorized request
  const authHeader = getHeader(event, 'x-transcoding-secret')
  const config = useRuntimeConfig()

  if (authHeader !== config.transcodingSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<CompleteRequest>(event)
  const { jobId, trackId, success, streamingAudioKey, error } = body

  if (!jobId || !trackId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing jobId or trackId' })
  }

  const client = await serverSupabaseServiceRole(event)

  if (success && streamingAudioKey) {
    // Update job as complete
    await client
      .from('transcoding_queue')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Update track with streaming key
    await client
      .from('tracks')
      .update({
        streaming_audio_key: streamingAudioKey,
        transcoding_status: 'complete',
      })
      .eq('id', trackId)

    return { success: true }
  } else {
    // Check if we should retry or mark as failed
    const { data: job } = await client
      .from('transcoding_queue')
      .select('attempts, max_attempts')
      .eq('id', jobId)
      .single()

    const shouldRetry = job && job.attempts < job.max_attempts

    if (shouldRetry) {
      // Reset to pending for retry
      await client
        .from('transcoding_queue')
        .update({
          status: 'pending',
          error_message: error || 'Unknown error',
        })
        .eq('id', jobId)

      await client
        .from('tracks')
        .update({ transcoding_status: 'pending' })
        .eq('id', trackId)
    } else {
      // Mark as failed
      await client
        .from('transcoding_queue')
        .update({
          status: 'failed',
          error_message: error || 'Max attempts reached',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      await client
        .from('tracks')
        .update({ transcoding_status: 'failed' })
        .eq('id', trackId)
    }

    return { success: false, willRetry: shouldRetry }
  }
})
