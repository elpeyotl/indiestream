# Audio Transcoding Architecture

This document explains how audio files are processed from upload to playback in Fairtune.

## Overview

Fairtune requires **lossless audio uploads** (WAV, FLAC, AIFF) to ensure the highest quality source files. These are transcoded to **dual formats**:

1. **AAC 256kbps** - Standard quality streaming (efficient, universal compatibility)
2. **FLAC 16-bit/44.1kHz** - Hi-fi quality streaming (CD quality, lossless)

After transcoding, the original file is **archived** to long-term storage and the upload copy is deleted. This approach:

1. Provides optimal standard streaming quality
2. Enables hi-fi streaming tier for audiophiles
3. Preserves originals for future reprocessing if needed
4. Optimizes storage costs with tiered bucket structure

## Upload Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Artist    │     │   Nuxt      │     │ Cloudflare  │     │  Supabase   │
│   Browser   │────▶│   Server    │────▶│     R2      │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                    │
      │ 1. Request        │                   │                    │
      │    presigned URL  │                   │                    │
      │──────────────────▶│                   │                    │
      │                   │                   │                    │
      │ 2. Return URL     │                   │                    │
      │◀──────────────────│                   │                    │
      │                   │                   │                    │
      │ 3. Upload lossless│                   │                    │
      │   directly to R2  │                   │                    │
      │───────────────────────────────────────▶                    │
      │                   │                   │                    │
      │ 4. Create track   │                   │                    │
      │    record         │                   │                    │
      │──────────────────▶│──────────────────────────────────────▶│
      │                   │                   │                    │
      │                   │                   │    5. Trigger adds │
      │                   │                   │       to queue     │
      │                   │                   │◀───────────────────│
```

### Step-by-Step

1. **Artist uploads lossless file** (WAV, FLAC, or AIFF, max 300MB)
2. **Server validates format** and generates presigned upload URL
3. **Browser uploads directly to R2** (bypasses server for large files)
4. **Track record created** in database with:
   - `original_audio_key`: R2 key for lossless file
   - `original_format`: 'wav', 'flac', or 'aiff'
   - `transcoding_status`: 'pending'
5. **Database trigger** automatically adds job to `transcoding_queue`

## Transcoding Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Fly.io    │     │   Nuxt      │     │ Cloudflare  │     │  Supabase   │
│   Worker    │────▶│   Server    │────▶│     R2      │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                    │
      │ 1. Poll queue     │                   │                    │
      │   every 30s       │                   │                    │
      │──────────────────▶│──────────────────────────────────────▶│
      │                   │                   │                    │
      │ 2. Get pending    │                   │                    │
      │    jobs           │                   │                    │
      │◀──────────────────│◀──────────────────────────────────────│
      │                   │                   │                    │
      │ 3. Request        │                   │                    │
      │    presigned URLs │                   │                    │
      │   (3 upload URLs) │                   │                    │
      │──────────────────▶│                   │                    │
      │                   │                   │                    │
      │ 4. Download       │                   │                    │
      │    lossless       │                   │                    │
      │───────────────────────────────────────▶                    │
      │                   │                   │                    │
      │ 5. FFmpeg         │                   │                    │
      │    transcode to   │                   │                    │
      │    AAC + FLAC     │                   │                    │
      │                   │                   │                    │
      │ 6. Upload 3 files │                   │                    │
      │    - AAC stream   │                   │                    │
      │    - FLAC hifi    │                   │                    │
      │    - Archive orig │                   │                    │
      │───────────────────────────────────────▶                    │
      │                   │                   │                    │
      │ 7. Mark complete  │                   │                    │
      │    + delete orig  │                   │                    │
      │──────────────────▶│──────────────────────────────────────▶│
```

### FFmpeg Commands

**Standard Streaming (AAC 256kbps):**
```bash
ffmpeg -i input.flac \
  -vn \                    # No video
  -c:a aac \               # AAC codec
  -b:a 256k \              # 256 kbps bitrate
  -ar 48000 \              # 48kHz sample rate
  -ac 2 \                  # Stereo
  -movflags +faststart \   # Optimize for streaming
  -y output.m4a
```

**Hi-Fi Streaming (FLAC 16-bit/44.1kHz):**
```bash
ffmpeg -i input.flac \
  -vn \                    # No video
  -c:a flac \              # FLAC codec
  -sample_fmt s16 \        # 16-bit depth
  -ar 44100 \              # 44.1kHz sample rate
  -ac 2 \                  # Stereo
  -compression_level 8 \   # High compression
  -y output.flac
```

### Why Dual Formats?

