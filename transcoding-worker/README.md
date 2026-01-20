# IndieStream Transcoding Worker

Background worker that transcodes lossless audio (WAV, FLAC, AIFF) to dual formats:
- **AAC 256kbps** - Standard quality streaming
- **FLAC 16-bit/44.1kHz** - Hi-fi quality streaming

After transcoding, the original file is moved to an archive path and the upload copy is deleted.

For complete documentation on the audio upload and transcoding flow, see [/docs/AUDIO_TRANSCODING.md](/docs/AUDIO_TRANSCODING.md).

## Deployment to Fly.io

### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
fly auth login
```

### 3. Launch the app (first time only)

```bash
cd transcoding-worker
fly launch --no-deploy
```

When prompted:
- App name: `indiestream-transcoder` (or your preferred name)
- Region: Choose one close to your R2 bucket
- Don't set up PostgreSQL or Redis

### 4. Set secrets

```bash
fly secrets set TRANSCODING_SECRET="your-secret-from-nuxt-config"
fly secrets set API_BASE_URL="https://your-domain.com"
```

### 5. Deploy

```bash
fly deploy
```

## Configuration

Environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TRANSCODING_SECRET` | Yes | - | Secret key matching your Nuxt config |
| `API_BASE_URL` | Yes | - | Your IndieStream API URL |
| `POLL_INTERVAL` | No | 30 | Seconds between queue polls |
| `BATCH_SIZE` | No | 3 | Jobs to process per poll |

## Monitoring

View logs:
```bash
fly logs
```

Check status:
```bash
fly status
```

SSH into the machine:
```bash
fly ssh console
```

## Cost Optimization

The worker uses minimal resources:
- **1GB RAM** (required - 512MB causes OOM on large WAV files)
- Shared CPU

Estimated cost: ~$5-6/month depending on usage.

To reduce costs further, you can scale to zero when not needed:
```bash
fly scale count 0  # Stop the worker
fly scale count 1  # Start the worker
```

## Local Development

```bash
# Install dependencies
npm install

# Run locally (requires FFmpeg)
TRANSCODING_SECRET=xxx API_BASE_URL=http://localhost:3000 npm start
```
