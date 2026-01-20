// Shared state and utilities for the upload wizard
// Uses useState to persist data across step navigation

import type { Band } from '~/composables/useBand'
import type { Album } from '~/composables/useAlbum'

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

// Persistent state for the upload wizard (survives step navigation)
export interface UploadWizardState {
  step: number
  selectedBand: Band | null
  albumForm: AlbumForm
  coverFile: File | null
  coverPreview: string | null
  tracks: TrackUpload[]
  createdAlbum: Album | null
  uploading: boolean
  // Rights confirmations from TracksStep
  rightsConfirmed: boolean
  aiDeclaration: boolean
  originalContentConfirmed: boolean
  falseInfoUnderstood: boolean
  // Copied credits for paste functionality
  copiedCredits: TrackCredit[] | null
}

const defaultAlbumForm = (): AlbumForm => ({
  title: '',
  description: '',
  release_type: 'album',
  release_date: '',
  label_name: '',
})

const defaultState = (): UploadWizardState => ({
  step: 1,
  selectedBand: null,
  albumForm: defaultAlbumForm(),
  coverFile: null,
  coverPreview: null,
  tracks: [],
  createdAlbum: null,
  uploading: false,
  rightsConfirmed: false,
  aiDeclaration: false,
  originalContentConfirmed: false,
  falseInfoUnderstood: false,
  copiedCredits: null,
})

export const useUploadWizard = () => {
  const toast = useToast()

  // Persistent state using useState (survives component unmount/remount)
  const state = useState<UploadWizardState>('upload-wizard-state', defaultState)

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

  // Set cover file and generate preview
  const setCoverFile = (file: File) => {
    state.value.coverFile = file
    state.value.coverPreview = URL.createObjectURL(file)
  }

  // Clear cover file
  const clearCoverFile = () => {
    state.value.coverFile = null
    state.value.coverPreview = null
  }

  // Add audio files as tracks
  const addAudioFiles = (files: File[]) => {
    for (const file of files) {
      state.value.tracks.push(createTrackUpload(file))
    }
  }

  // Remove a track
  const removeTrack = (index: number) => {
    state.value.tracks.splice(index, 1)
  }

  // Reorder tracks
  const reorderTracks = (fromIndex: number, toIndex: number) => {
    const track = state.value.tracks[fromIndex]
    state.value.tracks.splice(fromIndex, 1)
    state.value.tracks.splice(toIndex, 0, track)
  }

  // Credit management
  const addCredit = (trackIndex: number) => {
    state.value.tracks[trackIndex].credits.push({
      role: 'composer',
      name: '',
      ipi_number: '',
    })
    state.value.tracks[trackIndex].showCredits = true
  }

  const removeCredit = (trackIndex: number, creditIndex: number) => {
    state.value.tracks[trackIndex].credits.splice(creditIndex, 1)
  }

  const copyCredits = (trackIndex: number) => {
    const track = state.value.tracks[trackIndex]
    state.value.copiedCredits = JSON.parse(JSON.stringify(track.credits))
  }

  const pasteCredits = (trackIndex: number) => {
    if (!state.value.copiedCredits) return
    const track = state.value.tracks[trackIndex]
    for (const credit of state.value.copiedCredits) {
      track.credits.push({ ...credit })
    }
    track.showCredits = true
  }

  // Reset all wizard state
  const resetWizard = () => {
    state.value = defaultState()
  }

  return {
    // State
    state,
    // Constants
    toast,
    creditRoles,
    releaseTypes,
    // Utilities
    formatFileSize,
    getAudioDuration,
    uploadFileWithProgress,
    uploadProcessedCover,
    createTrackUpload,
    // State management
    setCoverFile,
    clearCoverFile,
    addAudioFiles,
    removeTrack,
    reorderTracks,
    addCredit,
    removeCredit,
    copyCredits,
    pasteCredits,
    resetWizard,
  }
}
