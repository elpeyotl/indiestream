// POST /api/transcoding/complete - Mark a transcoding job as complete
// Called by the transcoding worker when a job finishes
import { serverSupabaseServiceRole } from '#supabase/server'
import { deleteFromR2 } from '~/server/utils/r2'

interface CompleteRequest {
  jobId: string
  trackId: string
  success: boolean
  streamingAudioKey?: string // R2 key for AAC streaming file
  hifiAudioKey?: string // R2 key for FLAC hi-fi file
  archiveAudioKey?: string // R2 key for archived original
  originalAudioKey?: string // Original key to delete after archiving
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
  const { jobId, trackId, success, streamingAudioKey, hifiAudioKey, archiveAudioKey, originalAudioKey, error } = body

  if (!jobId || !trackId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing jobId or trackId' })
  }

  const client = await serverSupabaseServiceRole(event)

  if (success && streamingAudioKey && hifiAudioKey) {
    // Update job as complete
    await client
      .from('transcoding_queue')
      .update({
        status: 'complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Update track with all audio keys
    const updateData: Record<string, string> = {
      streaming_audio_key: streamingAudioKey,
      hifi_audio_key: hifiAudioKey,
      transcoding_status: 'complete',
    }

    // If original was archived, update archive key
    if (archiveAudioKey) {
      updateData.archive_audio_key = archiveAudioKey
    }

    await client
      .from('tracks')
      .update(updateData)
      .eq('id', trackId)

    // Delete original file from uploads/ path after archiving
    if (originalAudioKey && archiveAudioKey) {
      try {
        await deleteFromR2(originalAudioKey)
      } catch (e) {
        // Log but don't fail - original cleanup is best-effort
        console.error(`Failed to delete original file ${originalAudioKey}:`, e)
      }
    }

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
