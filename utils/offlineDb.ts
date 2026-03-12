// IndexedDB wrapper for offline audio caching
// Three object stores: offline_metadata (track/album info), offline_audio (blobs), deferred_streams

const DB_NAME = 'fairtune-offline'
const DB_VERSION = 1

const STORE_METADATA = 'offline_metadata'
const STORE_AUDIO = 'offline_audio'
const STORE_DEFERRED = 'deferred_streams'

export interface OfflineTrack {
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
  sizeBytes: number
  cachedAt: number
}

export interface OfflineAlbum {
  albumId: string
  title: string
  slug: string
  artistName: string
  artistSlug: string
  coverKey: string | null
  totalTracks: number
  cachedTracks: number
  totalSizeBytes: number
  status: 'downloading' | 'complete' | 'partial' | 'error'
  cachedAt: number
}

export interface DeferredStream {
  trackId: string
  durationSeconds: number
  isFreePlay: boolean
  timestamp: number
}

let dbInstance: IDBDatabase | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA)
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO)
      }
      if (!db.objectStoreNames.contains(STORE_DEFERRED)) {
        db.createObjectStore(STORE_DEFERRED, { autoIncrement: true })
      }
    }

    request.onsuccess = () => {
      dbInstance = request.result
      dbInstance.onclose = () => { dbInstance = null }
      resolve(dbInstance)
    }

    request.onerror = () => reject(request.error)
  })
}

// Generic helpers
function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  }))
}

function idbPut(storeName: string, key: IDBValidKey, value: unknown): Promise<void> {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const req = tx.objectStore(storeName).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const req = tx.objectStore(storeName).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

function idbGetAll<T>(storeName: string, prefix?: string): Promise<T[]> {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)

    if (prefix) {
      // Use cursor to filter by key prefix
      const results: T[] = []
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff')
      const req = store.openCursor(range)
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      req.onerror = () => reject(req.error)
    } else {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    }
  }))
}

function idbClear(storeName: string): Promise<void> {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const req = tx.objectStore(storeName).clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

// ===== Audio Blobs =====

export function putAudioBlob(audioKey: string, data: ArrayBuffer): Promise<void> {
  return idbPut(STORE_AUDIO, audioKey, data)
}

export function getAudioBlob(audioKey: string): Promise<ArrayBuffer | null> {
  return idbGet<ArrayBuffer>(STORE_AUDIO, audioKey)
}

export function deleteAudioBlob(audioKey: string): Promise<void> {
  return idbDelete(STORE_AUDIO, audioKey)
}

// ===== Cover Blobs (stored in audio store with 'cover:' prefix) =====

export function putCoverBlob(coverKey: string, data: ArrayBuffer): Promise<void> {
  return idbPut(STORE_AUDIO, `cover:${coverKey}`, data)
}

export function getCoverBlob(coverKey: string): Promise<ArrayBuffer | null> {
  return idbGet<ArrayBuffer>(STORE_AUDIO, `cover:${coverKey}`)
}

// ===== Track Metadata =====

export function putTrackMeta(track: OfflineTrack): Promise<void> {
  return idbPut(STORE_METADATA, `track:${track.trackId}`, track)
}

export function getTrackMeta(trackId: string): Promise<OfflineTrack | null> {
  return idbGet<OfflineTrack>(STORE_METADATA, `track:${trackId}`)
}

export function getAllTrackMeta(): Promise<OfflineTrack[]> {
  return idbGetAll<OfflineTrack>(STORE_METADATA, 'track:')
}

export function deleteTrackMeta(trackId: string): Promise<void> {
  return idbDelete(STORE_METADATA, `track:${trackId}`)
}

// ===== Album Metadata =====

export function putAlbumMeta(album: OfflineAlbum): Promise<void> {
  return idbPut(STORE_METADATA, `album:${album.albumId}`, album)
}

export function getAlbumMeta(albumId: string): Promise<OfflineAlbum | null> {
  return idbGet<OfflineAlbum>(STORE_METADATA, `album:${albumId}`)
}

export function getAllAlbumMeta(): Promise<OfflineAlbum[]> {
  return idbGetAll<OfflineAlbum>(STORE_METADATA, 'album:')
}

export function deleteAlbumMeta(albumId: string): Promise<void> {
  return idbDelete(STORE_METADATA, `album:${albumId}`)
}

// ===== Deferred Streams =====

export function putDeferredStream(stream: DeferredStream): Promise<void> {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DEFERRED, 'readwrite')
    const req = tx.objectStore(STORE_DEFERRED).add(stream)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  }))
}

export function getAllDeferredStreams(): Promise<DeferredStream[]> {
  return idbGetAll<DeferredStream>(STORE_DEFERRED)
}

export function clearDeferredStreams(): Promise<void> {
  return idbClear(STORE_DEFERRED)
}

// ===== Storage Info =====

export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate()
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 }
  }
  return { usage: 0, quota: 0 }
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return navigator.storage.persist()
  }
  return false
}
