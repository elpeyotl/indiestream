// Global audio player composable for Fairstream
import type { Track, Album } from './useAlbum'

export type RepeatMode = 'off' | 'all' | 'one'

export interface PlayerTrack {
  id: string
  title: string
  artist: string
  artistSlug: string
  albumTitle: string
  albumSlug: string
  coverUrl: string | null
  audioUrl: string
  audioKey?: string // Storage key for lazy URL fetching
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
  // Preview mode for non-logged-in users OR free tier limit reached
  isPreviewMode: boolean
  previewEnded: boolean
  // Free tier tracking - is this a free play (not counting toward artist stats)
  isFreePlay: boolean
  // Flag to show upgrade prompt when free plays exhausted
  showUpgradePrompt: boolean
  // Audio analyser data for visualizations
  audioData: Uint8Array | null
  // Shuffle and repeat modes
  shuffleEnabled: boolean
  originalQueue: PlayerTrack[]
  repeatMode: RepeatMode
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
  isFreePlay: false,
  showUpgradePrompt: false,
  audioData: null,
  shuffleEnabled: false,
  originalQueue: [],
  repeatMode: 'off' as RepeatMode,
})

let audio: HTMLAudioElement | null = null
let preloadAudio: HTMLAudioElement | null = null // For preloading next track

// Media Session API for lock screen controls
let mediaSessionInitialized = false

// Update Media Session metadata (for lock screen controls)
const updateMediaSessionMetadata = (track: PlayerTrack | null) => {
  if (!('mediaSession' in navigator) || !track) return

  const artwork: MediaImage[] = []
  if (track.coverUrl) {
    // Add multiple sizes for different devices
    artwork.push(
      { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
      { src: track.coverUrl, sizes: '128x128', type: 'image/jpeg' },
      { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' },
      { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
      { src: track.coverUrl, sizes: '384x384', type: 'image/jpeg' },
      { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }
    )
  }

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.albumTitle,
    artwork,
  })
}

// Update Media Session playback state
const updateMediaSessionPlaybackState = (isPlaying: boolean) => {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
}

// Update Media Session position state
const updateMediaSessionPositionState = (currentTime: number, duration: number) => {
  if (!('mediaSession' in navigator) || !duration) return
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: currentTime,
    })
  } catch (e) {
    // setPositionState may not be supported in all browsers
  }
}

// Audio context and analyser for visualizations
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let analyserAnimationId: number | null = null

// Track total listening time across tracks
let listeningStartTime = 0

// Preload the next track in queue for gapless playback
const preloadNextTrack = async (getStreamUrl: (key: string) => Promise<string>) => {
  if (import.meta.server) return
  if (!preloadAudio) {
    preloadAudio = new Audio()
    preloadAudio.crossOrigin = 'anonymous' // Required for CORS
    preloadAudio.preload = 'auto'
    preloadAudio.volume = 0 // Silent - just for preloading
  }

  const nextIndex = state.queueIndex + 1
  if (nextIndex >= state.queue.length) return

  const nextTrack = state.queue[nextIndex]
  if (!nextTrack) return

  try {
    // Get the audio URL if not already loaded
    let audioUrl = nextTrack.audioUrl
    if (!audioUrl && nextTrack.audioKey) {
      audioUrl = await getStreamUrl(nextTrack.audioKey)
      // Update the track in queue with the fetched URL
      nextTrack.audioUrl = audioUrl
    }

    if (audioUrl && preloadAudio.src !== audioUrl) {
      preloadAudio.src = audioUrl
      preloadAudio.load()
    }
  } catch (e) {
    // Preload failed - not critical, playback will fetch when needed
    console.debug('Preload failed for next track:', e)
  }
}

