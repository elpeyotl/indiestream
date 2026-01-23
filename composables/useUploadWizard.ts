// Shared state and utilities for the upload wizard
// Uses useState to persist data across step navigation

import type { Band } from '~/stores/band'
import type { Album, Track } from '~/stores/album'

// Form interface for track credits in the upload wizard (different from DB TrackCredit)
export interface TrackCreditForm {
  role: 'composer' | 'author' | 'composer_author' | 'arranger' | 'interpreter' | 'producer' | 'mixing' | 'mastering' | 'publisher' | 'label'
  name: string
  ipi_number: string
}

export interface TrackUpload {
  id?: string // Existing track ID (for edit mode)
  file: File | null // Null for existing tracks in edit mode
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
  credits: TrackCreditForm[]
  lyrics_language: string // 'instrumental' or ISO 639-1 language code
  // Platform ISRC
  isrc_platform_assigned: boolean
  generatingIsrc: boolean
  // UI state
  showCredits: boolean
  fetchingIsrc: boolean
  fetchingIswc: boolean
  // Edit mode
  audioKey?: string // Existing audio key
  duration?: number // Existing duration
}

export interface AlbumForm {
  title: string
  description: string
  release_type: 'album' | 'ep' | 'single'
  release_date: string
  label_name: string
  p_line: string
  c_line: string
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
  copiedCredits: TrackCreditForm[] | null
  // Edit mode
  isEditMode: boolean
  editAlbumId: string | null
}

const defaultAlbumForm = (): AlbumForm => ({
  title: '',
  description: '',
  release_type: 'album',
  release_date: '',
  label_name: '',
  p_line: '',
  c_line: '',
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
  isEditMode: false,
  editAlbumId: null,
})

// Audio format validation constants
const LOSSLESS_MIME_TYPES = ['audio/wav', 'audio/flac', 'audio/aiff', 'audio/x-aiff']
const LOSSLESS_EXTENSIONS = ['wav', 'flac', 'aif', 'aiff']
const MAX_AUDIO_FILE_SIZE = 300 * 1024 * 1024 // 300MB

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
    { value: 'mixing', label: 'Mixing Engineer' },
    { value: 'mastering', label: 'Mastering Engineer' },
    { value: 'publisher', label: 'Publisher' },
    { value: 'label', label: 'Label' },
  ]

  // Lyrics language options (ISO 639-1 codes + instrumental)
  const lyricsLanguages = [
    { value: '', label: 'Select language...' },
    { value: 'instrumental', label: 'Instrumental (no lyrics)' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'German (Deutsch)' },
    { value: 'fr', label: 'French (Français)' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'it', label: 'Italian (Italiano)' },
    { value: 'pt', label: 'Portuguese (Português)' },
    { value: 'nl', label: 'Dutch (Nederlands)' },
    { value: 'pl', label: 'Polish (Polski)' },
    { value: 'ru', label: 'Russian (Русский)' },
    { value: 'ja', label: 'Japanese (日本語)' },
    { value: 'ko', label: 'Korean (한국어)' },
    { value: 'zh', label: 'Chinese (中文)' },
    { value: 'ar', label: 'Arabic (العربية)' },
    { value: 'hi', label: 'Hindi (हिन्दी)' },
    { value: 'sv', label: 'Swedish (Svenska)' },
    { value: 'no', label: 'Norwegian (Norsk)' },
    { value: 'da', label: 'Danish (Dansk)' },
    { value: 'fi', label: 'Finnish (Suomi)' },
    { value: 'tr', label: 'Turkish (Türkçe)' },
    { value: 'other', label: 'Other' },
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
      lyrics_language: '',
      isrc_platform_assigned: false,
      generatingIsrc: false,
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

  // Validate audio file format and size
  const isValidAudioFile = (file: File): { valid: boolean; error?: string } => {
    // Check MIME type or extension
    const ext = file.name.split('.').pop()?.toLowerCase()
    const isLosslessMime = LOSSLESS_MIME_TYPES.includes(file.type)
    const isLosslessExt = LOSSLESS_EXTENSIONS.includes(ext || '')

    if (!isLosslessMime && !isLosslessExt) {
      return { valid: false, error: `"${file.name}" is not a lossless format. Please use WAV, FLAC, or AIFF.` }
    }

    if (file.size > MAX_AUDIO_FILE_SIZE) {
      return { valid: false, error: `"${file.name}" exceeds 300MB limit.` }
    }

    return { valid: true }
  }

  // Add audio files as tracks
  const addAudioFiles = (files: File[]) => {
    const errors: string[] = []

    for (const file of files) {
      const validation = isValidAudioFile(file)
      if (validation.valid) {
        state.value.tracks.push(createTrackUpload(file))
      } else {
        errors.push(validation.error!)
      }
    }

    if (errors.length > 0) {
      toast.add({
        title: 'Invalid files',
        description: errors.join('\n'),
        color: 'red',
        timeout: 8000,
      })
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

  // Load an existing album for editing
  const loadAlbumForEdit = async (
    album: Album & { tracks?: Track[] },
    band: Band,
    coverUrl: string | null,
    trackCredits: Record<string, TrackCreditForm[]>
  ) => {
    // Map existing tracks to TrackUpload format
    const trackUploads: TrackUpload[] = (album.tracks || []).map((track) => {
      const credits = trackCredits[track.id] || []
      return {
        id: track.id,
        file: null, // Existing tracks don't have files
        title: track.title,
        uploading: false,
        uploaded: true, // Already uploaded
        progress: 100,
        error: null,
        isrc: track.isrc || '',
        iswc: track.iswc || '',
        is_cover: track.is_cover || false,
        spotify_track_id: track.spotify_track_id || '',
        musicbrainz_work_id: track.musicbrainz_work_id || '',
        credits: credits.map((c) => ({
          role: c.role as TrackCreditForm['role'],
          name: c.name,
          ipi_number: c.ipi_number || '',
        })),
        lyrics_language: (track as any).lyrics_language || '',
        isrc_platform_assigned: track.isrc_platform_assigned || false,
        generatingIsrc: false,
        showCredits: credits.length > 0,
        fetchingIsrc: false,
        fetchingIswc: false,
        audioKey: track.audio_key || undefined,
        duration: track.duration_seconds || undefined,
      }
    })

    // Set the wizard state for edit mode
    state.value = {
      step: 1,
      selectedBand: band,
      albumForm: {
        title: album.title,
        description: album.description || '',
        release_type: album.release_type === 'compilation' ? 'album' : album.release_type,
        release_date: album.release_date || '',
        label_name: album.label_name || '',
        p_line: album.p_line || '',
        c_line: album.c_line || '',
      },
      coverFile: null, // Will use existing cover unless changed
      coverPreview: coverUrl,
      tracks: trackUploads,
      createdAlbum: album,
      uploading: false,
      rightsConfirmed: album.rights_confirmed || false,
      aiDeclaration: false,
      originalContentConfirmed: false,
      falseInfoUnderstood: false,
      copiedCredits: null,
      isEditMode: true,
      editAlbumId: album.id,
    }
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
    lyricsLanguages,
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
    loadAlbumForEdit,
    resetWizard,
  }
}
