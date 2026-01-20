#!/usr/bin/env npx tsx
/**
 * Transcoding Worker for Fly.io
 *
 * Continuously polls the transcoding queue and processes jobs using FFmpeg.
 * Designed for deployment on Fly.io with minimal resources.
 *
 * Environment variables:
 *   - TRANSCODING_SECRET: Secret key for API authentication (required)
 *   - API_BASE_URL: Base URL of the IndieStream API (required)
 *   - POLL_INTERVAL: Seconds between queue polls when idle (default: 30)
 *   - BATCH_SIZE: Number of jobs to fetch per poll (default: 3)
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

// Configuration
const API_BASE_URL = process.env.API_BASE_URL
const TRANSCODING_SECRET = process.env.TRANSCODING_SECRET
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '30', 10) * 1000
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '3', 10)

// Validate required environment variables
if (!TRANSCODING_SECRET) {
  console.error('ERROR: TRANSCODING_SECRET environment variable is required')
  process.exit(1)
}

if (!API_BASE_URL) {
  console.error('ERROR: API_BASE_URL environment variable is required')
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

// Stats tracking
let stats = {
  processed: 0,
  succeeded: 0,
  failed: 0,
  startTime: Date.now(),
}

function log(message: string): void {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

async function fetchQueue(): Promise<TranscodingJob[]> {
  const response = await fetch(`${API_BASE_URL}/api/transcoding/queue?limit=${BATCH_SIZE}`, {
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
  const response = await fetch(`${API_BASE_URL}/api/transcoding/presign`, {
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
  await fetch(`${API_BASE_URL}/api/transcoding/complete`, {
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
  // -ar 48000: 48kHz sample rate
  // -ac 2: stereo
  // -movflags +faststart: optimize for streaming
  const command = `ffmpeg -i "${inputPath}" -vn -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart -y "${outputPath}"`

  const { stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 })

  // FFmpeg outputs to stderr even on success
  if (stderr && stderr.includes('Error')) {
    throw new Error(stderr)
  }
}

async function processJob(job: TranscodingJob): Promise<boolean> {
  log(`Processing: "${job.trackTitle}" (attempt ${job.attempts + 1})`)

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transcode-'))
  const inputPath = path.join(tempDir, `input.${job.originalFormat}`)
  const outputPath = path.join(tempDir, 'output.m4a')

  try {
    // Get presigned URLs
    const { downloadUrl, uploadUrl, streamingKey } = await getPresignedUrls(job)

    // Download original file
    log(`  Downloading ${job.originalFormat.toUpperCase()}...`)
    await downloadFile(downloadUrl, inputPath)
    const inputSize = fs.statSync(inputPath).size
    log(`  Downloaded: ${(inputSize / 1024 / 1024).toFixed(1)} MB`)

    // Transcode
    log(`  Transcoding to AAC 256kbps...`)
    const startTime = Date.now()
    await transcodeToAAC(inputPath, outputPath)
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    const outputSize = fs.statSync(outputPath).size
    const ratio = ((1 - outputSize / inputSize) * 100).toFixed(0)
    log(`  Transcoded: ${(outputSize / 1024 / 1024).toFixed(1)} MB (${ratio}% smaller) in ${duration}s`)

    // Upload transcoded file
    log(`  Uploading to R2...`)
    await uploadFile(uploadUrl, outputPath)

    // Mark complete
    await markComplete(job.jobId, job.trackId, true, streamingKey)
    log(`  ✓ Complete: "${job.trackTitle}"`)
    return true
  } catch (error: any) {
    log(`  ✗ Failed: ${error.message}`)
    await markComplete(job.jobId, job.trackId, false, undefined, error.message)
    return false
  } finally {
    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function pollAndProcess(): Promise<void> {
  try {
    const jobs = await fetchQueue()

    if (jobs.length === 0) {
      return
    }

    log(`Found ${jobs.length} job(s) to process`)

    for (const job of jobs) {
      stats.processed++
      const success = await processJob(job)
      if (success) {
        stats.succeeded++
      } else {
        stats.failed++
      }
    }
  } catch (error: any) {
    log(`Queue fetch error: ${error.message}`)
  }
}

function printStats(): void {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000 / 60)
  log(`Stats: ${stats.succeeded} succeeded, ${stats.failed} failed, ${stats.processed} total (uptime: ${uptime}m)`)
}

async function main(): Promise<void> {
  log('=== IndieStream Transcoding Worker ===')
  log(`API: ${API_BASE_URL}`)
  log(`Poll interval: ${POLL_INTERVAL / 1000}s`)
  log(`Batch size: ${BATCH_SIZE}`)
  log('')

  // Verify FFmpeg is available
  try {
    await execAsync('ffmpeg -version')
    log('FFmpeg: ✓ available')
  } catch {
    log('FFmpeg: ✗ not found - please install FFmpeg')
    process.exit(1)
  }

  log('')
  log('Starting poll loop...')

  // Print stats every 10 minutes
  setInterval(printStats, 10 * 60 * 1000)

  // Main polling loop
  while (true) {
    await pollAndProcess()
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...')
  printStats()
  process.exit(0)
})

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...')
  printStats()
  process.exit(0)
})

main()