**AAC 256kbps (Standard):**
- **Transparent quality**: Indistinguishable from lossless for most listeners
- **Wide compatibility**: Plays on all devices and browsers
- **Efficient streaming**: ~2MB per minute
- **Default for all users**

**FLAC 16-bit/44.1kHz (Hi-Fi):**
- **Lossless quality**: Perfect CD-quality audio
- **Audiophile tier**: For users who want the best
- **Standardized format**: Consistent quality regardless of upload format
- **~10MB per minute**: 5x larger than AAC

## Playback Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Listener  │     │   Nuxt      │     │ Cloudflare  │
│   Browser   │────▶│   Server    │────▶│     R2      │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ 1. Load album     │                   │
      │──────────────────▶│                   │
      │                   │                   │
      │ 2. Track data     │                   │
      │    includes       │                   │
      │    streaming_key  │                   │
      │◀──────────────────│                   │
      │                   │                   │
      │ 3. Request        │                   │
      │    audio stream   │                   │
      │──────────────────▶│                   │
      │                   │                   │
      │ 4. Presigned URL  │                   │
      │◀──────────────────│                   │
      │                   │                   │
      │ 5. Stream AAC     │                   │
      │◀──────────────────────────────────────│
```

### Audio Source Selection

The player automatically chooses audio based on user preference and availability:

```typescript
const getPlaybackAudioKey = (track: Track, hifiEnabled: boolean): string | null => {
  // Only use transcoded versions if transcoding is complete
  if (track.transcoding_status === 'complete') {
    // Hi-fi users get FLAC if available
    if (hifiEnabled && track.hifi_audio_key) {
      return track.hifi_audio_key
    }
    // Standard users get AAC
    if (track.streaming_audio_key) {
      return track.streaming_audio_key
    }
  }
  // Fall back to original lossless (slower to load, but works)
  return track.original_audio_key || track.audio_key
}
```

## Database Schema

### tracks table (relevant columns)

| Column | Type | Description |
|--------|------|-------------|
| `audio_key` | TEXT | Legacy - original audio file (deprecated) |
| `original_audio_key` | TEXT | Lossless source file in R2 (deleted after archiving) |
| `original_format` | VARCHAR(10) | 'wav', 'flac', or 'aiff' |
| `streaming_audio_key` | TEXT | Transcoded AAC file in `streaming/` bucket |
| `hifi_audio_key` | TEXT | Transcoded FLAC file in `hifi/` bucket |
| `archive_audio_key` | TEXT | Archived original file in `archive/` bucket |
| `transcoding_status` | VARCHAR(20) | 'pending', 'processing', 'complete', 'failed' |

### transcoding_queue table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `track_id` | UUID | Reference to tracks table |
| `status` | VARCHAR(20) | 'pending', 'processing', 'complete', 'failed' |
| `attempts` | INTEGER | Number of processing attempts |
| `error` | TEXT | Error message if failed |
| `created_at` | TIMESTAMPTZ | When job was created |
| `started_at` | TIMESTAMPTZ | When processing started |
| `completed_at` | TIMESTAMPTZ | When processing finished |

### Database Trigger

A trigger automatically adds new tracks to the transcoding queue:

```sql
CREATE OR REPLACE FUNCTION add_track_to_transcoding_queue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.original_audio_key IS NOT NULL AND NEW.transcoding_status = 'pending' THEN
    INSERT INTO transcoding_queue (track_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT (track_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_transcoding_trigger
AFTER INSERT ON tracks
FOR EACH ROW
EXECUTE FUNCTION add_track_to_transcoding_queue();
```

## API Endpoints

### Upload APIs (Nuxt Server)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload/presign` | POST | Get presigned URL for direct R2 upload |
| `/api/bulk-upload/validate` | POST | Validate CSV + ZIP before processing |
| `/api/bulk-upload/presign-zip` | POST | Get presigned URL for large ZIP upload |
| `/api/bulk-upload/process-from-r2` | POST | Process ZIP already uploaded to R2 |

### Transcoding APIs (Worker uses these)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/transcoding/queue` | GET | Secret | Get pending jobs |
| `/api/transcoding/presign` | POST | Secret | Get download/upload URLs |
| `/api/transcoding/complete` | POST | Secret | Mark job complete/failed |

All transcoding endpoints require `x-transcoding-secret` header matching `TRANSCODING_SECRET` env var.

## Fly.io Worker

### Configuration

Located in `/transcoding-worker/`:

| File | Purpose |
|------|---------|
| `worker.ts` | Main worker script |
| `Dockerfile` | Docker image with FFmpeg |
| `fly.toml` | Fly.io deployment config |
| `package.json` | Dependencies (tsx only) |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TRANSCODING_SECRET` | Yes | - | Must match Nuxt server config |
| `API_BASE_URL` | Yes | - | Your Fairtune URL |
| `POLL_INTERVAL` | No | 30 | Seconds between queue polls |
| `BATCH_SIZE` | No | 3 | Jobs to fetch per poll |

### Deployment Commands

```bash
# First time setup
cd transcoding-worker
fly launch --no-deploy

# Set secrets
fly secrets set TRANSCODING_SECRET="your-secret"
fly secrets set API_BASE_URL="https://fairtune.fm"

# Deploy
fly deploy

# Monitor
fly logs
fly status

# Scale
fly scale memory 1024  # 1GB RAM (needed for large files)
fly scale count 0      # Stop worker
fly scale count 1      # Start worker
```

### Cost

- **Memory**: 1GB RAM (512MB caused OOM on large WAV files)
- **CPU**: Shared
- **Estimated cost**: ~$5-6/month

## File Storage (R2)

### Bucket Structure

Files are organized into buckets by access pattern and lifecycle:

```
streaming/{band_id}/{album_id}/{track_id}.m4a    # Standard AAC (hot storage)
hifi/{band_id}/{album_id}/{track_id}.flac        # Hi-fi FLAC (warm storage)
archive/{band_id}/{album_id}/{track_id}.{ext}    # Original files (cold storage)
covers/{band_id}/{album_id}/cover.{ext}          # Album covers
avatars/{band_id}/avatar.{ext}                   # Artist avatar
banners/{band_id}/banner.{ext}                   # Artist banner
```

### Storage Tiers

| Bucket | Purpose | Access | Caching |
|--------|---------|--------|---------|
| `streaming/` | Standard playback | High frequency | Edge cached |
| `hifi/` | Hi-fi playback | Medium frequency | Edge cached |
| `archive/` | Original preservation | Rare (reprocessing) | No caching |

### Lifecycle Rules (Cloudflare R2)

- **streaming/**: Standard storage, edge caching enabled
- **hifi/**: Standard storage, edge caching enabled
- **archive/**: Infrequent access storage (cost optimized)

### File Size Limits

| Type | Max Size | Formats |
|------|----------|---------|
| Audio | 300MB | WAV, FLAC, AIFF |
| Cover | 10MB | JPG, PNG, WebP |
| Avatar | 5MB | JPG, PNG, WebP, GIF |
| Banner | 10MB | JPG, PNG, WebP |

## Monitoring & Debugging

### Check transcoding status

```sql
-- Pending jobs
SELECT t.title, q.status, q.attempts, q.created_at
FROM transcoding_queue q
JOIN tracks t ON t.id = q.track_id
WHERE q.status = 'pending'
ORDER BY q.created_at;

-- Failed jobs
SELECT t.title, q.error, q.attempts
FROM transcoding_queue q
JOIN tracks t ON t.id = q.track_id
WHERE q.status = 'failed';

-- Recently completed
SELECT t.title, q.completed_at,
       t.streaming_audio_key IS NOT NULL as has_stream
FROM transcoding_queue q
JOIN tracks t ON t.id = q.track_id
WHERE q.status = 'complete'
ORDER BY q.completed_at DESC
LIMIT 20;
```

### Fly.io worker logs

```bash
fly logs -a fairtune-transcoder
```

### Manual requeue a failed job

```sql
UPDATE transcoding_queue
SET status = 'pending', attempts = 0, error = NULL
WHERE track_id = 'your-track-id';
```

## Troubleshooting

### Worker OOM (Out of Memory)

**Symptom**: Worker crashes with "Killed" message
**Cause**: Large WAV files (>100MB) exceed memory
**Fix**: Scale memory to 1GB: `fly scale memory 1024`

### Transcoding stuck in "processing"

**Symptom**: Jobs stay in "processing" forever
**Cause**: Worker crashed during processing
**Fix**: Reset stuck jobs:
```sql
UPDATE transcoding_queue
SET status = 'pending', started_at = NULL
WHERE status = 'processing'
AND started_at < NOW() - INTERVAL '10 minutes';
```

### Audio plays but sounds wrong

**Symptom**: Distorted or choppy audio
**Cause**: Usually a corrupted upload
**Fix**: Re-upload the original file

### Transcoding succeeds but player uses original

**Symptom**: `streaming_audio_key` exists but player loads original
**Cause**: `transcoding_status` not set to 'complete'
**Fix**: Check the complete endpoint was called:
```sql
SELECT streaming_audio_key, transcoding_status
FROM tracks WHERE id = 'your-track-id';
```
