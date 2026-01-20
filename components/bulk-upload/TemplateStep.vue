<template>
  <UCard class="bg-zinc-900/50 border-zinc-800">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-sm font-bold">1</div>
        <h2 class="text-lg font-semibold text-zinc-100">Download Template</h2>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Instructions -->
      <div class="prose prose-invert prose-sm max-w-none">
        <p>
          Bulk upload allows you to import multiple artists, albums, and tracks at once.
          Follow these steps:
        </p>
        <ol class="list-decimal list-inside space-y-2 text-zinc-300">
          <li>Download the example ZIP template below</li>
          <li>Edit the <code class="text-violet-400">catalog.csv</code> file with your data (one row per track)</li>
          <li>Replace placeholder files with your actual cover art and audio files</li>
          <li>Upload the completed ZIP and review before importing</li>
        </ol>
      </div>

      <!-- Template Download -->
      <div class="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-archive-box" class="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p class="font-medium text-zinc-100">Example ZIP Template</p>
              <p class="text-sm text-zinc-400">Includes catalog.csv + folder structure with placeholders</p>
            </div>
          </div>
          <UButton color="violet" :loading="isGenerating" @click="downloadExampleZip">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-2" />
            Download ZIP
          </UButton>
        </div>
      </div>

      <!-- What's in the ZIP -->
      <div class="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <h3 class="font-medium text-zinc-100 mb-3">What's in the ZIP</h3>
        <pre class="text-sm text-zinc-400 font-mono bg-zinc-900 p-3 rounded-lg overflow-x-auto">bulk-upload-template.zip
├── catalog.csv                    ← Edit this with your data
├── neon-waves/
│   ├── avatar.jpg                 ← Artist profile image
│   └── synthetic-dreams/
│       ├── cover.jpg              ← Album artwork
│       ├── 01-digital-sunrise.flac
│       ├── 02-midnight-protocol.flac
│       ├── 03-chrome-hearts.flac
│       └── 04-neon-fade.flac
└── the-velvet-moths/
    ├── avatar.jpg
    └── paper-wings/
        ├── cover.jpg
        ├── 01-whisper-valley.flac
        ├── 02-glass-houses.flac
        └── 03-autumn-glow.flac</pre>
        <p class="text-sm text-zinc-500 mt-3">
          Replace the placeholder audio/image files with your actual files, keeping the same paths
        </p>
      </div>

      <!-- CSV Fields Reference -->
      <UAccordion :items="fieldGroups" color="gray" variant="soft">
        <template #default="{ item, open }">
          <UButton
            color="gray"
            variant="ghost"
            class="w-full"
            :ui="{ padding: { sm: 'p-3' } }"
          >
            <span class="truncate">{{ item.label }}</span>
            <template #trailing>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-5 h-5 transition-transform duration-200"
                :class="{ 'rotate-180': open }"
              />
            </template>
          </UButton>
        </template>

        <template #artist-fields>
          <div class="p-4 text-sm space-y-2">
            <div v-for="field in artistFields" :key="field.name" class="flex gap-2">
              <code class="text-violet-400 font-mono">{{ field.name }}</code>
              <span v-if="field.required" class="text-red-400 text-xs">*required</span>
              <span class="text-zinc-400">- {{ field.description }}</span>
            </div>
          </div>
        </template>

        <template #album-fields>
          <div class="p-4 text-sm space-y-2">
            <div v-for="field in albumFields" :key="field.name" class="flex gap-2">
              <code class="text-violet-400 font-mono">{{ field.name }}</code>
              <span v-if="field.required" class="text-red-400 text-xs">*required</span>
              <span class="text-zinc-400">- {{ field.description }}</span>
            </div>
          </div>
        </template>

        <template #track-fields>
          <div class="p-4 text-sm space-y-2">
            <div v-for="field in trackFields" :key="field.name" class="flex gap-2">
              <code class="text-violet-400 font-mono">{{ field.name }}</code>
              <span v-if="field.required" class="text-red-400 text-xs">*required</span>
              <span class="text-zinc-400">- {{ field.description }}</span>
            </div>
          </div>
        </template>

        <template #credit-fields>
          <div class="p-4 text-sm space-y-2">
            <div v-for="field in creditFields" :key="field.name" class="flex gap-2">
              <code class="text-violet-400 font-mono">{{ field.name }}</code>
              <span class="text-zinc-400">- {{ field.description }}</span>
            </div>
          </div>
        </template>
      </UAccordion>

      <!-- Tips -->
      <div class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div class="flex gap-3">
          <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-400 shrink-0" />
          <div class="text-sm text-blue-300">
            <p class="font-medium mb-1">Tips for a smooth import</p>
            <ul class="list-disc list-inside space-y-1 text-blue-200/80">
              <li>Artist info (bio, location, genres) only needs to be filled in the first row for each artist</li>
              <li>Album info (cover, release date, UPC) only needs to be filled in the first track of each album</li>
              <li>Leave ISRC empty to have codes auto-generated for you</li>
              <li>Lossless audio only: WAV, FLAC, or AIFF (max 300MB per file)</li>
              <li>Supported images: JPG, PNG, WebP (square recommended)</li>
              <li>Maximum ZIP file size: 2GB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <UButton color="violet" @click="$emit('next')">
          Continue to Upload
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 ml-2" />
        </UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import JSZip from 'jszip'
