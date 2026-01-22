#!/usr/bin/env npx tsx
/**
 * Transcoding Worker
 *
 * This script polls the transcoding queue and processes jobs using FFmpeg.
 * Run it on a server with FFmpeg installed:
 *
 *   TRANSCODING_SECRET=xxx API_URL=https://fairtune.fm npx tsx scripts/transcoding-worker.ts
 *
 * Or set up as a cron job to run every minute.
 *
 * Requirements:
 *   - FFmpeg installed (ffmpeg command available)
 *   - Environment variables: TRANSCODING_SECRET, API_URL
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

const API_URL = process.env.API_URL || 'http://localhost:3000'
const TRANSCODING_SECRET = process.env.TRANSCODING_SECRET
const BATCH_SIZE = 3 // Process 3 jobs at a time

if (!TRANSCODING_SECRET) {
  console.error('TRANSCODING_SECRET environment variable is required')
  process.exit(1)
}

interface TranscodingJob {
  jobId: string
  trackId: string
  trackTitle: string
  originalAudioKey: string
  originalFormat: string
  bandId: string
  albumId: string
  attempts: number
}

interface PresignResponse {
  downloadUrl: string
  uploadUrl: string
  streamingKey: string
}

async function fetchQueue(): Promise<TranscodingJob[]> {
  const response = await fetch(`${API_URL}/api/transcoding/queue?limit=${BATCH_SIZE}`, {
    headers: {
      'x-transcoding-secret': TRANSCODING_SECRET!,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch queue: ${response.status}`)
  }

  const data = await response.json()
  return data.jobs
}

async function getPresignedUrls(job: TranscodingJob): Promise<PresignResponse> {
  const response = await fetch(`${API_URL}/api/transcoding/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-transcoding-secret': TRANSCODING_SECRET!,
    },
    body: JSON.stringify({
      trackId: job.trackId,
      originalAudioKey: job.originalAudioKey,
      bandId: job.bandId,
      albumId: job.albumId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get presigned URLs: ${response.status}`)
  }

  return response.json()
}

async function markComplete(
  jobId: string,
  trackId: string,
  success: boolean,
  streamingAudioKey?: string,
  error?: string
): Promise<void> {
  await fetch(`${API_URL}/api/transcoding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-transcoding-secret': TRANSCODING_SECRET!,
    },
    body: JSON.stringify({
      jobId,
      trackId,
      success,
      streamingAudioKey,
      error,
    }),
  })
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(buffer))
}

async function uploadFile(url: string, filePath: string): Promise<void> {
  const fileBuffer = fs.readFileSync(filePath)
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'audio/mp4',
    },
    body: fileBuffer,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload: ${response.status}`)
  }
}

async function transcodeToAAC(inputPath: string, outputPath: string): Promise<void> {
  // FFmpeg command for high-quality AAC encoding
  // -vn: no video
  // -c:a aac: use AAC codec
  // -b:a 256k: 256 kbps bitrate
  // -ar 48000: 48kHz sample rate (standard for streaming)
  // -ac 2: stereo
  // -movflags +faststart: optimize for streaming (moov atom at start)
  const command = `ffmpeg -i "${inputPath}" -vn -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart -y "${outputPath}"`

  console.log(`  Running: ${command}`)
  const { stderr } = await execAsync(command)

  // FFmpeg outputs to stderr even on success
  if (stderr && stderr.includes('Error')) {
    throw new Error(stderr)
  }
}

async function processJob(job: TranscodingJob): Promise<void> {
  console.log(`Processing: ${job.trackTitle} (attempt ${job.attempts + 1})`)

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transcode-'))
  const inputPath = path.join(tempDir, `input.${job.originalFormat}`)
  const outputPath = path.join(tempDir, 'output.m4a')

  try {
    // Get presigned URLs
    console.log('  Getting presigned URLs...')
    const { downloadUrl, uploadUrl, streamingKey } = await getPresignedUrls(job)

    // Download original file
    console.log('  Downloading original file...')
    await downloadFile(downloadUrl, inputPath)
    const inputSize = fs.statSync(inputPath).size
    console.log(`  Downloaded: ${(inputSize / 1024 / 1024).toFixed(1)} MB`)

    // Transcode
    console.log('  Transcoding to AAC 256kbps...')
    await transcodeToAAC(inputPath, outputPath)
    const outputSize = fs.statSync(outputPath).size
    console.log(`  Transcoded: ${(outputSize / 1024 / 1024).toFixed(1)} MB`)

    // Upload transcoded file
    console.log('  Uploading transcoded file...')
    await uploadFile(uploadUrl, outputPath)

    // Mark complete
    console.log('  Marking complete...')
    await markComplete(job.jobId, job.trackId, true, streamingKey)
    console.log(`  ✓ Done: ${job.trackTitle}`)
  } catch (error: any) {
    console.error(`  ✗ Failed: ${error.message}`)
    await markComplete(job.jobId, job.trackId, false, undefined, error.message)
  } finally {
    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  console.log('=== Transcoding Worker ===')
  console.log(`API URL: ${API_URL}`)
  console.log('')

  try {
    // Fetch pending jobs
    console.log('Fetching queue...')
    const jobs = await fetchQueue()

    if (jobs.length === 0) {
      console.log('No jobs in queue')
      return
    }

    console.log(`Found ${jobs.length} job(s) to process\n`)

    // Process jobs sequentially (to avoid overwhelming the system)
    for (const job of jobs) {
      await processJob(job)
      console.log('')
    }

    console.log('=== Worker complete ===')
  } catch (error: any) {
    console.error('Worker error:', error.message)
    process.exit(1)
  }
}

main()
