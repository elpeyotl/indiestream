// GET /api/transcoding/queue - Get pending transcoding jobs
// This endpoint is called by the transcoding worker to get jobs to process
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Verify this is an authorized request (use a secret header for worker auth)
  const authHeader = getHeader(event, 'x-transcoding-secret')
  const config = useRuntimeConfig()

  if (authHeader !== config.transcodingSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 5, 20) // Max 20 at a time

  const client = await serverSupabaseServiceRole(event)

  // Get pending jobs, ordered by creation date
  const { data: jobs, error } = await client
    .from('transcoding_queue')
    .select(`
      id,
      track_id,
      attempts,
      created_at,
      tracks!inner (
        id,
        title,
        original_audio_key,
        original_format,
        band_id,
        album_id
      )
    `)
    .eq('status', 'pending')
    .lt('attempts', 3) // Max 3 attempts
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch transcoding queue:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch queue' })
  }

  // Mark these jobs as processing
  if (jobs && jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id)
    await client
      .from('transcoding_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: jobs[0].attempts + 1, // This is a simplification
      })
      .in('id', jobIds)

    // Also update track status
    const trackIds = jobs.map((j) => j.track_id)
    await client
      .from('tracks')
      .update({ transcoding_status: 'processing' })
      .in('id', trackIds)
  }

  // Filter out jobs with missing required fields
  const validJobs = jobs?.filter((job) => {
    const track = job.tracks
    if (!track.original_audio_key || !track.original_format || !track.band_id || !track.album_id) {
      console.warn(`Skipping job ${job.id} - missing required track data:`, {
        original_audio_key: !!track.original_audio_key,
        original_format: !!track.original_format,
        band_id: !!track.band_id,
        album_id: !!track.album_id,
      })
      return false
    }
    return true
  }) || []

  return {
    jobs: validJobs.map((job) => ({
      jobId: job.id,
      trackId: job.track_id,
      trackTitle: job.tracks.title,
      originalAudioKey: job.tracks.original_audio_key,
      originalFormat: job.tracks.original_format,
      bandId: job.tracks.band_id,
      albumId: job.tracks.album_id,
      attempts: job.attempts,
    })),
  }
})
