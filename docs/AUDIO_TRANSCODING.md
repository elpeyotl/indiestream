# Audio Transcoding Architecture

This document explains how audio files are processed from upload to playback in FairStream.

## Overview

FairStream requires **lossless audio uploads** (WAV, FLAC, AIFF) to ensure the highest quality source files. These are then **transcoded to AAC 256kbps** for streaming. This dual-format approach allows us to:

1. Future-proof for hi-res streaming tiers
2. Provide optimal streaming quality now
3. Never lose quality from the original source

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
      │──────────────────▶│                   │                    │
      │                   │                   │                    │
      │ 4. Download       │                   │                    │
      │    lossless       │                   │                    │
      │───────────────────────────────────────▶                    │
      │                   │                   │                    │
      │ 5. FFmpeg         │                   │                    │
      │    transcode      │                   │                    │
      │   (local)         │                   │                    │
      │                   │                   │                    │
      │ 6. Upload AAC     │                   │                    │
      │───────────────────────────────────────▶                    │
      │                   │                   │                    │
      │ 7. Mark complete  │                   │                    │
      │──────────────────▶│──────────────────────────────────────▶│
```

### FFmpeg Command

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

### Why AAC 256kbps?

- **Transparent quality**: Indistinguishable from lossless for most listeners
- **Wide compatibility**: Plays on all devices and browsers
- **Efficient streaming**: ~2MB per minute vs ~10MB+ for lossless
- **Future flexibility**: Can add lossless tier without re-uploading

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

The player automatically chooses the best available audio:

```typescript
const getPlaybackAudioKey = (track: Track): string | null => {
  // Prefer transcoded AAC if available
  if (track.streaming_audio_key && track.transcoding_status === 'complete') {
    return track.streaming_audio_key
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
| `original_audio_key` | TEXT | Lossless source file in R2 |
| `original_format` | VARCHAR(10) | 'wav', 'flac', or 'aiff' |
| `streaming_audio_key` | TEXT | Transcoded AAC file in R2 |
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
| `API_BASE_URL` | Yes | - | Your FairStream URL |
| `POLL_INTERVAL` | No | 30 | Seconds between queue polls |
| `BATCH_SIZE` | No | 3 | Jobs to fetch per poll |

### Deployment Commands

```bash
# First time setup
cd transcoding-worker
fly launch --no-deploy

# Set secrets
fly secrets set TRANSCODING_SECRET="your-secret"
fly secrets set API_BASE_URL="https://fairstream.fm"

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

### Key Naming Convention

```
bands/{band_id}/audio/{track_id}/original.{ext}   # Lossless source
bands/{band_id}/audio/{track_id}/stream.m4a       # Transcoded AAC
bands/{band_id}/covers/{album_id}.{ext}           # Album covers
bands/{band_id}/avatar.{ext}                       # Artist avatar
bands/{band_id}/banner.{ext}                       # Artist banner
```

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
fly logs -a indiestream-transcoder
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
