// Pinia store for offline audio caching
// Manages saving albums for offline playback, download queue, and blob URL creation
import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import type { Album, Track } from '~/stores/album'
import type { OfflineAlbum, OfflineTrack } from '~/utils/offlineDb'
import {
  putAudioBlob,
  getAudioBlob,
  deleteAudioBlob,
  putCoverBlob,
  getCoverBlob,
  putTrackMeta,
  getAllTrackMeta,
  deleteTrackMeta,
  putAlbumMeta,
  getAllAlbumMeta,
  deleteAlbumMeta,
  getStorageEstimate,
  requestPersistentStorage,
} from '~/utils/offlineDb'

interface DownloadQueueItem {
  trackId: string
  audioKey: string
  albumId: string
  title: string
  artist: string
  artistSlug: string
  albumTitle: string
  albumSlug: string
  coverKey: string | null
  duration: number
  trackNumber: number
}

export const useOfflineStore = defineStore('offline', () => {
  // State — use reactive() for Maps so .set()/.delete() trigger reactivity
  const offlineAlbums = reactive<Map<string, OfflineAlbum>>(new Map())
  const offlineTracks = reactive<Map<string, OfflineTrack>>(new Map())
  const downloadQueue = ref<DownloadQueueItem[]>([])
  const isDownloading = ref(false)
  const currentDownloadAlbumId = ref<string | null>(null)
  const currentDownloadTrackIndex = ref(0)
  const currentDownloadTotalTracks = ref(0)
  const totalStorageUsed = ref(0)
  const storageQuota = ref(0)
  const initialized = ref(false)

  let abortController: AbortController | null = null

  // Lazy store access
  const getAlbumStore = () => useAlbumStore()
  const getSubscriptionStore = () => useSubscriptionStore()

  // ===== Initialization =====

  const init = async () => {
    if (initialized.value || import.meta.server) return

    try {
      const [albums, tracks, storage] = await Promise.all([
        getAllAlbumMeta(),
        getAllTrackMeta(),
        getStorageEstimate(),
      ])

      offlineAlbums.clear()
      for (const album of albums) {
        offlineAlbums.set(album.albumId, album)
      }

      offlineTracks.clear()
      for (const track of tracks) {
        offlineTracks.set(track.trackId, track)
      }

      totalStorageUsed.value = storage.usage
      storageQuota.value = storage.quota

      initialized.value = true
    } catch (e) {
      console.error('Failed to initialize offline store:', e)
    }
  }

  // ===== Queries =====

  const isAlbumOffline = (albumId: string): boolean => {
    const album = offlineAlbums.get(albumId)
    return album?.status === 'complete'
  }

  const isAlbumDownloading = (albumId: string): boolean => {
    const album = offlineAlbums.get(albumId)
    return album?.status === 'downloading'
  }

  const isTrackOffline = (trackId: string): boolean => {
    return offlineTracks.has(trackId)
  }

  const getAlbumDownloadProgress = (albumId: string) => {
    const album = offlineAlbums.get(albumId)
    if (!album) return null
    return {
      cachedTracks: album.cachedTracks,
      totalTracks: album.totalTracks,
      status: album.status,
    }
  }

  // ===== Blob URL Management =====

  const getOfflineBlobUrl = async (audioKey: string): Promise<string | null> => {
    try {
      const buffer = await getAudioBlob(audioKey)
      if (!buffer) return null

      // Caller (player store) is responsible for revoking blob URLs on track change
      const blob = new Blob([buffer], { type: 'audio/mp4' })
      return URL.createObjectURL(blob)
    } catch (e) {
      console.error('Failed to get offline blob URL:', e)
      return null
    }
  }

  const getOfflineCoverBlobUrl = async (coverKey: string): Promise<string | null> => {
    try {
      const buffer = await getCoverBlob(coverKey)
      if (!buffer) return null

      const blob = new Blob([buffer], { type: 'image/jpeg' })
      return URL.createObjectURL(blob)
    } catch (e) {
      console.error('Failed to get offline cover blob URL:', e)
      return null
    }
  }

  // ===== Save / Remove =====

  const saveAlbumOffline = async (
    album: Album,
    tracks: Track[],
  ) => {
    if (import.meta.server) return

    // Check subscriber status
    if (!getSubscriptionStore().isSubscribed) {
      throw new Error('Subscription required for offline mode')
    }

    const albumStore = getAlbumStore()
    const approvedTracks = tracks.filter(t => albumStore.getPlaybackAudioKey(t))

    if (approvedTracks.length === 0) return

    // Request persistent storage on first save
    if (offlineAlbums.size === 0) {
      await requestPersistentStorage()
    }

    // Create album metadata
    const albumMeta: OfflineAlbum = {
      albumId: album.id,
      title: album.title,
      slug: album.slug,
      artistName: album.band?.name || 'Unknown Artist',
      artistSlug: album.band?.slug || '',
      coverKey: album.cover_key || null,
      totalTracks: approvedTracks.length,
      cachedTracks: 0,
      totalSizeBytes: 0,
      status: 'downloading',
      cachedAt: Date.now(),
    }

    await putAlbumMeta(albumMeta)
    offlineAlbums.set(album.id, albumMeta)

    // Build download queue
    const items: DownloadQueueItem[] = approvedTracks.map(track => ({
      trackId: track.id,
      audioKey: albumStore.getPlaybackAudioKey(track)!,
      albumId: album.id,
      title: track.title,
      artist: album.band?.name || 'Unknown Artist',
      artistSlug: album.band?.slug || '',
      albumTitle: album.title,
      albumSlug: album.slug,
      coverKey: album.cover_key || null,
      duration: track.duration_seconds,
      trackNumber: track.track_number,
    }))

    downloadQueue.value.push(...items)

    // Also cache cover image via server proxy (avoids CORS)
    if (album.cover_key) {
      try {
        const encodedCoverKey = btoa(album.cover_key).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        const coverResponse = await fetch(`/api/stream/download/${encodedCoverKey}`)
        if (coverResponse.ok) {
          const coverBuffer = await coverResponse.arrayBuffer()
          await putCoverBlob(album.cover_key, coverBuffer)
        }
      } catch (e) {
        console.debug('Failed to cache cover image:', e)
      }
    }

    // Start processing if not already running
    if (!isDownloading.value) {
      processDownloadQueue()
    }
  }

  const removeAlbumOffline = async (albumId: string) => {
    // Cancel any in-progress download for this album
    if (currentDownloadAlbumId.value === albumId && abortController) {
      abortController.abort()
    }

    // Remove tracks from download queue
    downloadQueue.value = downloadQueue.value.filter(item => item.albumId !== albumId)

    // Delete cached tracks
    const tracksToDelete = Array.from(offlineTracks.values())
      .filter(t => t.albumId === albumId)

    for (const track of tracksToDelete) {
      await deleteAudioBlob(track.audioKey)
      await deleteTrackMeta(track.trackId)
      offlineTracks.delete(track.trackId)
    }

    // Delete cover blob
    const album = offlineAlbums.get(albumId)
    if (album?.coverKey) {
      try {
        await deleteAudioBlob(`cover:${album.coverKey}`)
      } catch {
        // Cover may not exist
      }
    }

    // Delete album metadata
    await deleteAlbumMeta(albumId)
    offlineAlbums.delete(albumId)

    // Update storage estimate
    const storage = await getStorageEstimate()
    totalStorageUsed.value = storage.usage
  }

  // ===== Download Queue Processing =====

  const processDownloadQueue = async () => {
    if (isDownloading.value || downloadQueue.value.length === 0) return

    isDownloading.value = true
    const toast = useToast()

    while (downloadQueue.value.length > 0) {
      const item = downloadQueue.value[0]
      if (!item) break

      currentDownloadAlbumId.value = item.albumId

      // Count remaining tracks for this album in queue
      const albumItems = downloadQueue.value.filter(q => q.albumId === item.albumId)
      const albumMeta = offlineAlbums.get(item.albumId)
      if (albumMeta) {
        currentDownloadTotalTracks.value = albumMeta.totalTracks
        currentDownloadTrackIndex.value = albumMeta.totalTracks - albumItems.length
      }

      abortController = new AbortController()

      try {
        // Download audio blob via server proxy (avoids CORS with presigned R2 URLs)
        const encodedKey = btoa(item.audioKey).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        const response = await fetch(`/api/stream/download/${encodedKey}`, {
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()

        // Store in IndexedDB
        await putAudioBlob(item.audioKey, buffer)

        // Store track metadata
        const trackMeta: OfflineTrack = {
          trackId: item.trackId,
          audioKey: item.audioKey,
          albumId: item.albumId,
          title: item.title,
          artist: item.artist,
          artistSlug: item.artistSlug,
          albumTitle: item.albumTitle,
          albumSlug: item.albumSlug,
          coverKey: item.coverKey,
          duration: item.duration,
          trackNumber: item.trackNumber,
          sizeBytes: buffer.byteLength,
          cachedAt: Date.now(),
        }

        await putTrackMeta(trackMeta)
        offlineTracks.set(item.trackId, trackMeta)

        // Update album progress
        if (albumMeta) {
          albumMeta.cachedTracks++
          albumMeta.totalSizeBytes += buffer.byteLength

          if (albumMeta.cachedTracks >= albumMeta.totalTracks) {
            albumMeta.status = 'complete'
            toast.add({
              title: `${albumMeta.title} saved offline`,
              description: `${albumMeta.totalTracks} tracks (${formatBytes(albumMeta.totalSizeBytes)})`,
              color: 'green',
            })
          }

          await putAlbumMeta({ ...toRaw(albumMeta) })
          offlineAlbums.set(item.albumId, { ...toRaw(albumMeta) })
        }

        // Remove from queue
        downloadQueue.value.shift()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // Download was cancelled (album removed)
          downloadQueue.value.shift()
          continue
        }

        console.error('Failed to download track:', item.title, e)

        // Mark album as error and skip remaining tracks for this album
        if (albumMeta) {
          albumMeta.status = albumMeta.cachedTracks > 0 ? 'partial' : 'error'
          await putAlbumMeta({ ...toRaw(albumMeta) })
          offlineAlbums.set(item.albumId, { ...toRaw(albumMeta) })

          toast.add({
            title: 'Download failed',
            description: `Could not download "${item.title}". ${e instanceof Error ? e.message : ''}`,
            color: 'red',
          })
        }

        // Remove failed item and continue with next
        downloadQueue.value.shift()
      }
    }

    isDownloading.value = false
    currentDownloadAlbumId.value = null
    abortController = null

    // Update storage estimate after all downloads
    const storage = await getStorageEstimate()
    totalStorageUsed.value = storage.usage
  }

  // ===== Size Estimation =====

  const estimateAlbumSize = (tracks: Track[]): number => {
    // AAC 256kbps = 32 KB/s
    const BYTES_PER_SECOND = 32 * 1024
    return tracks.reduce((total, track) => total + (track.duration_seconds * BYTES_PER_SECOND), 0)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }

  return {
    // State (no readonly() — Pinia setup stores don't support it during SSR hydration)
    offlineAlbums,
    offlineTracks,
    downloadQueue,
    isDownloading,
    currentDownloadAlbumId,
    currentDownloadTrackIndex,
    currentDownloadTotalTracks,
    totalStorageUsed,
    storageQuota,
    initialized,

    // Methods
    init,
    isAlbumOffline,
    isAlbumDownloading,
    isTrackOffline,
    getAlbumDownloadProgress,
    getOfflineBlobUrl,
    getOfflineCoverBlobUrl,
    saveAlbumOffline,
    removeAlbumOffline,
    estimateAlbumSize,
    formatBytes,
  }
})