import { generateCsvTemplate, getExampleFilePaths } from '~/utils/csv-parser'

defineEmits<{
  next: []
}>()

const isGenerating = ref(false)

const fieldGroups = [
  { label: 'Artist Fields', slot: 'artist-fields' },
  { label: 'Album Fields', slot: 'album-fields' },
  { label: 'Track Fields', slot: 'track-fields' },
  { label: 'Credit Fields', slot: 'credit-fields' },
]

const artistFields = [
  { name: 'artist_name', required: true, description: 'Artist or band name' },
  { name: 'artist_slug', required: false, description: 'URL slug (auto-generated if empty)' },
  { name: 'artist_bio', required: false, description: 'Artist biography' },
  { name: 'artist_location', required: false, description: 'Location (e.g., "Berlin, Germany")' },
  { name: 'artist_genres', required: false, description: 'Comma-separated genres (max 5)' },
  { name: 'artist_avatar', required: false, description: 'Path to avatar image in ZIP' },
]

const albumFields = [
  { name: 'album_title', required: true, description: 'Album title' },
  { name: 'album_type', required: false, description: 'album, ep, or single (default: album)' },
  { name: 'release_date', required: false, description: 'Release date (YYYY-MM-DD)' },
  { name: 'label_name', required: false, description: 'Record label name' },
  { name: 'upc', required: false, description: 'Album UPC code (12-13 digits)' },
  { name: 'cover_file', required: false, description: 'Path to cover image in ZIP' },
]

const trackFields = [
  { name: 'track_number', required: true, description: 'Track position in album (1, 2, 3...)' },
  { name: 'track_title', required: true, description: 'Track title' },
  { name: 'audio_file', required: true, description: 'Path to lossless audio file (WAV/FLAC/AIFF, max 300MB)' },
  { name: 'isrc', required: false, description: 'ISRC code (12 characters) - auto-generated if empty' },
  { name: 'iswc', required: false, description: 'ISWC code (T-XXXXXXXXX-X)' },
  { name: 'is_cover', required: false, description: 'true/false if this is a cover song' },
  { name: 'is_explicit', required: false, description: 'true/false if track has explicit content' },
  { name: 'duration_seconds', required: false, description: 'Duration (extracted from audio if empty)' },
]

const creditFields = [
  { name: 'composer', description: 'Composer name(s), comma-separated' },
  { name: 'lyricist', description: 'Lyricist name(s), comma-separated' },
  { name: 'producer', description: 'Producer name(s), comma-separated' },
  { name: 'performer', description: 'Featured performer(s), comma-separated' },
]

// Generate a minimal placeholder image (1x1 pixel PNG)
const createPlaceholderImage = (): Uint8Array => {
  // Minimal valid PNG (1x1 transparent pixel)
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ])
}

// Generate a minimal placeholder FLAC audio (empty FLAC header)
const createPlaceholderAudio = (): Uint8Array => {
  // Minimal valid FLAC file (just header, 1 sample at 44100Hz mono 16-bit)
  return new Uint8Array([
    0x66, 0x4c, 0x61, 0x43, // 'fLaC' magic
    0x80, 0x00, 0x00, 0x22, // STREAMINFO block (last block, 34 bytes)
    0x00, 0x10, 0x00, 0x10, // min/max block size: 16
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // min/max frame size: 0
    0x0a, 0xc4, 0x40, 0xf0, // sample rate (44100), channels (1), bits (16), samples hi
    0x00, 0x00, 0x00, 0x01, // total samples: 1
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // MD5: zeros (empty audio)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ])
}

const downloadExampleZip = async () => {
  isGenerating.value = true

  try {
    const zip = new JSZip()

    // Add the CSV file
    const csvContent = generateCsvTemplate()
    zip.file('catalog.csv', csvContent)

    // Add a README
    const readme = `Bulk Upload Template
====================

This ZIP contains:
- catalog.csv: The data file you need to edit with your artist/album/track info
- Example folder structure with placeholder files

Instructions:
1. Edit catalog.csv with your data (one row per track)
2. Replace placeholder audio files with your lossless audio (WAV, FLAC, or AIFF only)
3. Replace placeholder images (.jpg) with your cover art and artist avatars
4. Keep the same file paths as specified in the CSV
5. Upload the completed ZIP to FairStream

IMPORTANT: Only lossless audio formats are accepted (WAV, FLAC, AIFF). Max 300MB per file.
This ensures the highest quality for streaming and future hi-res audio support.

For help, visit: https://fairstream.fm/help/bulk-upload
`
    zip.file('README.txt', readme)

    // Add placeholder files
    const examplePaths = getExampleFilePaths()
    const imageData = createPlaceholderImage()
    const audioData = createPlaceholderAudio()

    for (const path of examplePaths) {
      const ext = path.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
        zip.file(path, imageData)
      } else if (['wav', 'flac', 'aif', 'aiff'].includes(ext || '')) {
        zip.file(path, audioData)
      }
    }

    // Generate and download
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-upload-template.zip'
    a.click()
    URL.revokeObjectURL(url)
  } finally {
    isGenerating.value = false
  }
}
</script>
