// Global audio player composable for Indiestream
import type { Track, Album } from './useAlbum'

export interface PlayerTrack {
  id: string
  title: string
  artist: string
  artistSlug: string
  albumTitle: string
  albumSlug: string
  coverUrl: string | null
  audioUrl: string
  duration: number
}

interface PlayerState {
  currentTrack: PlayerTrack | null
  queue: PlayerTrack[]
  queueIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  // Stream tracking
  streamRecorded: boolean
  trackStartTime: number
  // Preview mode for non-logged-in users
  isPreviewMode: boolean
  previewEnded: boolean
  // Audio analyser data for visualizations
  audioData: Uint8Array | null
}

// Preview limit in seconds for non-logged-in users
const PREVIEW_LIMIT_SECONDS = 30

const state = reactive<PlayerState>({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isLoading: false,
  streamRecorded: false,
  trackStartTime: 0,
  isPreviewMode: false,
  previewEnded: false,
  audioData: null,
})

let audio: HTMLAudioElement | null = null

// Audio context and analyser for visualizations
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let analyserAnimationId: number | null = null

// Track total listening time across tracks
let listeningStartTime = 0

export const usePlayer = () => {
  const { getStreamUrl } = useAlbum()
  const user = useSupabaseUser()

  // Record a stream to the backend
  const recordStream = async (trackId: string, durationSeconds: number) => {
    if (!user.value) return // Only record for logged-in users
    if (state.streamRecorded) return // Already recorded this track

    try {
      await $fetch('/api/streams/record', {
        method: 'POST',
        body: {
          trackId,
          durationSeconds,
        },
      })
      state.streamRecorded = true
    } catch (e) {
      console.error('Failed to record stream:', e)
    }
  }

  // Check if we've listened long enough to count as a stream (30 seconds)
  const checkAndRecordStream = () => {
    if (!state.currentTrack || state.streamRecorded) return
    if (state.currentTime >= 30) {
      recordStream(state.currentTrack.id, Math.floor(state.currentTime))
    }
  }

  // Reset stream tracking for new track
  const resetStreamTracking = () => {
    state.streamRecorded = false
    state.trackStartTime = Date.now()
    state.previewEnded = false
    // Set preview mode based on user login status
    state.isPreviewMode = !user.value
  }

  // Check and enforce preview limit for non-logged-in users
  const checkPreviewLimit = () => {
    if (!state.isPreviewMode || state.previewEnded) return
    if (state.currentTime >= PREVIEW_LIMIT_SECONDS) {
      // Stop playback at preview limit
      if (audio) {
        audio.pause()
      }
      state.previewEnded = true
      state.isPlaying = false
    }
  }

  // Initialize audio analyser for visualizations
  const initAudioAnalyser = () => {
    if (!audio || audioContext) return

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      sourceNode = audioContext.createMediaElementSource(audio)
      sourceNode.connect(analyser)
      analyser.connect(audioContext.destination)

      // Initialize the audio data array
      state.audioData = new Uint8Array(analyser.frequencyBinCount)

      // Start the analyser update loop
      const updateAnalyser = () => {
        if (analyser && state.audioData) {
          analyser.getByteFrequencyData(state.audioData as Uint8Array)
        }
        analyserAnimationId = requestAnimationFrame(updateAnalyser)
      }
      updateAnalyser()
    } catch (e) {
      console.error('Failed to initialize audio analyser:', e)
    }
  }

  // Initialize audio element (client-side only)
  const initAudio = () => {
    if (import.meta.server) return
    if (audio) return

    audio = new Audio()
    audio.volume = state.volume
    audio.crossOrigin = 'anonymous' // Required for audio analyser

    audio.addEventListener('timeupdate', () => {
      state.currentTime = audio!.currentTime
      // Check if we should record the stream (after 30 seconds)
      checkAndRecordStream()
      // Check preview limit for non-logged-in users
      checkPreviewLimit()
    })

    audio.addEventListener('durationchange', () => {
      state.duration = audio!.duration
    })

    audio.addEventListener('ended', () => {
      playNext()
    })

    audio.addEventListener('play', () => {
      state.isPlaying = true
      listeningStartTime = Date.now()
    })

    audio.addEventListener('pause', () => {
      state.isPlaying = false
    })

    audio.addEventListener('ended', () => {
      // Record final listening duration when track ends naturally
      if (state.currentTrack && !state.streamRecorded) {
        recordStream(state.currentTrack.id, Math.floor(state.currentTime))
      }
    })

    audio.addEventListener('waiting', () => {
      state.isLoading = true
    })

    audio.addEventListener('canplay', () => {
      state.isLoading = false
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      state.isLoading = false
      state.isPlaying = false
    })
  }

  // Play a single track
  const playTrack = async (
    track: Track,
    album: Album,
    coverUrl: string | null
  ) => {
    initAudio()
    if (!audio || !track.audio_key) return

    // Initialize audio analyser on first play
    initAudioAnalyser()

    // Reset tracking for new track
    resetStreamTracking()
    state.isLoading = true

    try {
      const audioUrl = await getStreamUrl(track.audio_key)

      const playerTrack: PlayerTrack = {
        id: track.id,
        title: track.title,
        artist: album.band?.name || 'Unknown Artist',
        artistSlug: album.band?.slug || '',
        albumTitle: album.title,
        albumSlug: album.slug,
        coverUrl,
        audioUrl,
        duration: track.duration_seconds,
      }

      state.currentTrack = playerTrack
      audio.src = audioUrl
      await audio.play()
    } catch (e) {
      console.error('Failed to play track:', e)
      state.isLoading = false
    }
  }

  // Play album from specific track
  const playAlbum = async (
    album: Album,
    coverUrl: string | null,
    startIndex = 0
  ) => {
    initAudio()
    if (!audio || !album.tracks?.length) return

    // Initialize audio analyser on first play
    initAudioAnalyser()

    // Build queue from album tracks
    const tracks = album.tracks.filter(t => t.audio_key)
    if (tracks.length === 0) return

    state.queue = []
    state.queueIndex = startIndex

    // Load all track URLs
    for (const track of tracks) {
      try {
        const audioUrl = await getStreamUrl(track.audio_key!)
        state.queue.push({
          id: track.id,
          title: track.title,
          artist: album.band?.name || 'Unknown Artist',
          artistSlug: album.band?.slug || '',
          albumTitle: album.title,
          albumSlug: album.slug,
          coverUrl,
          audioUrl,
          duration: track.duration_seconds,
        })
      } catch (e) {
        console.error('Failed to load track URL:', e)
      }
    }

    // Play the starting track
    if (state.queue.length > 0 && state.queue[startIndex]) {
      await playFromQueue(startIndex)
    }
  }

  // Play from queue at index
  const playFromQueue = async (index: number) => {
    if (!audio || index < 0 || index >= state.queue.length) return

    // Reset stream tracking for the new track
    resetStreamTracking()

    state.queueIndex = index
    state.currentTrack = state.queue[index]
    state.isLoading = true

    try {
      audio.src = state.currentTrack.audioUrl
      await audio.play()
    } catch (e) {
      console.error('Failed to play from queue:', e)
      state.isLoading = false
    }
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (!audio) return

    if (state.isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  // Play next track
  const playNext = () => {
    if (state.queueIndex < state.queue.length - 1) {
      playFromQueue(state.queueIndex + 1)
    } else {
      // End of queue
      state.isPlaying = false
    }
  }

  // Play previous track
  const playPrevious = () => {
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }

    if (state.queueIndex > 0) {
      playFromQueue(state.queueIndex - 1)
    }
  }

  // Seek to position
  const seek = (time: number) => {
    if (!audio) return
    // Prevent seeking past preview limit for non-logged-in users
    if (state.isPreviewMode && time >= PREVIEW_LIMIT_SECONDS) {
      time = PREVIEW_LIMIT_SECONDS - 1
    }
    audio.currentTime = time
  }

  // Set volume
  const setVolume = (volume: number) => {
    state.volume = Math.max(0, Math.min(1, volume))
    if (audio) {
      audio.volume = state.volume
    }
    if (state.volume > 0) {
      state.isMuted = false
    }
  }

  // Toggle mute
  const toggleMute = () => {
    state.isMuted = !state.isMuted
    if (audio) {
      audio.volume = state.isMuted ? 0 : state.volume
    }
  }

  // Play a single track from library (liked tracks)
  const playTrackFromLibrary = async (
    track: {
      id: string
      title: string
      duration_seconds: number
      audio_key: string | null
      album: {
        id: string
        title: string
        slug: string
        band: {
          id: string
          name: string
          slug: string
        }
      }
    },
    coverUrl: string | null
  ) => {
    initAudio()
    if (!audio || !track.audio_key) return

    // Initialize audio analyser on first play
    initAudioAnalyser()

    // Reset tracking for new track
    resetStreamTracking()
    state.isLoading = true

    try {
      const audioUrl = await getStreamUrl(track.audio_key)

      const playerTrack: PlayerTrack = {
        id: track.id,
        title: track.title,
        artist: track.album.band.name,
        artistSlug: track.album.band.slug,
        albumTitle: track.album.title,
        albumSlug: track.album.slug,
        coverUrl,
        audioUrl,
        duration: track.duration_seconds,
      }

      // Set as single track (clear queue)
      state.currentTrack = playerTrack
      state.queue = [playerTrack]
      state.queueIndex = 0

      audio.src = audioUrl
      await audio.play()
    } catch (e) {
      console.error('Failed to play track from library:', e)
      state.isLoading = false
    }
  }

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Progress percentage
  const progress = computed(() => {
    if (!state.duration) return 0
    return (state.currentTime / state.duration) * 100
  })

  // Computed: effective duration (limited for preview mode)
  const effectiveDuration = computed(() => {
    if (state.isPreviewMode) {
      return Math.min(state.duration, PREVIEW_LIMIT_SECONDS)
    }
    return state.duration
  })

  // Computed: preview progress percentage
  const previewProgress = computed(() => {
    if (!state.isPreviewMode) return 100
    return Math.min(100, (state.currentTime / PREVIEW_LIMIT_SECONDS) * 100)
  })

  return {
    // State (readonly)
    currentTrack: computed(() => state.currentTrack),
    queue: computed(() => state.queue),
    queueIndex: computed(() => state.queueIndex),
    isPlaying: computed(() => state.isPlaying),
    currentTime: computed(() => state.currentTime),
    duration: computed(() => state.duration),
    volume: computed(() => state.volume),
    isMuted: computed(() => state.isMuted),
    isLoading: computed(() => state.isLoading),
    progress,
    // Preview mode state
    isPreviewMode: computed(() => state.isPreviewMode),
    previewEnded: computed(() => state.previewEnded),
    previewLimit: PREVIEW_LIMIT_SECONDS,
    effectiveDuration,
    previewProgress,
    // Audio analyser data for visualizations
    audioData: computed(() => state.audioData),

    // Actions
    playTrack,
    playAlbum,
    playFromQueue,
    playTrackFromLibrary,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    formatTime,
  }
}
