// Shared state and utilities for the upload wizard

export interface TrackCredit {
  role: 'composer' | 'author' | 'composer_author' | 'arranger' | 'interpreter' | 'producer' | 'mixing' | 'mastering' | 'publisher' | 'label' | 'cover_artist'
  name: string
  ipi_number: string
}

export interface TrackUpload {
  file: File
  title: string
  uploading: boolean
  uploaded: boolean
  progress: number
  error: string | null
  // Rights metadata
  isrc: string
  iswc: string
  is_cover: boolean
  spotify_track_id: string
  musicbrainz_work_id: string
  credits: TrackCredit[]
  // UI state
  showCredits: boolean
  fetchingIsrc: boolean
  fetchingIswc: boolean
}

export interface AlbumForm {
  title: string
  description: string
  release_type: 'album' | 'ep' | 'single'
  release_date: string
  label_name: string
}

export const useUploadWizard = () => {
  const toast = useToast()

  // Credit roles for dropdown
  const creditRoles = [
    { value: 'composer', label: 'Composer' },
    { value: 'author', label: 'Author' },
    { value: 'composer_author', label: 'Composer & Author' },
    { value: 'arranger', label: 'Arranger' },
    { value: 'interpreter', label: 'Interpreter' },
    { value: 'producer', label: 'Producer' },
    { value: 'mixing', label: 'Mixing' },
    { value: 'mastering', label: 'Mastering' },
    { value: 'publisher', label: 'Publisher' },
    { value: 'label', label: 'Label' },
    { value: 'cover_artist', label: 'Cover Artists' },
  ]

  const releaseTypes = [
    { value: 'album', label: 'Album' },
    { value: 'ep', label: 'EP' },
    { value: 'single', label: 'Single' },
  ]

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Get audio duration from file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration)
      })
      audio.addEventListener('error', () => {
        resolve(0)
      })
      audio.src = URL.createObjectURL(file)
    })
  }

  // Upload file with progress tracking
  const uploadFileWithProgress = (url: string, file: File, onProgress: (progress: number) => void): Promise<void> => {
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
          reject(new Error('Upload failed'))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Upload failed')))
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  // Upload and process cover image (resizes to 600x600)
  const uploadProcessedCover = async (file: File, bandId: string, albumId: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'cover')
    formData.append('key', `covers/${bandId}/${albumId}/cover.jpg`)

    const { key } = await $fetch<{ key: string }>('/api/upload/process-image', {
      method: 'POST',
      body: formData,
    })

    return key
  }

  // Create a new track upload object from a file
  const createTrackUpload = (file: File): TrackUpload => {
    // Generate title from filename
    const title = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/^\d+[\s._-]*/, '') // Remove leading track numbers
      .replace(/[_-]/g, ' ') // Replace underscores/dashes with spaces
      .trim()

    return {
      file,
      title: title || 'Untitled Track',
      uploading: false,
      uploaded: false,
      progress: 0,
      error: null,
      isrc: '',
      iswc: '',
      is_cover: false,
      spotify_track_id: '',
      musicbrainz_work_id: '',
      credits: [],
      showCredits: false,
      fetchingIsrc: false,
      fetchingIswc: false,
    }
  }

  return {
    toast,
    creditRoles,
    releaseTypes,
    formatFileSize,
    getAudioDuration,
    uploadFileWithProgress,
    uploadProcessedCover,
    createTrackUpload,
  }
}
