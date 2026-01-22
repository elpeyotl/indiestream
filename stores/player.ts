// Pinia store for global audio player
import { defineStore, storeToRefs } from 'pinia'
import type { Track, Album } from '~/stores/album'

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

// Preview limit in seconds for non-logged-in users
const PREVIEW_LIMIT_SECONDS = 30

// Module-level singletons (client-only, not reactive)
let audio: HTMLAudioElement | null = null
let preloadAudio: HTMLAudioElement | null = null
let mediaSessionInitialized = false
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let analyserAnimationId: number | null = null
let listeningStartTime = 0
let preloadTriggeredAt75 = false

// Update Media Session metadata (for lock screen controls)
const updateMediaSessionMetadata = (track: PlayerTrack | null) => {
  if (!('mediaSession' in navigator) || !track) return

  const artwork: MediaImage[] = []
  if (track.coverUrl) {
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

export const usePlayerStore = defineStore('player', () => {
  // Reactive state
  const currentTrack = ref<PlayerTrack | null>(null)
  const queue = ref<PlayerTrack[]>([])
  const queueIndex = ref(-1)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const isLoading = ref(false)
  const streamRecorded = ref(false)
  const trackStartTime = ref(0)
  const isPreviewMode = ref(false)
  const previewEnded = ref(false)
  const isFreePlay = ref(false)
  const showUpgradePrompt = ref(false)
  const audioData = shallowRef<Uint8Array | null>(null)
  const shuffleEnabled = ref(false)
  const originalQueue = ref<PlayerTrack[]>([])
  const repeatMode = ref<RepeatMode>('off')

  // Lazy store access to avoid cross-request pollution on SSR
  const getAlbumStore = () => useAlbumStore()
  const getSubscriptionStore = () => useSubscriptionStore()
  const user = useSupabaseUser()

  // Computed properties that lazily access other stores
  const isSubscribed = computed(() => getSubscriptionStore().isSubscribed)
  const canPlayFullTracks = computed(() => getSubscriptionStore().canPlayFullTracks)

  // Computed
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  const effectiveDuration = computed(() => {
    if (isPreviewMode.value) {
      return Math.min(duration.value, PREVIEW_LIMIT_SECONDS)
    }
    return duration.value
  })

  const previewProgress = computed(() => {
    if (!isPreviewMode.value) return 100
    return Math.min(100, (currentTime.value / PREVIEW_LIMIT_SECONDS) * 100)
  })

  // Preload the next track in queue for gapless playback
  const preloadNextTrack = async () => {
    if (import.meta.server) return
    if (!preloadAudio) {
      preloadAudio = new Audio()
      preloadAudio.crossOrigin = 'anonymous'
      preloadAudio.preload = 'auto'
      preloadAudio.volume = 0
    }

    const nextIndex = queueIndex.value + 1
    if (nextIndex >= queue.value.length) return

    const nextTrack = queue.value[nextIndex]
    if (!nextTrack) return

    try {
      let audioUrl = nextTrack.audioUrl
      if (!audioUrl && nextTrack.audioKey) {
        audioUrl = await getAlbumStore().getStreamUrl(nextTrack.audioKey)
        nextTrack.audioUrl = audioUrl
      }

      if (audioUrl && preloadAudio.src !== audioUrl) {
        preloadAudio.src = audioUrl
        preloadAudio.load()
      }
    } catch (e) {
      console.debug('Preload failed for next track:', e)
    }
  }

  // Record a stream to the backend
  const recordStream = async (trackId: string, durationSeconds: number) => {
    if (!user.value) return
    if (streamRecorded.value) return

    streamRecorded.value = true

    try {
      await $fetch('/api/streams/record', {
        method: 'POST',
        body: {
          trackId,
          durationSeconds,
          isFreePlay: isFreePlay.value,
        },
      })
    } catch (e) {
      console.error('Failed to record stream:', e)
      streamRecorded.value = false
    }
  }

  // Check if we've listened long enough to count as a stream (30 seconds)
  const checkAndRecordStream = () => {
    if (!currentTrack.value || streamRecorded.value) return
    if (currentTime.value >= 30) {
      recordStream(currentTrack.value.id, Math.floor(currentTime.value))
    }
  }

  // Check play allowance and set up preview/free play mode
  const checkPlayAllowance = async (trackId?: string): Promise<'full' | 'free' | 'preview' | 'own_music'> => {
    if (!user.value) {
      return 'preview'
    }

    // Ensure subscription data is loaded before checking
    const subStore = getSubscriptionStore()
    await subStore.fetchSubscription()

    if (trackId) {
      try {
        const result = await $fetch('/api/free-tier/check', {
          method: 'POST',
          body: { trackId },
        })
        if ('isOwnMusic' in result && result.isOwnMusic) {
          return 'own_music'
        }
      } catch (e) {
        console.error('Failed to check track ownership:', e)
      }
    }

    if (isSubscribed.value) {
      return 'full'
    }

    if (canPlayFullTracks.value) {
      return 'free'
    }

    return 'preview'
  }

  // Reset stream tracking for new track
  const resetStreamTracking = async (trackId?: string) => {
    streamRecorded.value = false
    trackStartTime.value = Date.now()
    previewEnded.value = false
    showUpgradePrompt.value = false
    preloadTriggeredAt75 = false

    const playType = await checkPlayAllowance(trackId)

    if (playType === 'preview') {
      isPreviewMode.value = true
      isFreePlay.value = false
      if (user.value) {
        showUpgradePrompt.value = true
      }
    } else if (playType === 'free') {
      isPreviewMode.value = false
      isFreePlay.value = true
      getSubscriptionStore().useFreePlays()
    } else if (playType === 'own_music') {
      isPreviewMode.value = false
      isFreePlay.value = false
    } else {
      isPreviewMode.value = false
      isFreePlay.value = false
    }
  }

  // Dismiss upgrade prompt
  const dismissUpgradePrompt = () => {
    showUpgradePrompt.value = false
  }

  // Check and enforce preview limit for non-logged-in users
  const checkPreviewLimit = () => {
    if (!isPreviewMode.value || previewEnded.value) return
    if (currentTime.value >= PREVIEW_LIMIT_SECONDS) {
      if (audio) {
        audio.pause()
      }
      previewEnded.value = true
      isPlaying.value = false
    }
  }

  // Check if we should preload next track (at 75% of current track)
  const checkPreloadTrigger = () => {
    if (preloadTriggeredAt75) return
    if (duration.value > 0 && currentTime.value / duration.value >= 0.75) {
      preloadTriggeredAt75 = true
      preloadNextTrack()
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

      audioData.value = new Uint8Array(analyser.frequencyBinCount)

      const updateAnalyser = () => {
        if (analyser && audioData.value) {
          // Type assertion needed due to Uint8Array generic variance in TypeScript
          analyser.getByteFrequencyData(audioData.value as unknown as Uint8Array<ArrayBuffer>)
        }
        analyserAnimationId = requestAnimationFrame(updateAnalyser)
      }
      updateAnalyser()
    } catch (e) {
      console.error('Failed to initialize audio analyser:', e)
    }
  }

  // Forward declarations for event handlers
  const playNext = () => {
    if (repeatMode.value === 'one') {
      if (audio) {
        audio.currentTime = 0
        audio.play()
      }
      return
    }

    if (queueIndex.value < queue.value.length - 1) {
      playFromQueue(queueIndex.value + 1)
    } else if (repeatMode.value === 'all') {
      playFromQueue(0)
    } else {
      isPlaying.value = false
    }
  }

  const playPrevious = () => {
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }

    if (queueIndex.value > 0) {
      playFromQueue(queueIndex.value - 1)
    }
  }

  const seek = (time: number) => {
    if (!audio) return
    if (isPreviewMode.value && time >= PREVIEW_LIMIT_SECONDS) {
      time = PREVIEW_LIMIT_SECONDS - 1
    }
    audio.currentTime = time
  }

  // Initialize audio element (client-side only)
  const initAudio = () => {
    if (import.meta.server) return
    if (audio) return

    audio = new Audio()
    audio.volume = volume.value
    audio.crossOrigin = 'anonymous'

    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio!.currentTime
      checkAndRecordStream()
      checkPreviewLimit()
      checkPreloadTrigger()
      updateMediaSessionPositionState(audio!.currentTime, audio!.duration)
    })

    audio.addEventListener('durationchange', () => {
      duration.value = audio!.duration
    })

    audio.addEventListener('ended', () => {
      playNext()
    })

    audio.addEventListener('play', () => {
      isPlaying.value = true
      listeningStartTime = Date.now()
      updateMediaSessionPlaybackState(true)
      preloadNextTrack()
    })

    audio.addEventListener('pause', () => {
      isPlaying.value = false
      updateMediaSessionPlaybackState(false)
    })

    audio.addEventListener('ended', () => {
      if (currentTrack.value && !streamRecorded.value) {
        recordStream(currentTrack.value.id, Math.floor(currentTime.value))
      }
    })

    audio.addEventListener('waiting', () => {
      isLoading.value = true
    })

    audio.addEventListener('canplay', () => {
      isLoading.value = false
    })

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      isLoading.value = false
      isPlaying.value = false
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
    const audioKey = getAlbumStore().getPlaybackAudioKey(track)
    if (!audio || !audioKey) return

    initAudioAnalyser()

    await resetStreamTracking(track.id)
    isLoading.value = true

    try {
      const audioUrlValue = await getAlbumStore().getStreamUrl(audioKey)

      const playerTrack: PlayerTrack = {
        id: track.id,
        title: track.title,
        artist: album.band?.name || 'Unknown Artist',
        artistSlug: album.band?.slug || '',
        albumTitle: album.title,
        albumSlug: album.slug,
        coverUrl,
        audioUrl: audioUrlValue,
        duration: track.duration_seconds,
      }

      currentTrack.value = playerTrack
      updateMediaSessionMetadata(playerTrack)
      audio.src = audioUrlValue
      await audio.play()
    } catch (e) {
      console.error('Failed to play track:', e)
      isLoading.value = false
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

    initAudioAnalyser()

    const tracks = album.tracks.filter(t => getAlbumStore().getPlaybackAudioKey(t))
    if (tracks.length === 0) return

    queue.value = []
    queueIndex.value = startIndex

    for (const track of tracks) {
      try {
        const audioKey = getAlbumStore().getPlaybackAudioKey(track)!
        const audioUrlValue = await getAlbumStore().getStreamUrl(audioKey)
        queue.value.push({
          id: track.id,
          title: track.title,
          artist: album.band?.name || 'Unknown Artist',
          artistSlug: album.band?.slug || '',
          albumTitle: album.title,
          albumSlug: album.slug,
          coverUrl,
          audioUrl: audioUrlValue,
          duration: track.duration_seconds,
        })
      } catch (e) {
        console.error('Failed to load track URL:', e)
      }
    }

    if (queue.value.length > 0 && queue.value[startIndex]) {
      await playFromQueue(startIndex)
    }
  }

  // Play from queue at index
  const playFromQueue = async (index: number) => {
    if (!audio || index < 0 || index >= queue.value.length) return

    const track = queue.value[index]
    if (!track) return

    await resetStreamTracking(track.id)

    queueIndex.value = index
    currentTrack.value = track
    isLoading.value = true

    updateMediaSessionMetadata(currentTrack.value)

    try {
      let audioUrlValue = track.audioUrl
      if (!audioUrlValue && track.audioKey) {
        audioUrlValue = await getAlbumStore().getStreamUrl(track.audioKey)
        track.audioUrl = audioUrlValue
        currentTrack.value = { ...track, audioUrl: audioUrlValue }
      }

      if (!audioUrlValue) {
        throw new Error('No audio URL available')
      }

      audio.src = audioUrlValue
      await audio.play()
    } catch (e) {
      console.error('Failed to play from queue:', e)
      isLoading.value = false
    }
  }

  // Toggle play/pause
  const togglePlay = () => {
    if (!audio) return

    if (isPlaying.value) {
      audio.pause()
    } else {
      audio.play().catch((e) => {
        console.error('Failed to play audio:', e)
        isPlaying.value = false
        isLoading.value = false
      })
    }
  }

  // Set volume
  const setVolume = (vol: number) => {
    volume.value = Math.max(0, Math.min(1, vol))
    if (audio) {
      audio.volume = volume.value
    }
    if (volume.value > 0) {
      isMuted.value = false
    }
  }

  // Toggle mute
  const toggleMute = () => {
    isMuted.value = !isMuted.value
    if (audio) {
      audio.volume = isMuted.value ? 0 : volume.value
    }
  }

  // Toggle shuffle mode
  const toggleShuffle = () => {
    shuffleEnabled.value = !shuffleEnabled.value

    if (shuffleEnabled.value) {
      originalQueue.value = [...queue.value]

      const currentTrackItem = queue.value[queueIndex.value]
      const remainingTracks = queue.value.filter((_, i) => i !== queueIndex.value)

      for (let i = remainingTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]]
      }

      queue.value = [currentTrackItem, ...remainingTracks]
      queueIndex.value = 0
    } else {
      if (originalQueue.value.length > 0) {
        const currentId = currentTrack.value?.id
        queue.value = [...originalQueue.value]
        queueIndex.value = queue.value.findIndex(t => t.id === currentId)
        if (queueIndex.value < 0) queueIndex.value = 0
      }
    }
  }

  // Cycle through repeat modes: off -> all -> one -> off
  const cycleRepeatMode = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentIndex + 1) % 3]
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

    initAudioAnalyser()

    await resetStreamTracking(track.id)
    isLoading.value = true

    try {
      const audioUrlValue = await getAlbumStore().getStreamUrl(track.audio_key)

      const playerTrack: PlayerTrack = {
        id: track.id,
        title: track.title,
        artist: track.album.band.name,
        artistSlug: track.album.band.slug,
        albumTitle: track.album.title,
        albumSlug: track.album.slug,
        coverUrl,
        audioUrl: audioUrlValue,
        duration: track.duration_seconds,
      }

      currentTrack.value = playerTrack
      queue.value = [playerTrack]
      queueIndex.value = 0

      updateMediaSessionMetadata(playerTrack)

      audio.src = audioUrlValue
      await audio.play()
    } catch (e) {
      console.error('Failed to play track from library:', e)
      isLoading.value = false
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

    initAudioAnalyser()

    const playableTracks = tracks.filter(t => t.audio_key)
    if (playableTracks.length === 0) return

    queue.value = []
    queueIndex.value = startIndex

    for (const track of playableTracks) {
      try {
        const audioUrlValue = await getAlbumStore().getStreamUrl(track.audio_key!)
        queue.value.push({
          id: track.id,
          title: track.title,
          artist: track.album.band.name,
          artistSlug: track.album.band.slug,
          albumTitle: track.album.title,
          albumSlug: track.album.slug,
          coverUrl: track.coverUrl || null,
          audioUrl: audioUrlValue,
          duration: track.duration_seconds,
        })
      } catch (e) {
        console.error('Failed to load track URL:', e)
      }
    }

    if (queue.value.length > 0 && queue.value[startIndex]) {
      await playFromQueue(startIndex)
    }
  }

  // Set queue from external source (e.g., recently played, charts)
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

    initAudioAnalyser()

    const playableTracks = tracks.filter(t => t.audioKey)
    if (playableTracks.length === 0) return

    queue.value = playableTracks.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      artistSlug: t.artistSlug,
      albumTitle: t.albumTitle,
      albumSlug: t.albumSlug,
      coverUrl: t.coverUrl,
      audioUrl: '',
      audioKey: t.audioKey,
      duration: t.duration,
    }))

    queueIndex.value = Math.min(startIndex, queue.value.length - 1)

    if (queue.value.length > 0) {
      await playFromQueue(queueIndex.value)
    }
  }

  // Add track(s) to play next - inserts after current track
  const addNextInQueue = async (track: PlayerTrack | PlayerTrack[]) => {
    const tracks = Array.isArray(track) ? track : [track]

    if (queue.value.length === 0) {
      queue.value = tracks
      queueIndex.value = 0
      await playFromQueue(0)
    } else {
      const insertIndex = queueIndex.value + 1
      queue.value.splice(insertIndex, 0, ...tracks)
      if (shuffleEnabled.value && originalQueue.value.length > 0) {
        originalQueue.value.splice(insertIndex, 0, ...tracks)
      }
    }
  }

  // Add track(s) to end of queue
  const addToQueue = async (track: PlayerTrack | PlayerTrack[]) => {
    const tracks = Array.isArray(track) ? track : [track]

    if (queue.value.length === 0) {
      queue.value = tracks
      queueIndex.value = 0
      await playFromQueue(0)
    } else {
      queue.value.push(...tracks)
      if (shuffleEnabled.value && originalQueue.value.length > 0) {
        originalQueue.value.push(...tracks)
      }
    }
  }

  // Check if track is in queue (upcoming, not including currently playing)
  const isInQueue = (trackId: string) => {
    return queue.value.slice(queueIndex.value + 1).some(t => t.id === trackId)
  }

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return {
    // State
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    progress,
    // Preview mode state
    isPreviewMode,
    previewEnded,
    previewLimit: PREVIEW_LIMIT_SECONDS,
    effectiveDuration,
    previewProgress,
    // Free tier state
    isFreePlay,
    showUpgradePrompt,
    // Audio analyser data for visualizations
    audioData,
    // Shuffle and repeat state
    shuffleEnabled,
    repeatMode,

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
})