export const usePlayer = () => {
  const { getStreamUrl, getPlaybackAudioKey } = useAlbum()
  const user = useSupabaseUser()
  const { isSubscribed, canPlayFullTracks, useFreePlays, freePlaysRemaining } = useSubscription()

  // Record a stream to the backend
  const recordStream = async (trackId: string, durationSeconds: number) => {
    if (!user.value) return // Only record for logged-in users
    if (state.streamRecorded) return // Already recorded this track

    // Set flag immediately to prevent race condition from multiple timeupdate events
    state.streamRecorded = true

    try {
      await $fetch('/api/streams/record', {
        method: 'POST',
        body: {
          trackId,
          durationSeconds,
          isFreePlay: state.isFreePlay,
        },
      })
    } catch (e) {
      console.error('Failed to record stream:', e)
      // Reset flag on error so it can retry
      state.streamRecorded = false
    }
  }

  // Check if we've listened long enough to count as a stream (30 seconds)
  const checkAndRecordStream = () => {
    if (!state.currentTrack || state.streamRecorded) return
    if (state.currentTime >= 30) {
      recordStream(state.currentTrack.id, Math.floor(state.currentTime))
    }
  }

  // Check play allowance and set up preview/free play mode
  const checkPlayAllowance = async (trackId?: string): Promise<'full' | 'free' | 'preview' | 'own_music'> => {
    // Not logged in = preview mode
    if (!user.value) {
      return 'preview'
    }

    // Check if this is the user's own music (artists can always play their own music)
    if (trackId) {
      try {
        const result = await $fetch('/api/free-tier/check', {
          method: 'POST',
          body: { trackId },
        })
        if (result.isOwnMusic) {
          return 'own_music'
        }
      } catch (e) {
        // Fall through to regular checks if this fails
        console.error('Failed to check track ownership:', e)
      }
    }

    // Subscriber = full access
    if (isSubscribed.value) {
      return 'full'
    }

    // Free user - check if they have plays remaining
    if (canPlayFullTracks.value) {
      return 'free'
    }

    // Free user with no plays remaining = preview mode
    return 'preview'
  }

  // Track if we've already triggered the 75% preload for current track
  let preloadTriggeredAt75 = false

  // Reset stream tracking for new track
  const resetStreamTracking = async (trackId?: string) => {
    state.streamRecorded = false
    state.trackStartTime = Date.now()
    state.previewEnded = false
    state.showUpgradePrompt = false
    preloadTriggeredAt75 = false // Reset preload flag for new track

    // Check what type of play this will be
    const playType = await checkPlayAllowance(trackId)

    if (playType === 'preview') {
      state.isPreviewMode = true
      state.isFreePlay = false
      // If user is logged in but out of free plays, show upgrade prompt
      if (user.value) {
        state.showUpgradePrompt = true
      }
    } else if (playType === 'free') {
      state.isPreviewMode = false
      state.isFreePlay = true
      // Decrement free plays locally (server will also decrement)
      useFreePlays()
    } else if (playType === 'own_music') {
      // Artist listening to their own music - full access, no free play
      state.isPreviewMode = false
      state.isFreePlay = false
    } else {
      // Full subscriber access
      state.isPreviewMode = false
      state.isFreePlay = false
    }
  }

  // Dismiss upgrade prompt
  const dismissUpgradePrompt = () => {
    state.showUpgradePrompt = false
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

  // Check if we should preload next track (at 75% of current track)
  const checkPreloadTrigger = () => {
    if (preloadTriggeredAt75) return
    if (state.duration > 0 && state.currentTime / state.duration >= 0.75) {
      preloadTriggeredAt75 = true
      preloadNextTrack(getStreamUrl)
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
      // Check if we should preload next track (at 75%)
      checkPreloadTrigger()
      // Update lock screen position (throttled by browser)
      updateMediaSessionPositionState(audio!.currentTime, audio!.duration)
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
      updateMediaSessionPlaybackState(true)
      // Start preloading next track when current one starts
      preloadNextTrack(getStreamUrl)
    })

    audio.addEventListener('pause', () => {
      state.isPlaying = false
      updateMediaSessionPlaybackState(false)
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

    // Initialize Media Session API for lock screen controls
    if ('mediaSession' in navigator && !mediaSessionInitialized) {
      mediaSessionInitialized = true

      navigator.mediaSession.setActionHandler('play', () => {
        audio?.play()
      })

      navigator.mediaSession.setActionHandler('pause', () => {
        audio?.pause()
      })

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious()
      })

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext()
      })

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audio) {
          seek(details.seekTime)
        }
      })

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10
        if (audio) {
          seek(Math.max(0, audio.currentTime - skipTime))
        }
      })

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10
        if (audio) {
          seek(Math.min(audio.duration || 0, audio.currentTime + skipTime))
        }
      })
    }
  }

  // Play a single track
  const playTrack = async (
    track: Track,
    album: Album,
    coverUrl: string | null
  ) => {
    initAudio()
    // Get best audio key (streaming if available, fallback to original)
    const audioKey = getPlaybackAudioKey(track)
    if (!audio || !audioKey) return

    // Initialize audio analyser on first play
    initAudioAnalyser()

    // Reset tracking for new track (async to check subscription status)
    await resetStreamTracking(track.id)
    state.isLoading = true

    try {
      const audioUrl = await getStreamUrl(audioKey)

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
      // Update lock screen metadata
      updateMediaSessionMetadata(playerTrack)
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

    // Build queue from album tracks (filter to playable tracks)
    const tracks = album.tracks.filter(t => getPlaybackAudioKey(t))
    if (tracks.length === 0) return

    state.queue = []
    state.queueIndex = startIndex

    // Load all track URLs
    for (const track of tracks) {
      try {
        const audioKey = getPlaybackAudioKey(track)!
        const audioUrl = await getStreamUrl(audioKey)
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

    const track = state.queue[index]
    if (!track) return

    // Reset stream tracking for the new track (async to check subscription status)
    await resetStreamTracking(track.id)

    state.queueIndex = index
    state.currentTrack = track
    state.isLoading = true

    // Update lock screen metadata
    updateMediaSessionMetadata(state.currentTrack)

    try {
      // Lazily fetch audio URL if missing but audioKey is present
      let audioUrl = track.audioUrl
      if (!audioUrl && track.audioKey) {
        audioUrl = await getStreamUrl(track.audioKey)
        // Update the track in queue with the fetched URL
        track.audioUrl = audioUrl
        state.currentTrack = { ...track, audioUrl }
      }

      if (!audioUrl) {
        throw new Error('No audio URL available')
      }

      audio.src = audioUrl
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
    // Repeat one: restart current track
    if (state.repeatMode === 'one') {
      if (audio) {
        audio.currentTime = 0
        audio.play()
      }
      return
    }

    if (state.queueIndex < state.queue.length - 1) {
      playFromQueue(state.queueIndex + 1)
    } else if (state.repeatMode === 'all') {
      // Repeat all: go back to first track
      playFromQueue(0)
    } else {
      // End of queue, no repeat
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

  // Toggle shuffle mode
  const toggleShuffle = () => {
    state.shuffleEnabled = !state.shuffleEnabled

    if (state.shuffleEnabled) {
      // Save original queue order
      state.originalQueue = [...state.queue]

      // Shuffle queue while keeping current track at position 0
      const currentTrackItem = state.queue[state.queueIndex]
      const remainingTracks = state.queue.filter((_, i) => i !== state.queueIndex)

      // Fisher-Yates shuffle for remaining tracks
      for (let i = remainingTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]]
      }

      // Put current track first, then shuffled remaining
      state.queue = [currentTrackItem, ...remainingTracks]
      state.queueIndex = 0
    } else {
      // Restore original queue order
      if (state.originalQueue.length > 0) {
        const currentId = state.currentTrack?.id
        state.queue = [...state.originalQueue]
        // Find current track in original queue
        state.queueIndex = state.queue.findIndex(t => t.id === currentId)
        if (state.queueIndex < 0) state.queueIndex = 0
      }
    }
  }

  // Cycle through repeat modes: off -> all -> one -> off
  const cycleRepeatMode = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(state.repeatMode)
    state.repeatMode = modes[(currentIndex + 1) % 3]
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

    // Reset tracking for new track (async to check subscription status)
    await resetStreamTracking(track.id)
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

      // Update lock screen metadata
      updateMediaSessionMetadata(playerTrack)

      audio.src = audioUrl
      await audio.play()
    } catch (e) {
      console.error('Failed to play track from library:', e)
      state.isLoading = false
    }
  }

  // Play a playlist (array of tracks with cover URLs)
  const playPlaylist = async (
    tracks: Array<{
      id: string
      title: string
      duration_seconds: number
      audio_key: string | null
      coverUrl?: string | null
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
    }>,
    startIndex = 0
  ) => {
    initAudio()
    if (!audio || !tracks.length) return

    // Initialize audio analyser on first play
    initAudioAnalyser()

    // Filter tracks with audio
    const playableTracks = tracks.filter(t => t.audio_key)
    if (playableTracks.length === 0) return

    state.queue = []
    state.queueIndex = startIndex

    // Load all track URLs
    for (const track of playableTracks) {
      try {
        const audioUrl = await getStreamUrl(track.audio_key!)
        state.queue.push({
          id: track.id,
          title: track.title,
          artist: track.album.band.name,
          artistSlug: track.album.band.slug,
          albumTitle: track.album.title,
          albumSlug: track.album.slug,
          coverUrl: track.coverUrl || null,
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

  // Set queue from external source (e.g., recently played, charts)
  // Tracks should have audioKey for lazy URL fetching
  const setQueue = async (
    tracks: Array<{
      id: string
      title: string
      artist: string
      artistSlug: string
      albumTitle: string
      albumSlug: string
      coverUrl: string | null
      duration: number
      audioKey: string
    }>,
    startIndex = 0
  ) => {
    initAudio()
    if (!audio || !tracks.length) return

    // Initialize audio analyser on first play
    initAudioAnalyser()

    // Filter tracks with audio keys
    const playableTracks = tracks.filter(t => t.audioKey)
    if (playableTracks.length === 0) return

    // Build queue with audioKey for lazy loading
    state.queue = playableTracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      artistSlug: t.artistSlug,
      albumTitle: t.albumTitle,
      albumSlug: t.albumSlug,
      coverUrl: t.coverUrl,
      audioUrl: '', // Will be lazily loaded
      audioKey: t.audioKey,
      duration: t.duration,
    }))

    state.queueIndex = Math.min(startIndex, state.queue.length - 1)

    // Play the starting track
    if (state.queue.length > 0) {
      await playFromQueue(state.queueIndex)
    }
  }

  // Add track(s) to play next - inserts after current track
  const addNextInQueue = async (track: PlayerTrack | PlayerTrack[]) => {
    const tracks = Array.isArray(track) ? track : [track]

    if (state.queue.length === 0) {
      // No queue - start playing
      state.queue = tracks
      state.queueIndex = 0
      await playFromQueue(0)
    } else {
      // Insert after current track
      const insertIndex = state.queueIndex + 1
      state.queue.splice(insertIndex, 0, ...tracks)
      // Also update originalQueue if shuffle is on
      if (state.shuffleEnabled && state.originalQueue.length > 0) {
        state.originalQueue.splice(insertIndex, 0, ...tracks)
      }
    }
  }

  // Add track(s) to end of queue
  const addToQueue = async (track: PlayerTrack | PlayerTrack[]) => {
    const tracks = Array.isArray(track) ? track : [track]

    if (state.queue.length === 0) {
      // No queue - start playing
      state.queue = tracks
      state.queueIndex = 0
      await playFromQueue(0)
    } else {
      // Append to end of queue
      state.queue.push(...tracks)
      // Also update originalQueue if shuffle is on
      if (state.shuffleEnabled && state.originalQueue.length > 0) {
        state.originalQueue.push(...tracks)
      }
    }
  }

  // Check if track is in queue (upcoming, not including currently playing)
  const isInQueue = (trackId: string) => {
    // Check if track is in the upcoming portion of the queue
    return state.queue.slice(state.queueIndex + 1).some(t => t.id === trackId)
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
    // Free tier state
    isFreePlay: computed(() => state.isFreePlay),
    showUpgradePrompt: computed(() => state.showUpgradePrompt),
    // Audio analyser data for visualizations
    audioData: computed(() => state.audioData),
    // Shuffle and repeat state
    shuffleEnabled: computed(() => state.shuffleEnabled),
    repeatMode: computed(() => state.repeatMode),

    // Actions
    playTrack,
    playAlbum,
    playFromQueue,
    playTrackFromLibrary,
    playPlaylist,
    setQueue,
    addNextInQueue,
    addToQueue,
    isInQueue,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    formatTime,
    dismissUpgradePrompt,
  }
}
