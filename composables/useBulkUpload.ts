// Composable for managing bulk upload state
// Handles ZIP file with CSV + media, validation, and import processing

import JSZip from 'jszip'
import type {
  CsvValidationError,
  CsvParseResult,
} from '~/utils/csv-parser'

export interface BulkUploadState {
  step: number
  // CSV data (extracted from ZIP)
  csvContent: string
  parseResult: CsvParseResult | null
  // ZIP data (contains catalog.csv + media files)
  zipFile: File | null
  zipFileList: string[] // List of files in the ZIP (excluding CSV)
  zipRootPrefix: string // Prefix for nested folder structure (e.g., "folder-name/")
  // Validation
  serverValidation: ServerValidationResult | null
  // Processing
  processing: boolean
  processProgress: number
  processStatus: string
  // Results
  results: BulkUploadResults | null
  error: string | null
}

export interface ServerValidationResult {
  valid: boolean
  duplicateArtists: DuplicateArtist[]
  missingFiles: string[]
  existingIsrcs: string[]
  errors: CsvValidationError[]
  warnings: CsvValidationError[]
}

export interface DuplicateArtist {
  csvSlug: string
  csvName: string
  existingId: string
  existingName: string
  action: 'create' | 'use_existing' | 'skip'
}

export interface BulkUploadResults {
  success: boolean
  artistsCreated: number
  albumsCreated: number
  tracksCreated: number
  errors: string[]
  createdArtists: { id: string; name: string; slug: string }[]
  createdAlbums: { id: string; title: string; artistName: string }[]
}

const defaultState = (): BulkUploadState => ({
  step: 1,
  csvContent: '',
  parseResult: null,
  zipFile: null,
  zipFileList: [],
  zipRootPrefix: '',
  serverValidation: null,
  processing: false,
  processProgress: 0,
  processStatus: '',
  results: null,
  error: null,
})

// CSV file names to look for in the ZIP (in order of preference)
const CSV_FILE_NAMES = ['catalog.csv', 'data.csv', 'import.csv', 'tracks.csv']

// Maximum ZIP file size (2GB - we now upload to R2 first, so no browser memory constraint)
const MAX_ZIP_FILE_SIZE = 2 * 1024 * 1024 * 1024 // 2GB

