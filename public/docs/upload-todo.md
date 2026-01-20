# TODO: Bulk Upload for Labels

## Summary
Create a bulk upload feature for record labels to upload multiple artists and their releases without manually entering each one. Labels can prepare data in a spreadsheet (CSV) and upload it along with their media files.

---

## Feature Overview

### What Labels Need
Labels manage multiple artists and want to:
1. Create multiple artist profiles at once
2. Upload multiple albums/releases per artist
3. Include all track metadata (ISRC, credits, etc.)
4. Upload cover art and audio files in bulk

### Proposed Flow
1. Label prepares a CSV/spreadsheet with artist and release data
2. Label uploads CSV + a ZIP file containing all media (covers + audio)
3. System validates the data and file references
4. System creates artists, albums, and tracks in batch
5. Label reviews and confirms before publishing

---

## Data Format (CSV Structure)

### Flat CSV (One row per track)
```csv
artist_name,artist_slug,artist_bio,artist_location,artist_genres,album_title,album_type,release_date,label_name,upc,track_number,track_title,isrc,iswc,is_cover,duration_seconds,composer,lyricist,producer,cover_file,audio_file
"The Band",the-band,"Bio text here","Berlin, Germany","rock,indie",First Album,album,2024-01-15,My Label,123456789012,1,Opening Track,USRC12345678,,false,245,"John Doe","Jane Doe","Bob Smith",the-band/first-album/cover.jpg,the-band/first-album/01-opening-track.mp3
"The Band",the-band,,,,First Album,,,,,,2,Second Song,USRC12345679,,false,312,"John Doe",,,the-band/first-album/cover.jpg,the-band/first-album/02-second-song.mp3
```

---

## UI Flow
1. **New page**: `/dashboard/bulk-upload`
2. **Step 1**: Download CSV template with instructions
3. **Step 2**: Upload filled CSV → instant validation
4. **Step 3**: Upload ZIP with media files
5. **Step 4**: Validation preview - show what will be created
   - Resolve duplicate artists (add to existing or create new)
   - Show errors that must be fixed
   - Show warnings that can be ignored
6. **Step 5**: Processing with progress bar
7. **Step 6**: Results summary with links to created content

---

## Files to Create

| File | Purpose |
|------|---------|
| `pages/dashboard/bulk-upload.vue` | Main bulk upload page with wizard |
| `components/bulk-upload/TemplateStep.vue` | Download template + instructions |
| `components/bulk-upload/CsvUploadStep.vue` | Upload and parse CSV |
| `components/bulk-upload/MediaUploadStep.vue` | Upload ZIP file |
| `components/bulk-upload/ValidationStep.vue` | Preview, resolve duplicates, confirm |
| `components/bulk-upload/ProcessingStep.vue` | Progress bar during processing |
| `components/bulk-upload/ResultsStep.vue` | Summary with links to content |
| `composables/useBulkUpload.ts` | State management and validation |
| `server/api/bulk-upload/validate.post.ts` | Validate CSV + check duplicates |
| `server/api/bulk-upload/process.post.ts` | Process entire import |
| `utils/csv-parser.ts` | Client-side CSV parsing |

### Modified Files

| File | Change |
|------|--------|
| `pages/dashboard/index.vue` | Add "Bulk Upload" button/link |

---

## CSV Template Fields

### Required Fields
- `artist_name` - Artist/band name
- `album_title` - Album title
- `track_title` - Track title
- `track_number` - Position in album
- `audio_file` - Path to audio in ZIP (e.g., `artist-slug/album-slug/01-track.mp3`)

### Optional Artist Fields
- `artist_slug` - URL slug (auto-generated if empty)
- `artist_bio` - Biography
- `artist_location` - Location
- `artist_genres` - Comma-separated genres (max 5)
- `artist_avatar` - Path to avatar image in ZIP

### Optional Album Fields
- `album_type` - album, ep, or single (default: album)
- `release_date` - YYYY-MM-DD format
- `label_name` - Label name (default: artist name)
- `upc` - Album UPC code
- `cover_file` - Path to cover in ZIP

### Optional Track Fields
- `isrc` - ISRC code
- `iswc` - ISWC code
- `is_cover` - true/false
- `is_explicit` - true/false
- `duration_seconds` - Duration (extracted from audio if not provided)

### Credit Fields (comma-separated or separate columns)
- `composer` - Composer name(s)
- `lyricist` - Lyricist name(s)
- `producer` - Producer name(s)
- `performer` - Featured performer(s)

---

## ZIP File Structure

```
bulk-upload.zip
├── artist-slug-1/
│   ├── avatar.jpg (optional)
│   ├── album-slug-1/
│   │   ├── cover.jpg
│   │   ├── 01-track-one.mp3
│   │   ├── 02-track-two.mp3
│   │   └── 03-track-three.mp3
│   └── album-slug-2/
│       ├── cover.jpg
│       └── 01-single-track.mp3
└── artist-slug-2/
    ├── avatar.png
    └── debut-album/
        ├── cover.jpg
        ├── 01-intro.mp3
        └── 02-main-song.mp3
```

---

## Processing Logic

### Validation Phase
1. Parse CSV, check required fields
2. Validate artist slugs are unique (or will be created)
3. Validate file references exist in ZIP
4. Check for duplicate tracks (same ISRC)
5. Validate ISRC format if provided
6. Return validation report with errors/warnings

### Import Phase
1. Extract ZIP to temp directory
2. Group rows by artist, then by album
3. For each artist:
   - Create or find existing artist by slug
   - Upload avatar if provided
4. For each album:
   - Create album record
   - Upload cover art
   - Generate P-line and C-line
5. For each track:
   - Create track record
   - Upload audio file
   - Extract duration from audio
   - Add credits
6. Mark albums as published
7. Clean up temp files
8. Return summary report

---

## Scale: Small to Medium Imports (10-50 tracks)

- **Synchronous processing**: Process during the request (simpler implementation)
- **Single ZIP upload**: Standard file upload, max 500MB
- **Client-side progress**: Show progress bar during processing
- **No background jobs**: Everything happens in one request

---

## Duplicate Artist Handling

When CSV contains an artist that already exists (matching slug):

1. **Detection**: Check if artist_slug exists in database during validation
2. **User choice**: Show dialog asking what to do for each duplicate:
   - "Add albums to existing artist"
   - "Create new artist with different slug"
   - "Skip this artist"
3. **Batch choice**: Option to "Apply to all duplicates"

---

## Security Considerations

1. **File size limits**: Max ZIP size 500MB (sufficient for ~50 tracks)
2. **File type validation**: Only allow expected audio/image formats
3. **Rate limiting**: Max 5 bulk uploads per day per user
4. **Temp file cleanup**: Clean up immediately after processing
5. **Authorization**: Require authenticated user

---

## Access Control

**MVP: Available to all authenticated users**
- Any user with an account can use bulk upload
- No special "label" role needed initially
- Rate limiting prevents abuse

---

## Future Enhancements (Not in MVP)

- Excel (XLSX) support with multiple sheets
- Drag-and-drop folder upload instead of ZIP
- Background processing for very large imports (200+ tracks)
- Import history and re-import capability
- API endpoint for programmatic bulk upload