export const useBulkUpload = () => {
  const toast = useToast()

  // Persistent state using useState
  const state = useState<BulkUploadState>('bulk-upload-state', defaultState)

  // Step names for progress indicator (simplified to 5 steps)
  const steps = [
    { number: 1, name: 'Template', description: 'Download template' },
    { number: 2, name: 'Upload', description: 'Upload ZIP' },
    { number: 3, name: 'Review', description: 'Validate & confirm' },
    { number: 4, name: 'Processing', description: 'Importing' },
    { number: 5, name: 'Complete', description: 'Results' },
  ]

  // Navigate to a specific step
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      state.value.step = step
    }
  }

  // Set ZIP file, extract CSV, and parse it
  // For large files, we use a memory-efficient approach
  const setZipFileWithCsv = async (file: File) => {
    state.value.zipFile = file
    state.value.error = null
    state.value.csvContent = ''
    state.value.parseResult = null
    state.value.zipFileList = []

    // Check file size limit
    if (file.size > MAX_ZIP_FILE_SIZE) {
      state.value.error = `ZIP file is too large (${formatFileSize(file.size)}). Maximum size is 2GB.`
      toast.add({
        title: 'ZIP file too large',
        description: 'Maximum size is 2GB.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return
    }

    try {
      // Load ZIP file - JSZip reads the central directory first which is efficient
      // For very large files (>500MB), show a warning that loading may take time
      if (file.size > 500 * 1024 * 1024) {
        toast.add({
          title: 'Processing large file',
          description: 'This may take a moment for large ZIP files...',
          color: 'blue',
          icon: 'i-heroicons-clock',
          timeout: 3000,
        })
      }

      // JSZip imported at top of file
      // Load with optimized settings - don't decompress until needed
      const zip = await JSZip.loadAsync(file, {
        // Only load file metadata, not content
        createFolders: false,
      })

      // Find the CSV file (handles nested folders)
      let csvFile: any = null
      let csvFileName = ''
      let rootPrefix = '' // Track if files are in a nested folder

      // Look for CSV files (case-insensitive, handle nested folders)
      for (const name of CSV_FILE_NAMES) {
        // Try exact match at root
        if (zip.files[name]) {
          csvFile = zip.files[name]
          csvFileName = name
          break
        }
        // Search all files for CSV (handles nested folders and case-insensitive)
        for (const [fileName, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue
          const lowerName = fileName.toLowerCase()
          // Check if this is a CSV we're looking for (at any level)
          if (lowerName === name || lowerName.endsWith('/' + name)) {
            csvFile = zipEntry
            csvFileName = fileName
            // Extract root prefix if nested (e.g., "bulk-upload-template (1)/catalog.csv" -> "bulk-upload-template (1)/")
            const slashIndex = fileName.lastIndexOf('/')
            if (slashIndex > 0) {
              rootPrefix = fileName.substring(0, slashIndex + 1)
            }
            break
          }
        }
        if (csvFile) break
      }

      if (!csvFile) {
        state.value.error = 'No catalog.csv found in ZIP file'
        toast.add({
          title: 'CSV not found',
          description: 'ZIP file must contain a catalog.csv file at the root level',
          color: 'red',
          icon: 'i-heroicons-exclamation-triangle',
        })
        return
      }

      // Extract CSV content
      const csvContent = await csvFile.async('text')
      state.value.csvContent = csvContent

      // Build file list (excluding CSV and common non-media files)
      // Strip root prefix if files are nested
      const fileList: string[] = []
      const excludePatterns = [/^__macosx/i, /\.ds_store$/i, /thumbs\.db$/i, /\.txt$/i, /\.csv$/i]

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
          const shouldExclude = excludePatterns.some((pattern) => pattern.test(relativePath))
          if (!shouldExclude) {
            // Strip root prefix if present
            let normalizedPath = relativePath
            if (rootPrefix && relativePath.startsWith(rootPrefix)) {
              normalizedPath = relativePath.substring(rootPrefix.length)
            }
            if (normalizedPath) {
              fileList.push(normalizedPath)
            }
          }
        }
      })

      state.value.zipFileList = fileList

      // Store root prefix for later use in processing
      state.value.zipRootPrefix = rootPrefix

      // Parse CSV
      const { parseCsv, validateAndTransformCsv } = await import('~/utils/csv-parser')
      const rows = parseCsv(csvContent)
      const result = validateAndTransformCsv(rows)

      state.value.parseResult = result

      if (result.errors.length > 0) {
        toast.add({
          title: 'CSV has errors',
          description: `Found ${result.errors.length} error(s) that need to be fixed`,
          color: 'red',
          icon: 'i-heroicons-exclamation-triangle',
        })
      } else {
        toast.add({
          title: 'ZIP processed successfully',
          description: `Found ${result.artists.length} artist(s), ${result.artists.reduce((sum, a) => sum + a.albums.length, 0)} album(s), ${result.rowCount} track(s)`,
          color: 'green',
          icon: 'i-heroicons-check-circle',
        })
      }
    } catch (e: any) {
      state.value.error = e.message || 'Failed to process ZIP file'
      toast.add({
        title: 'Failed to process ZIP',
        description: state.value.error,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      })
    }
  }

  // Clear all upload data
  const clearBulkUpload = () => {
    state.value.zipFile = null
    state.value.zipFileList = []
    state.value.zipRootPrefix = ''
    state.value.csvContent = ''
    state.value.parseResult = null
    state.value.serverValidation = null
    state.value.error = null
  }

  // Check if all referenced files exist in the ZIP
  const validateFileReferences = (): string[] => {
    const missing: string[] = []
    if (!state.value.parseResult || !state.value.zipFileList.length) return missing

    const zipFiles = new Set(state.value.zipFileList.map((f) => f.toLowerCase()))

    for (const artist of state.value.parseResult.artists) {
      if (artist.avatarPath && !zipFiles.has(artist.avatarPath.toLowerCase())) {
        missing.push(artist.avatarPath)
      }

      for (const album of artist.albums) {
        if (album.coverPath && !zipFiles.has(album.coverPath.toLowerCase())) {
          missing.push(album.coverPath)
        }

        for (const track of album.tracks) {
          if (!zipFiles.has(track.audioPath.toLowerCase())) {
            missing.push(track.audioPath)
          }
        }
      }
    }

    return [...new Set(missing)]
  }

  // Validate with server (check duplicates, existing ISRCs, etc.)
  const validateWithServer = async (): Promise<boolean> => {
    if (!state.value.parseResult) return false

    try {
      const result = await $fetch<ServerValidationResult>('/api/bulk-upload/validate', {
        method: 'POST',
        body: {
          artists: state.value.parseResult.artists,
          zipFiles: state.value.zipFileList,
        },
      })

      state.value.serverValidation = result
      return result.valid
    } catch (e: any) {
      state.value.error = e.data?.message || e.message || 'Validation failed'
      toast.add({
        title: 'Validation failed',
        description: state.value.error,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return false
    }
  }

  // Set action for a duplicate artist
  const setDuplicateArtistAction = (slug: string, action: 'create' | 'use_existing' | 'skip') => {
    if (!state.value.serverValidation) return

    const duplicate = state.value.serverValidation.duplicateArtists.find((d) => d.csvSlug === slug)
    if (duplicate) {
      duplicate.action = action
    }

    // Also update in parseResult
    if (state.value.parseResult) {
      const artist = state.value.parseResult.artists.find((a) => a.slug === slug)
      if (artist) {
        artist.action = action
        if (action === 'use_existing' && duplicate) {
          artist.existingId = duplicate.existingId
        }
      }
    }
  }

  // Upload file with progress tracking using XHR
  const uploadWithProgress = (url: string, file: File, onProgress: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed')))
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', 'application/zip')
      xhr.send(file)
    })
  }

  // Process the bulk upload using R2 for large file handling
  const processUpload = async (): Promise<boolean> => {
    if (!state.value.parseResult || !state.value.zipFile) return false

    state.value.processing = true
    state.value.processProgress = 0
    state.value.processStatus = 'Preparing upload...'
    state.value.error = null

    try {
      // Step 1: Get presigned URL for uploading ZIP to R2
      state.value.processStatus = 'Getting upload URL...'
      const { uploadUrl, key: zipKey } = await $fetch<{ uploadUrl: string; key: string }>('/api/bulk-upload/presign-zip', {
        method: 'POST',
        body: {
          filename: state.value.zipFile.name,
          fileSize: state.value.zipFile.size,
        },
      })

      // Step 2: Upload ZIP to R2 with progress tracking
      state.value.processStatus = 'Uploading ZIP file...'
      await uploadWithProgress(uploadUrl, state.value.zipFile, (progress) => {
        // Upload is 0-50% of total progress
        state.value.processProgress = Math.round(progress * 0.5)
      })

      state.value.processProgress = 50
      state.value.processStatus = 'Processing files...'

      // Step 3: Trigger server-side processing from R2
      const results = await $fetch<BulkUploadResults>('/api/bulk-upload/process-from-r2', {
        method: 'POST',
        body: {
          zipKey,
          artists: state.value.parseResult.artists,
          duplicateActions: state.value.serverValidation?.duplicateArtists?.map((d) => ({
            slug: d.csvSlug,
            action: d.action,
            existingId: d.existingId,
          })),
          rootPrefix: state.value.zipRootPrefix || undefined,
        },
      })

      state.value.results = results
      state.value.processProgress = 100
      state.value.processStatus = 'Complete!'

      if (results.success) {
        toast.add({
          title: 'Import complete!',
          description: `Created ${results.artistsCreated} artist(s), ${results.albumsCreated} album(s), ${results.tracksCreated} track(s)`,
          color: 'green',
          icon: 'i-heroicons-check-circle',
        })
      } else {
        toast.add({
          title: 'Import completed with errors',
          description: `${results.errors.length} error(s) occurred`,
          color: 'orange',
          icon: 'i-heroicons-exclamation-triangle',
        })
      }

      return results.success
    } catch (e: any) {
      state.value.error = e.data?.message || e.message || 'Import failed'
      toast.add({
        title: 'Import failed',
        description: state.value.error,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return false
    } finally {
      state.value.processing = false
    }
  }

  // Calculate summary stats
  const summary = computed(() => {
    if (!state.value.parseResult) {
      return { artists: 0, albums: 0, tracks: 0 }
    }

    const artists = state.value.parseResult.artists.length
    const albums = state.value.parseResult.artists.reduce((sum, a) => sum + a.albums.length, 0)
    const tracks = state.value.parseResult.artists.reduce(
      (sum, a) => sum + a.albums.reduce((s, al) => s + al.tracks.length, 0),
      0
    )

    return { artists, albums, tracks }
  })

  // Check if can proceed to next step
  const canProceed = computed(() => {
    switch (state.value.step) {
      case 1:
        return true // Template step - always can proceed
      case 2:
        // Upload step - need valid ZIP with parsed CSV and no missing files
        return (
          state.value.zipFile &&
          state.value.parseResult &&
          state.value.parseResult.errors.length === 0 &&
          validateFileReferences().length === 0
        )
      case 3:
        return state.value.serverValidation?.valid
      case 4:
        return !state.value.processing
      default:
        return true
    }
  })

  // Reset all state
  const resetBulkUpload = () => {
    state.value = defaultState()
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return {
    state,
    steps,
    summary,
    canProceed,
    // Actions
    goToStep,
    setZipFileWithCsv,
    clearBulkUpload,
    validateFileReferences,
    validateWithServer,
    setDuplicateArtistAction,
    processUpload,
    resetBulkUpload,
    // Utilities
    formatFileSize,
    toast,
  }
}
